import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, PageBody } from "@/components/dashboard/page-shell";
import { ReliabilityScore } from "@/components/dashboard/reliability-score";
import { LiveTimeline } from "@/components/dashboard/live-timeline";
import { FleetTable } from "@/components/dashboard/fleet-table";
import { IncidentRail } from "@/components/dashboard/incident-rail";
import { MiniGraph } from "@/components/dashboard/mini-graph";

export const Route = createFileRoute("/_dashboard/dashboard")({
  head: () => ({ meta: [{ title: "Overview — Invariant." }] }),
  component: Overview,
});

const fleetStats = [
  { l: "APIs monitored", v: "127", sub: "8 vendors · 119 internal" },
  { l: "Requests analyzed", v: "3.8M", sub: "past 24 hours" },
  { l: "Dependencies mapped", v: "42", sub: "across 4 clusters" },
  { l: "Contract changes", v: "326", sub: "past 30 days" },
  { l: "Incidents prevented", v: "14", sub: "auto-mitigated" },
  { l: "Copilot investigations", v: "48", sub: "94% avg confidence" },
];

function Overview() {
  return (
    <>
      <PageHeader
        eyebrow="Acme Corp · Platform · Production"
        title="Reliability overview"
        description="Contract & runtime health across every API your team depends on."
        actions={
          <div className="flex items-center gap-2">
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
              Register API
            </Link>
          </div>
        }
      />
      <PageBody className="space-y-5">
        {/* fleet stat strip */}
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-hairline bg-hairline sm:grid-cols-3 lg:grid-cols-6">
          {fleetStats.map((s) => (
            <div key={s.l} className="bg-surface/60 px-4 py-3">
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {s.l}
              </div>
              <div className="mt-1 font-mono text-xl font-semibold tabular-nums">
                {s.v}
              </div>
              <div className="mt-0.5 font-mono text-[11px] text-muted-foreground/70">
                {s.sub}
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="space-y-5">
            <ReliabilityScore />
            <LiveTimeline />
          </div>
          <div className="space-y-5">
            <IncidentRail />
            <MiniGraph />
          </div>
        </div>

        <FleetTable />
      </PageBody>
    </>
  );
}
