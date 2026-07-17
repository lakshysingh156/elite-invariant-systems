import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Sparkles,
  Loader2,
  AlertOctagon,
  Radio,
  Plus,
  Boxes,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader, PageBody, Panel } from "@/components/dashboard/page-shell";
import { GenomeRing } from "@/components/ui-kit/metrics";
import { StatusBadge } from "@/components/ui-kit/status-badge";
import { getDashboardOverview } from "@/lib/dashboard.functions";
import { seedDemoWorkspace } from "@/lib/seed.functions";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_dashboard/dashboard")({
  head: () => ({ meta: [{ title: "Reliability Overview — Invariant." }] }),
  component: Overview,
});

const sevChip: Record<string, string> = {
  critical: "text-breaking border-breaking/40 bg-breaking/10",
  high: "text-drift border-drift/40 bg-drift/10",
  medium: "text-analyzing border-analyzing/40 bg-analyzing/10",
  low: "text-muted-foreground border-hairline bg-secondary",
};

const changeChip: Record<string, string> = {
  breaking: "text-breaking bg-breaking/10",
  risky: "text-drift bg-drift/10",
  safe: "text-stable bg-stable/10",
};

function Overview() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const overviewFn = useServerFn(getDashboardOverview);
  const seedFn = useServerFn(seedDemoWorkspace);

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-overview"],
    queryFn: () => overviewFn(),
  });

  const seedMut = useMutation({
    mutationFn: () => seedFn({ data: {} as any }),
    onSuccess: (res) => {
      toast.success(res.skipped ? res.message : `Seeded ${res.apis} APIs`);
      qc.invalidateQueries();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Seed failed"),
  });

  if (isLoading || !data) {
    return (
      <PageBody>
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading workspace…
        </div>
      </PageBody>
    );
  }

  const { stats, apis, openIncidents, recentChanges } = data;
  const isEmpty = stats.apiCount === 0;

  return (
    <>
      <PageHeader
        eyebrow="Production · live"
        title="Reliability overview"
        description="Contract & runtime health across every API your team depends on."
        actions={
          <div className="flex items-center gap-2">
            {isEmpty && (
              <button
                onClick={() => seedMut.mutate()}
                disabled={seedMut.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-foreground/80 hover:bg-surface-raised"
              >
                {seedMut.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Load demo data
              </button>
            )}
            <Link
              to="/graph"
              className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-foreground/80 hover:bg-surface-raised"
            >
              Open graph
            </Link>
            <Link
              to="/apis"
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-brand-foreground transition-transform hover:scale-[1.02] brand-glow"
            >
              <Plus className="h-4 w-4" /> Register API
            </Link>
          </div>
        }
      />
      <PageBody className="space-y-5">
        {isEmpty && (
          <div className="rounded-xl border border-dashed border-hairline bg-surface/40 p-6 text-center">
            <Boxes className="mx-auto h-8 w-8 text-muted-foreground" />
            <h3 className="mt-3 text-lg font-semibold">Your workspace is empty</h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              Register an API and upload an OpenAPI spec, or load a realistic demo workspace to see
              contract diffing, blast radius, and Copilot in action.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <button
                onClick={() => seedMut.mutate()}
                disabled={seedMut.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground brand-glow"
              >
                {seedMut.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Load demo workspace
              </button>
              <Link
                to="/apis"
                className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-surface px-4 py-2 text-sm text-foreground/80"
              >
                Register an API
              </Link>
            </div>
          </div>
        )}

        {/* KPI strip */}
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-hairline bg-hairline sm:grid-cols-3 lg:grid-cols-6">
          <Kpi label="APIs monitored" value={String(stats.apiCount)} sub={`${stats.vendorCount} vendor · ${stats.internalCount} internal`} />
          <Kpi label="Avg genome" value={String(stats.avgGenome)} sub="stability score" tone={stats.avgGenome >= 90 ? "stable" : stats.avgGenome >= 75 ? "drift" : "breaking"} />
          <Kpi label="Open incidents" value={String(stats.openIncidents)} sub="requires triage" tone={stats.openIncidents > 0 ? "breaking" : "stable"} />
          <Kpi label="Breaking (30d)" value={String(stats.breaking30d)} sub={`${stats.risky30d} risky`} tone={stats.breaking30d > 0 ? "breaking" : "stable"} />
          <Kpi label="Contract changes" value={String(stats.changes30d)} sub="past 30 days" />
          <Kpi label="Dependencies" value={String(stats.dependencyCount)} sub="service edges" />
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          {/* left: fleet + changes */}
          <div className="space-y-5">
            <Panel title="API fleet">
              {apis.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">No APIs yet.</div>
              ) : (
                <div className="divide-y divide-hairline">
                  {apis.slice(0, 8).map((a: any) => (
                    <button
                      key={a.id}
                      onClick={() => navigate({ to: "/apis/$apiId", params: { apiId: a.id } })}
                      className="grid w-full grid-cols-[auto_1fr_auto_auto] items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-surface-raised"
                    >
                      <GenomeRing score={a.genome ?? 0} size={32} stroke={3} showLabel={false} />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{a.name}</div>
                        <div className="truncate font-mono text-[11px] text-muted-foreground">
                          {a.kind} · {a.last_checked ? `checked ${timeAgo(a.last_checked)}` : "not scanned yet"}
                        </div>
                      </div>
                      <span
                        className={cn(
                          "font-mono text-sm tabular-nums",
                          a.genome >= 90 ? "text-stable" : a.genome >= 75 ? "text-drift" : "text-breaking",
                        )}
                      >
                        {a.genome ?? "—"}
                      </span>
                      <StatusBadge status={a.status} />
                    </button>
                  ))}
                </div>
              )}
            </Panel>

            <Panel title="Recent contract changes" action={<Link to="/apis" className="font-mono text-[11px] text-muted-foreground hover:text-foreground">All APIs →</Link>}>
              {recentChanges.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No contract changes yet. Upload an OpenAPI spec to see diffs here.
                </div>
              ) : (
                <div className="divide-y divide-hairline">
                  {recentChanges.slice(0, 8).map((c: any) => (
                    <div key={c.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-2.5">
                      <span className={cn("rounded px-1.5 py-0.5 font-mono text-[10px] uppercase", changeChip[c.severity])}>
                        {c.severity}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate text-sm">
                          <span className="font-mono text-xs text-muted-foreground">{c.api_name}</span>{" "}
                          · {c.summary}
                        </div>
                        <div className="truncate font-mono text-[11px] text-muted-foreground">
                          {c.method ?? ""} {c.endpoint_path ?? c.target}
                        </div>
                      </div>
                      <span className="font-mono text-[11px] text-muted-foreground">{timeAgo(c.created_at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>

          {/* right: incidents rail */}
          <div className="space-y-5">
            <Panel
              title="Open incidents"
              action={
                <Link to="/incidents" className="font-mono text-[11px] text-muted-foreground hover:text-foreground">
                  All →
                </Link>
              }
            >
              {openIncidents.length === 0 ? (
                <div className="p-6 text-center">
                  <div className="inline-flex items-center gap-1.5 rounded-md border border-stable/30 bg-stable/10 px-2.5 py-1 font-mono text-[11px] text-stable">
                    <Radio className="h-3 w-3" /> all clear
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-hairline">
                  {openIncidents.map((i: any) => (
                    <button
                      key={i.id}
                      onClick={() => navigate({ to: "/incidents/$incidentId", params: { incidentId: i.id } })}
                      className="block w-full px-4 py-3 text-left transition-colors hover:bg-surface-raised"
                    >
                      <div className="flex items-center gap-2">
                        <span className={cn("rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase", sevChip[i.severity])}>
                          {i.severity}
                        </span>
                        <span className="font-mono text-[11px] text-muted-foreground">{i.code}</span>
                      </div>
                      <div className="mt-1.5 line-clamp-2 text-sm">{i.title}</div>
                      <div className="mt-1 font-mono text-[11px] text-muted-foreground">
                        {i.affected_endpoints} endpoints · opened {timeAgo(i.opened_at)}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </Panel>

            <Panel title="Fleet status">
              <div className="grid grid-cols-2 gap-px bg-hairline">
                <StatusTile label="stable" value={stats.statusCounts.stable} tone="text-stable" />
                <StatusTile label="drifting" value={stats.statusCounts.drifting} tone="text-drift" />
                <StatusTile label="breaking" value={stats.statusCounts.breaking} tone="text-breaking" />
                <StatusTile label="analyzing" value={stats.statusCounts.analyzing} tone="text-analyzing" />
              </div>
            </Panel>

            <Link
              to="/copilot"
              className="flex items-center justify-between rounded-xl border border-brand/30 bg-brand/5 px-4 py-3 transition-colors hover:bg-brand/10"
            >
              <div>
                <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-brand">
                  <Sparkles className="h-3 w-3" /> ai reliability analyst
                </div>
                <div className="mt-1 text-sm">Investigate an incident →</div>
              </div>
              <Activity className="h-4 w-4 text-brand" />
            </Link>
          </div>
        </div>
      </PageBody>
    </>
  );
}

function Kpi({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: "stable" | "drift" | "breaking" }) {
  return (
    <div className="bg-surface/60 px-4 py-3">
      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn("mt-1 font-mono text-xl font-semibold tabular-nums", tone && `text-${tone}`)}>{value}</div>
      <div className="mt-0.5 font-mono text-[11px] text-muted-foreground/70">{sub}</div>
    </div>
  );
}

function StatusTile({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="bg-surface/60 p-3">
      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn("mt-1 font-mono text-lg font-semibold tabular-nums", tone)}>{value}</div>
    </div>
  );
}
