import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function orgRow(supabase: any, userId: string) {
  const { data } = await supabase
    .from("organization_members")
    .select("org_id, role, organizations(id, name, slug, owner_id, created_at)")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!data) throw new Error("No workspace");
  return data;
}

export const getWorkspaceSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const row = await orgRow(context.supabase, context.userId);
    const org = (row as any).organizations;

    const { data: members } = await context.supabase
      .from("organization_members")
      .select("id, user_id, role, created_at")
      .eq("org_id", row.org_id)
      .order("created_at", { ascending: true });

    const [{ count: apiCount }, { count: depCount }] = await Promise.all([
      context.supabase
        .from("apis")
        .select("id", { count: "exact", head: true })
        .eq("org_id", row.org_id),
      context.supabase
        .from("dependencies")
        .select("id", { count: "exact", head: true })
        .eq("org_id", row.org_id),
    ]);

    return {
      org,
      myRole: row.role as string,
      me: {
        id: context.userId,
        email: (context.claims as any)?.email ?? null,
      },
      members: (members ?? []).map((m: any) => ({
        ...m,
        isMe: m.user_id === context.userId,
      })),
      stats: { apiCount: apiCount ?? 0, depCount: depCount ?? 0 },
    };
  });

export const renameWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ name: z.string().min(2).max(60) }).parse(raw))
  .handler(async ({ context, data }) => {
    const row = await orgRow(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("organizations")
      .update({ name: data.name })
      .eq("id", row.org_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
