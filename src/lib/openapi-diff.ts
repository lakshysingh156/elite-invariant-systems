// Semantic OpenAPI diff engine.
// Compares two OpenAPI 3.x spec objects and produces classified contract changes,
// matching the shape of the `contract_changes` table (severity/kind/target/summary/snippets).

type Severity = "breaking" | "risky" | "safe";
type Kind = "added" | "removed" | "modified";

export interface ContractChangeDraft {
  severity: Severity;
  kind: Kind;
  endpoint_path: string;
  method: string | null;
  target: string; // e.g. "response.200.body.outcome.seller_message" or "operation" or "parameter.limit"
  summary: string;
  before_snippet: string | null;
  after_snippet: string | null;
}

type JsonSchema = {
  type?: string;
  required?: string[];
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  enum?: unknown[];
  [k: string]: unknown;
};

type Operation = {
  operationId?: string;
  parameters?: Array<{ name: string; in: string; required?: boolean; schema?: JsonSchema }>;
  requestBody?: { content?: Record<string, { schema?: JsonSchema }> };
  responses?: Record<string, { description?: string; content?: Record<string, { schema?: JsonSchema }> }>;
};

type OpenApiSpec = {
  paths?: Record<string, Record<string, Operation>>;
};

const HTTP_METHODS = ["get", "post", "put", "patch", "delete", "head", "options"];

function snippet(x: unknown): string {
  try {
    return JSON.stringify(x, null, 2);
  } catch {
    return String(x);
  }
}

/** Diff two JSON schemas at a given field path, pushing changes into `out`. */
function diffSchema(
  before: JsonSchema | undefined,
  after: JsonSchema | undefined,
  path: string,
  endpointPath: string,
  method: string,
  out: ContractChangeDraft[],
) {
  if (!before && !after) return;

  if (before && !after) {
    out.push({
      severity: "breaking",
      kind: "removed",
      endpoint_path: endpointPath,
      method,
      target: path,
      summary: `Field "${path}" was removed from the schema.`,
      before_snippet: snippet(before),
      after_snippet: null,
    });
    return;
  }

  if (!before && after) {
    out.push({
      severity: "safe",
      kind: "added",
      endpoint_path: endpointPath,
      method,
      target: path,
      summary: `Field "${path}" was added to the schema.`,
      before_snippet: null,
      after_snippet: snippet(after),
    });
    return;
  }

  // Both exist — check type change
  if (before!.type && after!.type && before!.type !== after!.type) {
    out.push({
      severity: "breaking",
      kind: "modified",
      endpoint_path: endpointPath,
      method,
      target: path,
      summary: `Type of "${path}" changed from ${before!.type} to ${after!.type}.`,
      before_snippet: snippet(before),
      after_snippet: snippet(after),
    });
  }

  // Enum shrink is breaking (consumers relying on removed values break),
  // enum growth is safe (additive).
  if (before!.enum || after!.enum) {
    const beforeSet = new Set(before!.enum ?? []);
    const afterSet = new Set(after!.enum ?? []);
    const removedValues = [...beforeSet].filter((v) => !afterSet.has(v));
    const addedValues = [...afterSet].filter((v) => !beforeSet.has(v));
    if (removedValues.length) {
      out.push({
        severity: "breaking",
        kind: "modified",
        endpoint_path: endpointPath,
        method,
        target: path,
        summary: `Enum values removed from "${path}": ${removedValues.join(", ")}.`,
        before_snippet: snippet(before!.enum),
        after_snippet: snippet(after!.enum),
      });
    }
    if (addedValues.length) {
      out.push({
        severity: "safe",
        kind: "modified",
        endpoint_path: endpointPath,
        method,
        target: path,
        summary: `Enum values added to "${path}": ${addedValues.join(", ")}.`,
        before_snippet: snippet(before!.enum),
        after_snippet: snippet(after!.enum),
      });
    }
  }

  // Required field changes within an object schema
  const beforeRequired = new Set(before!.required ?? []);
  const afterRequired = new Set(after!.required ?? []);
  const beforeProps = before!.properties ?? {};
  const afterProps = after!.properties ?? {};
  const allKeys = new Set([...Object.keys(beforeProps), ...Object.keys(afterProps)]);

  for (const key of allKeys) {
    const childPath = `${path}.${key}`;
    const wasRequired = beforeRequired.has(key);
    const isRequired = afterRequired.has(key);

    if (!(key in beforeProps) && key in afterProps) {
      out.push({
        severity: isRequired ? "breaking" : "safe",
        kind: "added",
        endpoint_path: endpointPath,
        method,
        target: childPath,
        summary: isRequired
          ? `New required field "${childPath}" added — old clients that don't send/expect it will break.`
          : `New optional field "${childPath}" added.`,
        before_snippet: null,
        after_snippet: snippet(afterProps[key]),
      });
      continue;
    }

    if (key in beforeProps && !(key in afterProps)) {
      out.push({
        severity: "breaking",
        kind: "removed",
        endpoint_path: endpointPath,
        method,
        target: childPath,
        summary: `Field "${childPath}" was removed.`,
        before_snippet: snippet(beforeProps[key]),
        after_snippet: null,
      });
      continue;
    }

    // Required-ness flip on a still-present field
    if (wasRequired && !isRequired) {
      out.push({
        severity: "risky",
        kind: "modified",
        endpoint_path: endpointPath,
        method,
        target: childPath,
        summary: `Field "${childPath}" changed from required to optional.`,
        before_snippet: null,
        after_snippet: null,
      });
    } else if (!wasRequired && isRequired) {
      out.push({
        severity: "breaking",
        kind: "modified",
        endpoint_path: endpointPath,
        method,
        target: childPath,
        summary: `Field "${childPath}" changed from optional to required — old clients omitting it will break.`,
        before_snippet: null,
        after_snippet: null,
      });
    }

    // Recurse into nested object/array schemas
    diffSchema(beforeProps[key], afterProps[key], childPath, endpointPath, method, out);
  }

  // Array item schema
  if (before!.items || after!.items) {
    diffSchema(before!.items, after!.items, `${path}[]`, endpointPath, method, out);
  }
}

function diffOperation(
  before: Operation | undefined,
  after: Operation | undefined,
  endpointPath: string,
  method: string,
  out: ContractChangeDraft[],
) {
  if (before && !after) {
    out.push({
      severity: "breaking",
      kind: "removed",
      endpoint_path: endpointPath,
      method,
      target: "operation",
      summary: `Operation ${method.toUpperCase()} ${endpointPath} was removed entirely.`,
      before_snippet: snippet(before),
      after_snippet: null,
    });
    return;
  }
  if (!before && after) {
    out.push({
      severity: "safe",
      kind: "added",
      endpoint_path: endpointPath,
      method,
      target: "operation",
      summary: `New operation ${method.toUpperCase()} ${endpointPath} was added.`,
      before_snippet: null,
      after_snippet: snippet(after),
    });
    return;
  }
  if (!before || !after) return;

  // Parameters
  const beforeParams = new Map((before.parameters ?? []).map((p) => [`${p.in}:${p.name}`, p]));
  const afterParams = new Map((after.parameters ?? []).map((p) => [`${p.in}:${p.name}`, p]));
  const allParamKeys = new Set([...beforeParams.keys(), ...afterParams.keys()]);

  for (const key of allParamKeys) {
    const b = beforeParams.get(key);
    const a = afterParams.get(key);
    const label = key.split(":")[1];

    if (b && !a) {
      out.push({
        severity: b.required ? "breaking" : "risky",
        kind: "removed",
        endpoint_path: endpointPath,
        method,
        target: `parameter.${label}`,
        summary: `Parameter "${label}" was removed.`,
        before_snippet: snippet(b),
        after_snippet: null,
      });
    } else if (!b && a) {
      out.push({
        severity: a.required ? "breaking" : "safe",
        kind: "added",
        endpoint_path: endpointPath,
        method,
        target: `parameter.${label}`,
        summary: a.required
          ? `New required parameter "${label}" added — existing callers will break.`
          : `New optional parameter "${label}" added.`,
        before_snippet: null,
        after_snippet: snippet(a),
      });
    } else if (b && a && !b.required && a.required) {
      out.push({
        severity: "breaking",
        kind: "modified",
        endpoint_path: endpointPath,
        method,
        target: `parameter.${label}`,
        summary: `Parameter "${label}" changed from optional to required.`,
        before_snippet: null,
        after_snippet: null,
      });
    }
  }

  // Request body schema
  const beforeBodySchema = before.requestBody?.content?.["application/json"]?.schema;
  const afterBodySchema = after.requestBody?.content?.["application/json"]?.schema;
  diffSchema(beforeBodySchema, afterBodySchema, "requestBody", endpointPath, method, out);

  // Response schemas (per status code)
  const beforeResponses = before.responses ?? {};
  const afterResponses = after.responses ?? {};
  const allStatusCodes = new Set([...Object.keys(beforeResponses), ...Object.keys(afterResponses)]);

  for (const status of allStatusCodes) {
    const b = beforeResponses[status]?.content?.["application/json"]?.schema;
    const a = afterResponses[status]?.content?.["application/json"]?.schema;
    diffSchema(b, a, `response.${status}`, endpointPath, method, out);
  }
}

/**
 * Diff two OpenAPI specs and return a flat list of classified contract changes,
 * ready to insert into `contract_changes` (minus id/api_id/version_id which the
 * caller attaches).
 */
export function diffOpenApiSpecs(before: OpenApiSpec, after: OpenApiSpec): ContractChangeDraft[] {
  const out: ContractChangeDraft[] = [];
  const beforePaths = before.paths ?? {};
  const afterPaths = after.paths ?? {};
  const allPaths = new Set([...Object.keys(beforePaths), ...Object.keys(afterPaths)]);

  for (const path of allPaths) {
    const beforeOps = beforePaths[path] ?? {};
    const afterOps = afterPaths[path] ?? {};
    const allMethods = new Set([
      ...Object.keys(beforeOps).filter((m) => HTTP_METHODS.includes(m)),
      ...Object.keys(afterOps).filter((m) => HTTP_METHODS.includes(m)),
    ]);
    for (const method of allMethods) {
      diffOperation(beforeOps[method], afterOps[method], path, method, out);
    }
  }

  return out;
}

/** Convenience: roll a change list up into { breaking, risky, safe } counts. */
export function summarizeSeverity(changes: ContractChangeDraft[]) {
  return {
    breaking: changes.filter((c) => c.severity === "breaking").length,
    risky: changes.filter((c) => c.severity === "risky").length,
    safe: changes.filter((c) => c.severity === "safe").length,
  };
}
