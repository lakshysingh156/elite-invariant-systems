import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Upload, ExternalLink } from "lucide-react";
import { PageHeader, PageBody, Panel } from "@/components/dashboard/page-shell";
import {
  StatusBadge,
  SeverityPill,
} from "@/components/ui-kit/status-badge";
import { GenomeRing, Sparkline } from "@/components/ui-kit/metrics";
import {
  getApi,
  endpointsByApi,
  defaultEndpoints,
  versionsByApi,
  defaultVersions,
  contractChanges,
} from "@/data/apis";
import { driftEvents } from "@/data/drift";
import { graphNodes } from "@/data/graph";
import { cn } from "@/lib/utils";
import { timeAgo, shortDate } from "@/lib/format";

export const Route = createFileRoute("/_dashboard/apis/$apiId")({
  loader: ({ params }) => {
    const api = getApi(params.apiId);
    if (!api) throw notFound();
    return { api };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData
          ? `${loaderData.api.name} — Invariant.`
          : "API — Invariant.",
      },
    ],
  }),
  notFoundComponent: () => (
    <PageBody>
      <div className="text-sm text-muted-foreground">API not found.</div>
    </PageBody>
  ),
  component: ApiDetail,
});

const tabs = ["Endpoints", "Versions", "Drift Timeline", "Dependents"] as const;
type Tab = (typeof tabs)[number];

const methodColor: Record<string, string> = {
  GET: "text-stable",
  POST: "text-analyzing",
  PUT: "text-drift",
  PATCH: "text-drift",
  DELETE: "text-breaking",
};

function ApiDetail() {
  const { api } = Route.useLoaderData();
  const [tab, setTab] = useState<Tab>("Endpoints");
  const endpoints = endpointsByApi[api.id] ?? defaultEndpoints;
  const versions = versionsByApi[api.id] ?? defaultVersions;
  const drifts = driftEvents.filter((d) => d.apiId === api.id);
  const dependents = graphNodes.filter((n) => n.type === "service").slice(0, 4);

  return (
    <>
      <PageHeader
        eyebrow={api.owningTeam}
        title={api.name}
        description={api.baseUrl}
        actions={
          <div className="flex items-center gap-2">
            <Link
              to="/apis"
              className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Inventory
            </Link>
            <button className="inline-flex items-center gap-1.5 rounded-lg bg-signal px-3 py-2 text-sm font-medium text-signal-foreground transition-transform hover:scale-[1.02]">
              <Upload className="h-4 w-4" /> Upload version
            </button>
          </div>
        }
      />
      <PageBody className="space-y-6">
        {/* genome header */}
        <div className="grid gap-4 rounded-xl border border-hairline bg-surface/60 p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center">
          <div className="flex items-center gap-4">
            <GenomeRing score={api.genome} size={68} stroke={5} />
            <div>
              <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                Genome score
              </div>
              <div className="mt-1 flex items-center gap-2">
                <StatusBadge status={api.status} pulse={api.status !== "stable"} />
                <span className="font-mono text-xs text-muted-foreground">
                  {api.kind}
                </span>
              </div>
            </div>
          </div>
          <div className="sm:px-6">
            <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              30-day trend
            </div>
            <Sparkline
              data={api.genomeTrend}
              width={220}
              height={44}
              tone={api.genome >= 90 ? "stable" : api.genome >= 75 ? "drift" : "breaking"}
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-3 gap-4 text-center sm:gap-6">
            {[
              { l: "Endpoints", v: api.endpointCount },
              { l: "Version", v: api.currentVersion },
              { l: "Interval", v: api.monitorInterval },
            ].map((s) => (
              <div key={s.l}>
                <div className="font-mono text-lg font-semibold tabular-nums">
                  {s.v}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {s.l}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* tabs */}
        <div className="flex gap-1 border-b border-hairline">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "relative px-3 py-2.5 text-sm transition-colors",
                tab === t
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t}
              {tab === t && (
                <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-signal" />
              )}
            </button>
          ))}
        </div>

        {tab === "Endpoints" && (
          <Panel>
            <table className="w-full text-sm">
              <thead className="border-b border-hairline">
                <tr className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground/70">
                  <th className="px-4 py-2.5 text-left">Endpoint</th>
                  <th className="px-4 py-2.5 text-right">p95</th>
                  <th className="px-4 py-2.5 text-right">Error</th>
                  <th className="px-4 py-2.5 text-right">Consumers</th>
                  <th className="px-4 py-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {endpoints.map((e) => (
                  <tr key={e.id} className="hover:bg-surface-raised/60">
                    <td className="px-4 py-3 font-mono">
                      <span className={cn("mr-2 font-semibold", methodColor[e.method])}>
                        {e.method}
                      </span>
                      {e.path}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-muted-foreground">
                      {e.p95}ms
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      <span className={e.errorRate > 1 ? "text-breaking" : "text-muted-foreground"}>
                        {e.errorRate}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-muted-foreground">
                      {e.consumers}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <StatusBadge status={e.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        )}

        {tab === "Versions" && (
          <Panel>
            <div className="divide-y divide-hairline">
              {versions.map((v) => (
                <div key={v.id} className="flex items-center gap-4 px-4 py-3.5">
                  <div className="font-mono text-sm font-medium">{v.version}</div>
                  {v.isCurrent && (
                    <span className="rounded-full bg-signal/15 px-2 py-0.5 font-mono text-[10px] uppercase text-signal ring-1 ring-inset ring-signal/25">
                      current
                    </span>
                  )}
                  <div className="ml-auto flex items-center gap-4 font-mono text-xs text-muted-foreground">
                    <span>{v.endpointCount} endpoints</span>
                    <span>{v.changeCount} changes</span>
                    {v.breakingCount > 0 && (
                      <span className="text-breaking">
                        {v.breakingCount} breaking
                      </span>
                    )}
                    <span>{shortDate(v.createdAt)}</span>
                    <Link
                      to="/contract"
                      className="inline-flex items-center gap-1 text-foreground hover:text-signal"
                    >
                      Diff <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        )}

        {tab === "Drift Timeline" && (
          <Panel>
            {drifts.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                No drift detected on this API in the current window.
              </div>
            ) : (
              <div className="divide-y divide-hairline">
                {drifts.map((d) => (
                  <div key={d.id} className="flex items-center gap-4 px-4 py-3.5">
                    <StatusBadge status={d.status} />
                    <div className="min-w-0">
                      <div className="font-mono text-sm">{d.endpoint}</div>
                      <div className="font-mono text-xs text-muted-foreground">
                        {d.baseline} → {d.observed} · {d.deviation}
                      </div>
                    </div>
                    <div className="ml-auto text-right font-mono text-xs text-muted-foreground">
                      <div className="text-foreground">
                        {Math.round(d.confidence * 100)}% conf
                      </div>
                      <div>{timeAgo(d.detectedAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        )}

        {tab === "Dependents" && (
          <div className="grid gap-4 sm:grid-cols-2">
            {dependents.map((d) => (
              <div
                key={d.id}
                className="flex items-center gap-3 rounded-xl border border-hairline bg-surface/60 p-4"
              >
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-secondary font-mono text-xs ring-1 ring-inset ring-hairline">
                  {d.label.slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-mono text-sm">{d.label}</div>
                  <div className="font-mono text-xs text-muted-foreground">
                    consumes this API
                  </div>
                </div>
                <StatusBadge status={d.status} />
              </div>
            ))}
          </div>
        )}

        {/* recent changes strip */}
        <Panel title="Recent contract changes">
          <div className="divide-y divide-hairline">
            {contractChanges.slice(0, 3).map((c) => (
              <div key={c.id} className="flex items-center gap-3 px-4 py-3">
                <SeverityPill severity={c.severity} />
                <span className="min-w-0 flex-1 truncate font-mono text-sm text-foreground/80">
                  {c.target}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </PageBody>
    </>
  );
}
