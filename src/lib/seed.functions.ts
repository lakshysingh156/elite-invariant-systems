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

const specV1 = {
  openapi: "3.0.0",
  info: { title: "Stripe Payments", version: "2026-06-01" },
  paths: {
    "/v1/charges": {
      post: {
        operationId: "createCharge",
        responses: {
          "200": {
            description: "ok",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["id", "amount", "outcome"],
                  properties: {
                    id: { type: "string" },
                    amount: { type: "integer" },
                    outcome: {
                      type: "object",
                      properties: { seller_message: { type: "string" }, network_status: { type: "string" } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/v1/customers": {
      get: { operationId: "listCustomers", responses: { "200": { description: "ok" } } },
    },
  },
};

const specV2 = {
  openapi: "3.0.0",
  info: { title: "Stripe Payments", version: "2026-07-16" },
  paths: {
    "/v1/charges": {
      post: {
        operationId: "createCharge",
        parameters: [{ in: "header", name: "Stripe-Version", required: true, schema: { type: "string" } }],
        responses: {
          "200": {
            description: "ok",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["id", "amount"],
                  properties: {
                    id: { type: "string" },
                    amount: { type: "string" },
                    outcome: {
                      type: "object",
                      properties: { network_status: { type: "string" } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/v1/customers": {
      get: { operationId: "listCustomers", responses: { "200": { description: "ok" } } },
    },
    "/v1/payment_intents": {
      post: { operationId: "createPaymentIntent", responses: { "200": { description: "ok" } } },
    },
  },
};

const twilioSpec = {
  openapi: "3.0.0",
  info: { title: "Twilio Messaging", version: "2026-05-01" },
  paths: {
    "/2010-04-01/Messages.json": {
      post: { operationId: "sendMessage", responses: { "201": { description: "created" } } },
    },
  },
};

const internalSpec = {
  openapi: "3.0.0",
  info: { title: "Orders API", version: "1.4.0" },
  paths: {
    "/orders": { get: { operationId: "listOrders", responses: { "200": { description: "ok" } } } },
    "/orders/{id}": { get: { operationId: "getOrder", responses: { "200": { description: "ok" } } } },
    "/orders/{id}/refund": { post: { operationId: "refundOrder", responses: { "200": { description: "ok" } } } },
  },
};

export const seedDemoWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { parseOpenApi, flattenEndpoints, diffSpecs, countEndpoints, summarizeSeverity } =
      await import("./openapi-diff.server");
    const org = await orgId(context.supabase, context.userId);

    // Idempotency: skip if there are already APIs
    const { data: existing } = await context.supabase
      .from("apis")
      .select("id")
      .eq("org_id", org)
      .limit(1);
    if (existing && existing.length) return { skipped: true, message: "Demo data already present." };

    const apis = [
      { name: "Stripe Payments", base_url: "https://api.stripe.com/v1", kind: "third-party", owning_team: "Payments", tags: ["payments", "vendor", "critical"], specs: [specV1, specV2] },
      { name: "Twilio Messaging", base_url: "https://api.twilio.com", kind: "third-party", owning_team: "Notifications", tags: ["comms", "vendor"], specs: [twilioSpec] },
      { name: "Orders API", base_url: "https://orders.internal.acme", kind: "internal", owning_team: "Commerce", tags: ["internal", "core"], specs: [internalSpec] },
    ];

    const createdApis: { id: string; name: string }[] = [];

    for (const a of apis) {
      const { data: apiRow, error: apiErr } = await context.supabase
        .from("apis")
        .insert({
          org_id: org,
          name: a.name,
          base_url: a.base_url,
          kind: a.kind,
          owning_team: a.owning_team,
          tags: a.tags,
        })
        .select("id")
        .single();
      if (apiErr) throw new Error(apiErr.message);
      const apiId = apiRow.id as string;
      createdApis.push({ id: apiId, name: a.name });

      let previousSpec: any = null;
      let previousVersionId: string | null = null;

      for (const raw of a.specs) {
        const spec = parseOpenApi(JSON.stringify(raw));
        const changes = diffSpecs(previousSpec, spec);
        const summary = summarizeSeverity(changes);
        const endpointCount = countEndpoints(spec);
        const label = spec.info?.version ?? new Date().toISOString().slice(0, 10);

        if (previousVersionId) {
          await context.supabase.from("api_versions").update({ is_current: false }).eq("id", previousVersionId);
        }

        const { data: v } = await context.supabase
          .from("api_versions")
          .insert({
            api_id: apiId,
            version: label,
            spec: spec as any,
            source: "seed",
            endpoint_count: endpointCount,
            change_count: summary.total,
            breaking_count: summary.breaking,
            is_current: true,
          })
          .select("id")
          .single();
        const versionId = v!.id as string;

        const flat = flattenEndpoints(spec);
        if (flat.length) {
          await context.supabase.from("endpoints").insert(
            flat.map((e) => ({
              version_id: versionId,
              api_id: apiId,
              method: e.method,
              path: e.path,
              operation_id: e.operationId ?? null,
              spec: e.spec as any,
            })),
          );
        }

        if (changes.length) {
          await context.supabase.from("contract_changes").insert(
            changes.map((c) => ({
              api_id: apiId,
              from_version_id: previousVersionId,
              to_version_id: versionId,
              severity: c.severity,
              kind: c.kind,
              endpoint_path: c.endpointPath,
              method: c.method,
              target: c.target,
              summary: c.summary,
              before_snippet: c.beforeSnippet ?? null,
              after_snippet: c.afterSnippet ?? null,
            })),
          );
        }

        const genome = Math.max(0, 100 - summary.breaking * 12 - summary.risky * 4);
        const status: "stable" | "drifting" | "breaking" =
          summary.breaking > 0 ? "breaking" : summary.risky > 0 ? "drifting" : "stable";
        await context.supabase
          .from("apis")
          .update({
            current_version_id: versionId,
            status,
            genome,
            last_checked: new Date().toISOString(),
          })
          .eq("id", apiId);

        if (summary.breaking > 0) {
          const code = `INV-${Math.floor(Math.random() * 9000 + 1000)}`;
          const { data: inc } = await context.supabase
            .from("incidents")
            .insert({
              org_id: org,
              api_id: apiId,
              code,
              title: `${summary.breaking} breaking change${summary.breaking > 1 ? "s" : ""} in ${a.name}`,
              severity: summary.breaking >= 3 ? "critical" : "high",
              status: "mitigating",
              assignee: "Maya Chen",
              summary: `${a.name} shipped version ${label}: ${summary.breaking} breaking, ${summary.risky} risky, ${summary.safe} safe changes.`,
              root_cause: "Vendor removed required response fields and changed a scalar type without a version bump.",
              affected_services: 3,
              affected_endpoints: summary.breaking * 4,
            })
            .select("id")
            .single();
          if (inc?.id) {
            await context.supabase.from("incident_events").insert([
              { incident_id: inc.id, kind: "breaking", label: "Contract diff completed", detail: `${summary.breaking} breaking changes` },
              { incident_id: inc.id, kind: "analyzing", label: "Blast radius computed", detail: "3 services affected" },
              { incident_id: inc.id, kind: "analyzing", label: "Copilot root-cause analysis", detail: "94% confidence" },
              { incident_id: inc.id, kind: "drift", label: "Mitigation deployed", detail: "Patch on payments-service adapter" },
            ]);
          }
        }

        previousSpec = spec;
        previousVersionId = versionId;
      }
    }

    // Dependencies (service → api)
    const stripe = createdApis.find((a) => a.name === "Stripe Payments")!;
    const twilio = createdApis.find((a) => a.name === "Twilio Messaging")!;
    const orders = createdApis.find((a) => a.name === "Orders API")!;
    await context.supabase.from("dependencies").insert([
      { org_id: org, source_service: "payments-service", target_api_id: stripe.id, weight: 5 },
      { org_id: org, source_service: "checkout-web", target_api_id: stripe.id, weight: 3 },
      { org_id: org, source_service: "receipts-worker", target_api_id: stripe.id, weight: 2 },
      { org_id: org, source_service: "notifications", target_api_id: twilio.id, weight: 3 },
      { org_id: org, source_service: "checkout-web", target_api_id: orders.id, weight: 2 },
      { org_id: org, source_service: "admin-panel", target_api_id: orders.id, weight: 1 },
    ]);

    return { skipped: false, apis: createdApis.length };
  });
