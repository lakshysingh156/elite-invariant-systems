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

export const listIncidents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const org = await orgId(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("incidents")
      .select("id, code, title, severity, status, summary, assignee, affected_services, affected_endpoints, opened_at, updated_at, api_id, apis(name)")
      .eq("org_id", org)
      .order("opened_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((i: any) => ({
      ...i,
      api_name: i.apis?.name ?? "—",
    }));
  });

export const getIncidentDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ incidentId: z.string().uuid() }).parse(raw))
  .handler(async ({ context, data }) => {
    const [incRes, evRes] = await Promise.all([
      context.supabase
        .from("incidents")
        .select("*, apis(name, base_url)")
        .eq("id", data.incidentId)
        .maybeSingle(),
      context.supabase
        .from("incident_events")
        .select("id, at, kind, label, detail")
        .eq("incident_id", data.incidentId)
        .order("at", { ascending: true }),
    ]);
    if (incRes.error) throw new Error(incRes.error.message);
    if (!incRes.data) return null;

    let changes: any[] = [];
    if (incRes.data.api_id) {
      const { data: chRes } = await context.supabase
        .from("contract_changes")
        .select("id, severity, kind, endpoint_path, method, target, summary, before_snippet, after_snippet, created_at")
        .eq("api_id", incRes.data.api_id)
        .order("created_at", { ascending: false })
        .limit(20);
      changes = chRes ?? [];
    }
    return {
      incident: { ...incRes.data, api_name: incRes.data.apis?.name ?? "—" },
      events: evRes.data ?? [],
      changes,
    };
  });

export const updateIncidentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        incidentId: z.string().uuid(),
        status: z.enum(["detected", "analyzing", "identified", "mitigating", "resolved"]),
      })
      .parse(raw),
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("incidents")
      .update({ status: data.status, updated_at: new Date().toISOString() })
      .eq("id", data.incidentId);
    if (error) throw new Error(error.message);
    await context.supabase.from("incident_events").insert({
      incident_id: data.incidentId,
      kind: data.status === "resolved" ? "stable" : "analyzing",
      label: `Status → ${data.status}`,
    });
    return { ok: true };
  });
