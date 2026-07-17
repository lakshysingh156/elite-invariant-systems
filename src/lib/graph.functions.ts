import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function orgId(supabase: any, userId: string) {
  const { data } = await supabase
    .from("organization_members")
    .select("org_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!data) throw new Error("No workspace");
  return data.org_id as string;
}

export const getReliabilityGraph = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const org = await orgId(context.supabase, context.userId);
    const [apisRes, depsRes] = await Promise.all([
      context.supabase
        .from("apis")
        .select("id, name, kind, status, genome")
        .eq("org_id", org),
      context.supabase
        .from("dependencies")
        .select("id, source_service, target_api_id, endpoint_path, method, weight")
        .eq("org_id", org),
    ]);
    if (apisRes.error) throw new Error(apisRes.error.message);

    const apis = apisRes.data ?? [];
    const deps = depsRes.data ?? [];

    const nodes: any[] = apis.map((a: any) => ({
      id: a.id,
      label: a.name,
      type: a.kind === "third-party" ? "external" : "api",
      status: a.status,
      health: a.genome ?? 90,
    }));

    // service nodes from dependency sources
    const services = new Set<string>();
    deps.forEach((d: any) => services.add(d.source_service));
    services.forEach((s) =>
      nodes.push({ id: `svc:${s}`, label: s, type: "service", status: "stable", health: 95 }),
    );

    const edges = deps.map((d: any) => ({
      source: `svc:${d.source_service}`,
      target: d.target_api_id,
      weight: d.weight ?? 1,
    }));

    // blast radius from each unstable API — BFS on reverse edges
    const reverse: Record<string, string[]> = {};
    edges.forEach((e) => {
      (reverse[e.target] ||= []).push(e.source);
    });
    const blast: Record<string, string[]> = {};
    apis
      .filter((a: any) => a.status === "breaking" || a.status === "drifting")
      .forEach((a: any) => {
        const seen = new Set<string>([a.id]);
        const queue = [a.id];
        while (queue.length) {
          const cur = queue.shift()!;
          for (const parent of reverse[cur] ?? []) {
            if (!seen.has(parent)) {
              seen.add(parent);
              queue.push(parent);
            }
          }
        }
        blast[a.id] = [...seen];
      });

    return { nodes, edges, blast };
  });

export const upsertDependency = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        sourceService: z.string().min(1),
        targetApiId: z.string().uuid(),
        endpointPath: z.string().optional(),
        method: z.string().optional(),
        weight: z.number().int().min(1).max(50).default(1),
      })
      .parse(raw),
  )
  .handler(async ({ context, data }) => {
    const org = await orgId(context.supabase, context.userId);
    const { error } = await context.supabase.from("dependencies").insert({
      org_id: org,
      source_service: data.sourceService,
      target_api_id: data.targetApiId,
      endpoint_path: data.endpointPath ?? null,
      method: data.method ?? null,
      weight: data.weight,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
