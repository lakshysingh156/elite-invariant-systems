// Single source of truth for: diff a spec against the API's current version,
// persist the new api_version + endpoints + contract_changes, rescore the API,
// and auto-open an incident on breaking changes.
//
// Used by both the manual upload flow (submitSpecVersion) and the scheduled
// monitor endpoint (/api/public/hooks/monitor-apis).

import { diffOpenApiSpecs, summarizeSeverity } from "./openapi-diff";

const HTTP_METHODS = ["get", "post", "put", "patch", "delete", "head", "options"];

export type ApplySpecDiffResult = {
  versionId: string;
  versionLabel: string;
  endpointCount: number;
  summary: { breaking: number; risky: number; safe: number; total: number };
  status: "stable" | "drifting" | "breaking";
  genome: number;
  incidentId: string | null;
};

export function parseSpecText(specText: string): any {
  let spec: any;
  try {
    spec = JSON.parse(specText);
  } catch {
    throw new Error("Unable to parse spec — please provide valid JSON OpenAPI.");
  }
  if (!spec || typeof spec !== "object") throw new Error("Spec must be a JSON object.");
  return spec;
}

function flattenOperations(spec: any) {
  const flat: Array<{ method: string; path: string; operationId?: string; op: any }> = [];
  for (const [path, item] of Object.entries((spec?.paths ?? {}) as Record<string, any>)) {
    for (const m of HTTP_METHODS) {
      const op = (item as any)?.[m];
      if (op) flat.push({ method: m.toUpperCase(), path, operationId: op.operationId, op });
    }
  }
  return flat;
}

export async function applySpecDiff(
  supabase: any,
  apiId: string,
  specText: string,
  versionLabel?: string,
  source: "upload" | "monitor" = "upload",
): Promise<ApplySpecDiffResult> {
  const spec = parseSpecText(specText);
  const flat = flattenOperations(spec);

  const { data: api, error: apiErr } = await supabase
    .from("apis")
    .select("id, name, org_id, current_version_id, github_repo")
    .eq("id", apiId)
    .maybeSingle();
  if (apiErr) throw new Error(apiErr.message);
  if (!api) throw new Error("API not found or you don't have access to it.");

  let previousSpec: any = {};
  let previousVersionId: string | null = null;
  if (api.current_version_id) {
    const { data: prev } = await supabase
      .from("api_versions")
      .select("id, spec")
      .eq("id", api.current_version_id)
      .maybeSingle();
    if (prev) {
      previousSpec = prev.spec ?? {};
      previousVersionId = prev.id as string;
    }
  }

  const changes = diffOpenApiSpecs(previousSpec, spec);
  const summary = summarizeSeverity(changes);
  const total = changes.length;
  const label =
    versionLabel?.trim() || spec.info?.version || new Date().toISOString().slice(0, 10);

  if (previousVersionId) {
    await supabase.from("api_versions").update({ is_current: false }).eq("id", previousVersionId);
  }

  const { data: versionRow, error: vErr } = await supabase
    .from("api_versions")
    .insert({
      api_id: apiId,
      version: label,
      spec,
      source,
      endpoint_count: flat.length,
      change_count: total,
      breaking_count: summary.breaking,
      is_current: true,
    })
    .select("id")
    .single();
  if (vErr) throw new Error(vErr.message);
  const versionId = versionRow.id as string;

  if (flat.length) {
    const { error: eErr } = await supabase.from("endpoints").insert(
      flat.map((e) => ({
        version_id: versionId,
        api_id: apiId,
        method: e.method,
        path: e.path,
        operation_id: e.operationId ?? null,
        spec: e.op,
      })),
    );
    if (eErr) throw new Error(eErr.message);
  }

  if (changes.length) {
    const { error: cErr } = await supabase.from("contract_changes").insert(
      changes.map((c) => ({
        api_id: apiId,
        from_version_id: previousVersionId,
        to_version_id: versionId,
        severity: c.severity,
        kind: c.kind,
        endpoint_path: c.endpoint_path,
        method: c.method,
        target: c.target,
        summary: c.summary,
        before_snippet: c.before_snippet,
        after_snippet: c.after_snippet,
      })),
    );
    if (cErr) throw new Error(cErr.message);
  }

  const status: "stable" | "drifting" | "breaking" =
    summary.breaking > 0 ? "breaking" : summary.risky > 0 ? "drifting" : "stable";
  const genome = Math.max(0, 100 - summary.breaking * 15 - summary.risky * 5);

  const { error: uErr } = await supabase
    .from("apis")
    .update({
      current_version_id: versionId,
      status,
      genome,
      last_checked: new Date().toISOString(),
    })
    .eq("id", apiId);
  if (uErr) throw new Error(uErr.message);

  let incidentId: string | null = null;
  if (summary.breaking > 0) {
    const affected = new Set(
      changes.filter((c) => c.severity === "breaking").map((c) => c.endpoint_path),
    ).size;
    const { data: inc } = await supabase
      .from("incidents")
      .insert({
        org_id: api.org_id,
        api_id: apiId,
        code: `INC-${Date.now()}`,
        title: `Breaking change detected: ${api.name}`,
        severity: "critical",
        status: "detected",
        summary: `Version ${label} introduced ${summary.breaking} breaking change${
          summary.breaking > 1 ? "s" : ""
        } (${summary.risky} risky, ${summary.safe} safe) across ${affected} endpoint${
          affected === 1 ? "" : "s"
        }.`,
        affected_endpoints: affected,
      })
      .select("id")
      .maybeSingle();
    incidentId = (inc?.id as string) ?? null;

    if (incidentId) {
      await supabase.from("incident_events").insert([
        {
          incident_id: incidentId,
          kind: "breaking",
          label: "Contract diff completed",
          detail: `${summary.breaking} breaking changes across ${affected} endpoints`,
        },
      ]);

      // Real GitHub PR with a migration note for the breaking changes.
      if (api.github_repo && process.env["GITHUB_TOKEN"]) {
        try {
          const { openBreakingChangePr } = await import("./github-pr.server");
          const pr = await openBreakingChangePr({
            repo: api.github_repo as string,
            apiName: api.name as string,
            versionLabel: label,
            changes: changes
              .filter((c) => c.severity === "breaking")
              .map((c) => ({
                endpoint_path: c.endpoint_path ?? null,
                method: c.method ?? null,
                target: c.target,
                summary: c.summary,
              })),
          });
          if (pr) {
            await supabase
              .from("incidents")
              .update({ github_pr_url: pr.url, github_pr_number: pr.number })
              .eq("id", incidentId);
            await supabase.from("incident_events").insert([
              {
                incident_id: incidentId,
                kind: "github",
                label: "Pull request opened",
                detail: pr.url,
              },
            ]);
          }
        } catch (e) {
          console.error("[invariant] GitHub PR creation failed:", e);
        }
      }
    }
  }

  return {
    versionId,
    versionLabel: label,
    endpointCount: flat.length,
    summary: { ...summary, total },
    status,
    genome,
    incidentId,
  };
}

/** Whether an api row is due for a scheduled re-check, per its monitor_interval. */
export function isDue(monitorInterval: string, lastChecked: string | null): boolean {
  if (!lastChecked) return true;
  const minutes: Record<string, number> = { "5m": 5, "15m": 15, "1h": 60, "6h": 360, "24h": 1440 };
  const gap = (minutes[monitorInterval] ?? 15) * 60_000;
  return Date.now() - new Date(lastChecked).getTime() >= gap;
}
