import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Creates a few empty APIs so the workspace isn't blank on first load.
 * No fake versions or contract changes — feed real OpenAPI specs through the
 * "Upload new spec version" flow to generate real diffs.
 */
export const seedDemoWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: membership } = await context.supabase
      .from("organization_members")
      .select("org_id")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (!membership) throw new Error("No workspace");
    const org = membership.org_id as string;

    const { data: existing } = await context.supabase
      .from("apis")
      .select("id")
      .eq("org_id", org)
      .limit(1);
    if (existing && existing.length) return { skipped: true, message: "Workspace already has APIs." };

    const rows = [
      {
        org_id: org,
        name: "Stripe Payments",
        base_url: "https://api.stripe.com/v1",
        kind: "third-party" as const,
        owning_team: "Payments",
        tags: ["payments", "vendor", "critical"],
      },
      {
        org_id: org,
        name: "Twilio Messaging",
        base_url: "https://api.twilio.com",
        kind: "third-party" as const,
        owning_team: "Notifications",
        tags: ["comms", "vendor"],
      },
      {
        org_id: org,
        name: "Orders API",
        base_url: "https://orders.internal.acme",
        kind: "internal" as const,
        owning_team: "Commerce",
        tags: ["internal", "core"],
      },
    ];

    const { data: created, error } = await context.supabase.from("apis").insert(rows).select("id, name");
    if (error) throw new Error(error.message);

    return {
      skipped: false,
      apis: created ?? [],
      message: "Created starter APIs — upload an OpenAPI spec version to generate real contract diffs.",
    };
  });
