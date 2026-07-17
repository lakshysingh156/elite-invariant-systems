import { createServerFn } from "@tanstack/react-start";
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

export const getDashboardOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const org = await orgId(context.supabase, context.userId);

    const since30 = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

    const [apisRes, incRes, changesRes, changes30Res, depsRes, recentChanges, recentIncidents] =
      await Promise.all([
        context.supabase
          .from("apis")
          .select("id, name, status, genome, kind, current_version_id, last_checked, updated_at")
          .eq("org_id", org)
          .order("updated_at", { ascending: false }),
        context.supabase
          .from("incidents")
          .select("id, code, title, severity, status, opened_at, updated_at, affected_endpoints")
          .eq("org_id", org)
          .neq("status", "resolved")
          .order("opened_at", { ascending: false })
          .limit(6),
        context.supabase
          .from("contract_changes")
          .select("severity", { count: "exact", head: false }),
        context.supabase
          .from("contract_changes")
          .select("severity")
          .gte("created_at", since30),
        context.supabase.from("dependencies").select("id", { count: "exact", head: true }).eq("org_id", org),
        context.supabase
          .from("contract_changes")
          .select("id, severity, kind, target, summary, endpoint_path, method, created_at, api_id, apis(name)")
          .order("created_at", { ascending: false })
          .limit(12),
        context.supabase
          .from("incidents")
          .select("id, code, title, severity, opened_at")
          .eq("org_id", org)
          .order("opened_at", { ascending: false })
          .limit(4),
      ]);

    const apis = apisRes.data ?? [];
    const changesAll = changesRes.data ?? [];
    const changes30 = changes30Res.data ?? [];

    const avgGenome = apis.length
      ? Math.round(apis.reduce((s: number, a: any) => s + (a.genome ?? 0), 0) / apis.length)
      : 0;

    const statusCounts = {
      stable: apis.filter((a: any) => a.status === "stable").length,
      drifting: apis.filter((a: any) => a.status === "drifting").length,
      breaking: apis.filter((a: any) => a.status === "breaking").length,
      analyzing: apis.filter((a: any) => a.status === "analyzing").length,
    };

    const stats = {
      apiCount: apis.length,
      vendorCount: apis.filter((a: any) => a.kind === "third-party").length,
      internalCount: apis.filter((a: any) => a.kind === "internal").length,
      dependencyCount: depsRes.count ?? 0,
      changes30d: changes30.length,
      breaking30d: changes30.filter((c: any) => c.severity === "breaking").length,
      risky30d: changes30.filter((c: any) => c.severity === "risky").length,
      totalChanges: changesAll.length,
      openIncidents: incRes.data?.length ?? 0,
      avgGenome,
      statusCounts,
    };

    return {
      stats,
      apis,
      openIncidents: incRes.data ?? [],
      recentIncidents: recentIncidents.data ?? [],
      recentChanges: (recentChanges.data ?? []).map((c: any) => ({
        ...c,
        api_name: c.apis?.name ?? "—",
      })),
    };
  });
