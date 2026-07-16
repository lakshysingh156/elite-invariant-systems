import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react";
import { PageHeader, PageBody, Panel } from "@/components/dashboard/page-shell";
import { StatusBadge, SeverityPill } from "@/components/ui-kit/status-badge";
import { GenomeRing } from "@/components/ui-kit/metrics";
import { getApiDetail } from "@/lib/apis.functions";
import { cn } from "@/lib/utils";
import { timeAgo, shortDate } from "@/lib/format";

export const Route = createFileRoute("/_dashboard/apis/$apiId")({
  head: () => ({ meta: [{ title: "API — Invariant." }] }),
  notFoundComponent: () => (
    <PageBody>
      <div className="text-sm text-muted-foreground">API not found.</div>
    </PageBody>
  ),
  component: ApiDetail,
});

const tabs = ["Endpoints", "Versions", "Contract Changes"] as const;
type Tab = (typeof tabs)[number];

const methodColor: Record<string, string> = {
  GET: "text-stable",
  POST: "text-analyzing",
  PUT: "text-drift",
  PATCH: "text-drift",
  DELETE: "text-breaking",
};

function ApiDetail() {
  const { apiId } = Route.useParams();
  const detailFn = useServerFn(getApiDetail);
  const { data, isLoading } = useQuery({
    queryKey: ["api-detail", apiId],
    queryFn: () => detailFn({ data: { apiId } }),
  });
  const [tab, setTab] = useState<Tab>("Endpoints");

  if (isLoading) {
    return (
      <PageBody>
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
        </div>
      </PageBody>
    );
  }
  if (!data) throw notFound();
  const { api, versions, changes, endpoints } = data as any;

  return (
    <>
      <PageHeader
        eyebrow={api.owning_team ?? undefined}
        title={api.name}
        description={api.base_url}
        actions={
          <Link
            to="/apis"
            className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Inventory
          </Link>
        }
      />
      <PageBody className="space-y-6">
        <div className="grid gap-4 rounded-xl border border-hairline bg-surface/60 p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center">
          <div className="flex items-center gap-4">
            <GenomeRing score={api.genome} size={68} stroke={5} />
            <div>
              <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Genome score</div>
              <div className="mt-1 flex items-center gap-2">
                <StatusBadge status={api.status} pulse={api.status !== "stable"} />
                <span className="font-mono text-xs text-muted-foreground">{api.kind}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center sm:col-start-3 sm:gap-6">
            {[
              { l: "Endpoints", v: endpoints.length },
              { l: "Versions", v: versions.length },
              { l: "Interval", v: api.monitor_interval },
            ].map((s) => (
              <div key={s.l}>
                <div className="font-mono text-lg font-semibold tabular-nums">{s.v}</div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-1 border-b border-hairline">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "relative px-3 py-2.5 text-sm transition-colors",
                tab === t ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t}
              {tab === t && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-brand" />}
            </button>
          ))}
        </div>

        {tab === "Endpoints" && (
          <Panel>
            {endpoints.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                No endpoints yet — upload an OpenAPI spec from the API Inventory.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-hairline">
                  <tr className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground/70">
                    <th className="px-4 py-2.5 text-left">Method</th>
                    <th className="px-4 py-2.5 text-left">Path</th>
                    <th className="px-4 py-2.5 text-left">Operation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {endpoints.map((e: any) => (
                    <tr key={e.id} className="hover:bg-surface-raised/60">
                      <td className={cn("px-4 py-3 font-mono font-semibold", methodColor[e.method])}>{e.method}</td>
                      <td className="px-4 py-3 font-mono">{e.path}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{e.operation_id ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>
        )}

        {tab === "Versions" && (
          <Panel>
            {versions.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-muted-foreground">No versions yet.</div>
            ) : (
              <div className="divide-y divide-hairline">
                {versions.map((v: any) => (
                  <div key={v.id} className="flex items-center gap-4 px-4 py-3.5">
                    <div className="font-mono text-sm font-medium">{v.version}</div>
                    {v.is_current && (
                      <span className="rounded-full bg-brand/15 px-2 py-0.5 font-mono text-[10px] uppercase text-brand ring-1 ring-inset ring-brand/25">
                        current
                      </span>
                    )}
                    <div className="ml-auto flex items-center gap-4 font-mono text-xs text-muted-foreground">
                      <span>{v.endpoint_count} endpoints</span>
                      <span>{v.change_count} changes</span>
                      {v.breaking_count > 0 && <span className="text-breaking">{v.breaking_count} breaking</span>}
                      <span>{shortDate(v.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        )}

        {tab === "Contract Changes" && (
          <Panel>
            {changes.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                No contract changes detected. Upload a new spec version to trigger a diff.
              </div>
            ) : (
              <div className="divide-y divide-hairline">
                {changes.map((c: any) => (
                  <div key={c.id} className="flex items-start gap-3 px-4 py-3.5">
                    <SeverityPill severity={c.severity} />
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-sm text-foreground/90">{c.target}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{c.summary}</div>
                    </div>
                    <div className="font-mono text-xs text-muted-foreground">{timeAgo(c.created_at)}</div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        )}
      </PageBody>
    </>
  );
}
