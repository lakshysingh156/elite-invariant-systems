// Server functions for the API reliability engine.
// Client-safe module — imports of *.server.ts happen inside handler bodies only.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function currentOrgId(supabase: any, userId: string): Promise<string> {
  const { data, error } = await supabase
    .from("organization_members")
    .select("org_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("No workspace found for user. Sign out and sign back in to bootstrap one.");
  return data.org_id as string;
}

export const getCurrentWorkspace = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const orgId = await currentOrgId(context.supabase, context.userId);
    const { data: org, error } = await context.supabase
      .from("organizations")
      .select("id, name, slug, created_at")
      .eq("id", orgId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return org;
  });

export const listApis = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const orgId = await currentOrgId(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("apis")
      .select("id, name, base_url, kind, tags, owning_team, monitor_interval, status, genome, current_version_id, last_checked, updated_at")
      .eq("org_id", orgId)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createApi = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        name: z.string().min(1).max(120),
        baseUrl: z.string().url(),
        kind: z.enum(["internal", "third-party"]).default("internal"),
        owningTeam: z.string().max(80).optional(),
        monitorInterval: z.enum(["5m", "15m", "1h", "6h", "24h"]).default("15m"),
        tags: z.array(z.string().max(40)).max(20).default([]),
      })
      .parse(raw),
  )
  .handler(async ({ context, data }) => {
    const orgId = await currentOrgId(context.supabase, context.userId);
    const { data: row, error } = await context.supabase
      .from("apis")
      .insert({
        org_id: orgId,
        name: data.name,
        base_url: data.baseUrl,
        kind: data.kind,
        owning_team: data.owningTeam ?? null,
        monitor_interval: data.monitorInterval,
        tags: data.tags,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id as string };
  });

export const getApiDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ apiId: z.string().uuid() }).parse(raw))
  .handler(async ({ context, data }) => {
    const { data: api, error } = await context.supabase
      .from("apis")
      .select("*")
      .eq("id", data.apiId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!api) return null;

    const [versionsRes, changesRes, endpointsRes] = await Promise.all([
      context.supabase
        .from("api_versions")
        .select("id, version, source, endpoint_count, change_count, breaking_count, is_current, created_at")
        .eq("api_id", data.apiId)
        .order("created_at", { ascending: false }),
      context.supabase
        .from("contract_changes")
        .select("id, severity, kind, endpoint_path, method, target, summary, before_snippet, after_snippet, created_at")
        .eq("api_id", data.apiId)
        .order("created_at", { ascending: false })
        .limit(50),
      context.supabase
        .from("endpoints")
        .select("id, method, path, operation_id")
        .eq("api_id", data.apiId)
        .eq("version_id", api.current_version_id ?? "00000000-0000-0000-0000-000000000000")
        .order("path"),
    ]);

    return {
      api,
      versions: versionsRes.data ?? [],
      changes: changesRes.data ?? [],
      endpoints: endpointsRes.data ?? [],
    };
  });

/**
 * Real spec-versioning flow backed by the semantic diff engine in ./openapi-diff.
 * Diffs the incoming spec against the current version, persists the new version,
 * its endpoints, and the classified contract changes, then rescores the API.
 */
export const submitSpecVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        apiId: z.string().uuid(),
        specText: z.string().min(2).max(5_000_000),
        versionLabel: z.string().max(80).optional(),
      })
      .parse(raw),
  )
  .handler(async ({ context, data }) => {
    const { diffOpenApiSpecs, summarizeSeverity } = await import("./openapi-diff");

    let spec: any;
    try {
      spec = JSON.parse(data.specText);
    } catch {
      throw new Error("Unable to parse spec — please paste valid JSON OpenAPI.");
    }
    if (!spec || typeof spec !== "object") throw new Error("Spec must be a JSON object.");

    const METHODS = ["get", "post", "put", "patch", "delete", "head", "options"];
    const flat: Array<{ method: string; path: string; operationId?: string; op: any }> = [];
    for (const [path, item] of Object.entries((spec.paths ?? {}) as Record<string, any>)) {
      for (const m of METHODS) {
        const op = (item as any)?.[m];
        if (op) flat.push({ method: m.toUpperCase(), path, operationId: op.operationId, op });
      }
    }

    const { data: api, error: apiErr } = await context.supabase
      .from("apis")
      .select("id, current_version_id")
      .eq("id", data.apiId)
      .maybeSingle();
    if (apiErr) throw new Error(apiErr.message);
    if (!api) throw new Error("API not found or you don't have access to it.");

    let previousSpec: any = {};
    let previousVersionId: string | null = null;
    if (api.current_version_id) {
      const { data: prev } = await context.supabase
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
    const label = data.versionLabel?.trim() || spec.info?.version || new Date().toISOString().slice(0, 10);

    if (previousVersionId) {
      await context.supabase.from("api_versions").update({ is_current: false }).eq("id", previousVersionId);
    }

    const { data: versionRow, error: vErr } = await context.supabase
      .from("api_versions")
      .insert({
        api_id: data.apiId,
        version: label,
        spec,
        source: "upload",
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
      const { error: eErr } = await context.supabase.from("endpoints").insert(
        flat.map((e) => ({
          version_id: versionId,
          api_id: data.apiId,
          method: e.method,
          path: e.path,
          operation_id: e.operationId ?? null,
          spec: e.op,
        })),
      );
      if (eErr) throw new Error(eErr.message);
    }

    if (changes.length) {
      const { error: cErr } = await context.supabase.from("contract_changes").insert(
        changes.map((c) => ({
          api_id: data.apiId,
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

    const { error: uErr } = await context.supabase
      .from("apis")
      .update({
        current_version_id: versionId,
        status,
        genome,
        last_checked: new Date().toISOString(),
      })
      .eq("id", data.apiId);
    if (uErr) throw new Error(uErr.message);

    return {
      versionId,
      versionLabel: label,
      endpointCount: flat.length,
      summary: { ...summary, total },
      status,
      genome,
    };
  });
