import { createFileRoute } from "@tanstack/react-router";

// Scheduled monitor: pulls live OpenAPI specs for every API that has a spec_url
// and is due per its monitor_interval, then runs the SAME applySpecDiff logic
// used by the manual upload flow. Called every 5 minutes by pg_cron via pg_net.

export const Route = createFileRoute("/api/public/hooks/monitor-apis")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env["MONITOR_WEBHOOK_SECRET"] ?? "";
        const provided = request.headers.get("x-monitor-secret") ?? "";
        if (!expected || provided !== expected) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { applySpecDiff, isDue } = await import("@/lib/apply-spec-diff.server");

        const { data: apis, error } = await supabaseAdmin
          .from("apis")
          .select("id, name, spec_url, monitor_interval, last_checked")
          .not("spec_url", "is", null);
        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        const due = (apis ?? []).filter((a: any) =>
          isDue(a.monitor_interval as string, a.last_checked as string | null),
        );

        const results: Array<Record<string, unknown>> = [];

        for (const api of due) {
          try {
            const res = await fetch(api.spec_url as string, {
              headers: { accept: "application/json" },
            });
            if (!res.ok) throw new Error(`Spec fetch failed with HTTP ${res.status}`);
            const specText = await res.text();

            const out = await applySpecDiff(
              supabaseAdmin,
              api.id as string,
              specText,
              undefined,
              "monitor",
            );
            results.push({
              apiId: api.id,
              name: api.name,
              ok: true,
              breaking: out.summary.breaking,
              risky: out.summary.risky,
              safe: out.summary.safe,
              incidentId: out.incidentId,
            });
          } catch (e) {
            // Always mark the API as checked, even when the pull or parse failed.
            await supabaseAdmin
              .from("apis")
              .update({ last_checked: new Date().toISOString() })
              .eq("id", api.id);
            results.push({
              apiId: api.id,
              name: api.name,
              ok: false,
              error: e instanceof Error ? e.message : "Unknown error",
            });
          }
        }

        return Response.json({
          checked: results.length,
          candidates: apis?.length ?? 0,
          results,
        });
      },
    },
  },
});
