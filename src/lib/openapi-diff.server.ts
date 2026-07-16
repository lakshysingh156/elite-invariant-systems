// Semantic OpenAPI diff. Server-only.
// Given two OpenAPI-ish specs, produce a list of contract changes classified by severity.

export type ChangeSeverity = "breaking" | "risky" | "safe";
export type ChangeKind = "added" | "removed" | "modified";

export interface SemanticChange {
  severity: ChangeSeverity;
  kind: ChangeKind;
  endpointPath: string | null;
  method: string | null;
  target: string;
  summary: string;
  beforeSnippet?: string;
  afterSnippet?: string;
}

type OperationLike = {
  operationId?: string;
  parameters?: Array<{ name: string; in: string; required?: boolean; schema?: unknown }>;
  requestBody?: { required?: boolean; content?: Record<string, { schema?: unknown }> };
  responses?: Record<string, { content?: Record<string, { schema?: unknown }> }>;
  security?: unknown;
};

type PathItem = Partial<Record<string, OperationLike>>;
type Spec = {
  paths?: Record<string, PathItem>;
  info?: { version?: string; title?: string };
};

const METHODS = ["get", "post", "put", "patch", "delete", "options", "head"] as const;

export function parseOpenApi(raw: string): Spec {
  try {
    return JSON.parse(raw) as Spec;
  } catch {
    // ultra-light YAML fallback: only object-with-paths style
    throw new Error("Unable to parse spec — please upload JSON OpenAPI.");
  }
}

export function countEndpoints(spec: Spec): number {
  let n = 0;
  for (const path of Object.values(spec.paths ?? {})) {
    for (const m of METHODS) if (path?.[m]) n++;
  }
  return n;
}

export function flattenEndpoints(spec: Spec): Array<{
  method: string;
  path: string;
  operationId?: string;
  spec: OperationLike;
}> {
  const out: Array<{ method: string; path: string; operationId?: string; spec: OperationLike }> = [];
  for (const [path, item] of Object.entries(spec.paths ?? {})) {
    for (const m of METHODS) {
      const op = item?.[m];
      if (!op) continue;
      out.push({ method: m.toUpperCase(), path, operationId: op.operationId, spec: op });
    }
  }
  return out;
}

function shortJson(v: unknown, max = 220): string {
  try {
    const s = typeof v === "string" ? v : JSON.stringify(v, null, 2);
    return s.length > max ? s.slice(0, max) + "…" : s;
  } catch {
    return String(v);
  }
}

function schemaSignature(schema: unknown): string {
  if (!schema || typeof schema !== "object") return String(schema ?? "");
  const s = schema as { type?: string; enum?: unknown[]; format?: string };
  return `${s.type ?? "?"}${s.format ? "/" + s.format : ""}${s.enum ? "|enum(" + s.enum.length + ")" : ""}`;
}

export function diffSpecs(before: Spec | null, after: Spec): SemanticChange[] {
  const changes: SemanticChange[] = [];
  const beforePaths = before?.paths ?? {};
  const afterPaths = after.paths ?? {};

  const allPaths = new Set([...Object.keys(beforePaths), ...Object.keys(afterPaths)]);

  for (const p of allPaths) {
    const b = beforePaths[p];
    const a = afterPaths[p];

    if (!b && a) {
      for (const m of METHODS) {
        if (a[m]) {
          changes.push({
            severity: "safe",
            kind: "added",
            endpointPath: p,
            method: m.toUpperCase(),
            target: `${m.toUpperCase()} ${p}`,
            summary: "New endpoint added — backward compatible.",
            afterSnippet: shortJson(a[m]),
          });
        }
      }
      continue;
    }
    if (b && !a) {
      for (const m of METHODS) {
        if (b[m]) {
          changes.push({
            severity: "breaking",
            kind: "removed",
            endpointPath: p,
            method: m.toUpperCase(),
            target: `${m.toUpperCase()} ${p}`,
            summary: "Endpoint removed — consumers will 404.",
            beforeSnippet: shortJson(b[m]),
          });
        }
      }
      continue;
    }

    // both present
    for (const m of METHODS) {
      const bo = b?.[m];
      const ao = a?.[m];
      if (!bo && !ao) continue;
      if (!bo && ao) {
        changes.push({
          severity: "safe",
          kind: "added",
          endpointPath: p,
          method: m.toUpperCase(),
          target: `${m.toUpperCase()} ${p}`,
          summary: "New method added on existing path.",
          afterSnippet: shortJson(ao),
        });
        continue;
      }
      if (bo && !ao) {
        changes.push({
          severity: "breaking",
          kind: "removed",
          endpointPath: p,
          method: m.toUpperCase(),
          target: `${m.toUpperCase()} ${p}`,
          summary: "Method removed — consumers will 405/404.",
          beforeSnippet: shortJson(bo),
        });
        continue;
      }
      if (bo && ao) diffOperation(m.toUpperCase(), p, bo, ao, changes);
    }
  }

  return changes;
}

function diffOperation(
  method: string,
  path: string,
  b: OperationLike,
  a: OperationLike,
  out: SemanticChange[],
): void {
  const bParams = new Map((b.parameters ?? []).map((p) => [`${p.in}:${p.name}`, p]));
  const aParams = new Map((a.parameters ?? []).map((p) => [`${p.in}:${p.name}`, p]));

  for (const [k, bp] of bParams) {
    const ap = aParams.get(k);
    if (!ap) {
      out.push({
        severity: bp.required ? "breaking" : "risky",
        kind: "removed",
        endpointPath: path,
        method,
        target: `${method} ${path} → param ${k}`,
        summary: bp.required
          ? "Required parameter removed."
          : "Optional parameter removed — may still break strict clients.",
        beforeSnippet: shortJson(bp),
      });
      continue;
    }
    const bSig = schemaSignature(bp.schema);
    const aSig = schemaSignature(ap.schema);
    if (bSig !== aSig) {
      out.push({
        severity: "breaking",
        kind: "modified",
        endpointPath: path,
        method,
        target: `${method} ${path} → param ${k}`,
        summary: `Parameter type changed (${bSig} → ${aSig}).`,
        beforeSnippet: shortJson(bp),
        afterSnippet: shortJson(ap),
      });
    }
    if (!bp.required && ap.required) {
      out.push({
        severity: "breaking",
        kind: "modified",
        endpointPath: path,
        method,
        target: `${method} ${path} → param ${k}`,
        summary: "Parameter became required.",
        beforeSnippet: shortJson(bp),
        afterSnippet: shortJson(ap),
      });
    }
  }
  for (const [k, ap] of aParams) {
    if (!bParams.has(k)) {
      out.push({
        severity: ap.required ? "breaking" : "safe",
        kind: "added",
        endpointPath: path,
        method,
        target: `${method} ${path} → param ${k}`,
        summary: ap.required
          ? "New required parameter added — old clients will fail."
          : "New optional parameter added.",
        afterSnippet: shortJson(ap),
      });
    }
  }

  // response status codes
  const bResp = Object.keys(b.responses ?? {});
  const aResp = Object.keys(a.responses ?? {});
  for (const s of bResp) {
    if (!aResp.includes(s)) {
      out.push({
        severity: s.startsWith("2") ? "breaking" : "risky",
        kind: "removed",
        endpointPath: path,
        method,
        target: `${method} ${path} → response ${s}`,
        summary: "Response status removed.",
      });
    }
  }
  for (const s of aResp) {
    if (!bResp.includes(s)) {
      out.push({
        severity: "safe",
        kind: "added",
        endpointPath: path,
        method,
        target: `${method} ${path} → response ${s}`,
        summary: "New response status added.",
      });
    }
  }

  // requestBody required flip
  if (b.requestBody?.required !== a.requestBody?.required) {
    out.push({
      severity: a.requestBody?.required ? "breaking" : "safe",
      kind: "modified",
      endpointPath: path,
      method,
      target: `${method} ${path} → requestBody.required`,
      summary: a.requestBody?.required
        ? "Request body is now required."
        : "Request body is no longer required.",
    });
  }

  // security
  const bSec = JSON.stringify(b.security ?? null);
  const aSec = JSON.stringify(a.security ?? null);
  if (bSec !== aSec) {
    out.push({
      severity: "breaking",
      kind: "modified",
      endpointPath: path,
      method,
      target: `${method} ${path} → security`,
      summary: "Auth requirements changed.",
      beforeSnippet: shortJson(b.security),
      afterSnippet: shortJson(a.security),
    });
  }
}

export function summarizeSeverity(changes: SemanticChange[]) {
  let breaking = 0;
  let risky = 0;
  let safe = 0;
  for (const c of changes) {
    if (c.severity === "breaking") breaking++;
    else if (c.severity === "risky") risky++;
    else safe++;
  }
  return { breaking, risky, safe, total: changes.length };
}
