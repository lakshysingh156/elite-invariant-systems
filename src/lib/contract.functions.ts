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

export const getContractIntelligence = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ apiId: z.string().uuid().optional() }).parse(raw ?? {}),
  )
  .handler(async ({ context, data }) => {
    const org = await orgId(context.supabase, context.userId);

    const { data: apis, error: apisErr } = await context.supabase
      .from("apis")
      .select("id, name, status, current_version_id")
      .eq("org_id", org)
      .order("updated_at", { ascending: false });
    if (apisErr) throw new Error(apisErr.message);

    const list = apis ?? [];
    const selectedId = data.apiId ?? list[0]?.id ?? null;
    if (!selectedId) {
      return { apis: [], selectedId: null, versions: [], changes: [] };
    }

    const [versionsRes, changesRes] = await Promise.all([
      context.supabase
        .from("api_versions")
        .select("id, version, created_at, endpoint_count, breaking_count, change_count, is_current")
        .eq("api_id", selectedId)
        .order("created_at", { ascending: false })
        .limit(20),
      context.supabase
        .from("contract_changes")
        .select(
          "id, severity, kind, target, summary, endpoint_path, method, before_snippet, after_snippet, created_at",
        )
        .eq("api_id", selectedId)
        .order("created_at", { ascending: false })
        .limit(200),
    ]);

    return {
      apis: list,
      selectedId,
      versions: versionsRes.data ?? [],
      changes: changesRes.data ?? [],
    };
  });
