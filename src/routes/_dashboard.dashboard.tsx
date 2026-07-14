import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  AlertTriangle,
  Boxes,
  Dna,
  Activity,
  ArrowUpRight,
  ArrowRight,
} from "lucide-react";
import { PageHeader, PageBody, Panel } from "@/components/dashboard/page-shell";
import {
  StatusBadge,
  IncidentStatusBadge,
  SeverityPill,
} from "@/components/ui-kit/status-badge";
import { GenomeRing, Sparkline } from "@/components/ui-kit/metrics";
import { apis } from "@/data/apis";
import { incidents } from "@/data/incidents";
import { contractChanges } from "@/data/apis";
import { EASE } from "@/lib/motion";
import { timeAgo } from "@/lib/format";

export const Route = createFileRoute("/_dashboard/dashboard")({
  head: () => ({ meta: [{ title: "Overview — Invariant." }] }),
  component: Overview,
});

const avgGenome = Math.round(
  apis.reduce((s, a) => s + a.genome, 0) / apis.length,
);
const openIncidents = incidents.filter((i) => i.status !== "resolved").length;
const trend = apis[2].genomeTrend;

const kpis = [
  {
    label: "Open incidents",
    value: openIncidents,
    icon: AlertTriangle,
    tone: "text-breaking",
    delta: "+2 today",
    to: "/incidents",
    spark: [3, 2, 4, 3, 5, 4, 3],
  },
  {
    label: "APIs monitored",
    value: apis.length,
    icon: Boxes,
    tone: "text-foreground",
    delta: "8 active",
    to: "/apis",
    spark: [6, 6, 7, 7, 8, 8, 8],
  },
  {
    label: "Avg genome score",
    value: avgGenome,
    icon: Dna,
    tone: "text-drift",
    delta: "-3 vs 7d",
    to: "/apis",
    spark: trend.slice(-7),
  },
  {
    label: "Drift events (24h)",
    value: 5,
    icon: Activity,
    tone: "text-analyzing",
    delta: "3 analyzing",
    to: "/drift",
    spark: [1, 0, 2, 1, 3, 2, 5],
  },
];

function Overview() {
  return (
    <>
      <PageHeader
        eyebrow="Acme · Platform"
        title="Reliability overview"
        description="Org-wide contract & runtime health at a glance."
        actions={
          <Link
            to="/apis"
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-brand-foreground transition-transform hover:scale-[1.02] brand-glow"
          >
            Register API
          </Link>
        }
      />
      <PageBody className="space-y-6">
        {/* KPI cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((k, i) => (
            <motion.div
              key={k.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.4, ease: EASE }}
            >
              <Link
                to={k.to}
                className="group block rounded-xl border border-hairline bg-surface/60 p-4 transition-colors hover:border-hairline hover:bg-surface-raised"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{k.label}</span>
                  <k.icon className={`h-4 w-4 ${k.tone}`} />
                </div>
                <div className="mt-3 flex items-end justify-between">
                  <div>
                    <div className="font-mono text-3xl font-semibold tabular-nums">
                      {k.value}
                    </div>
                    <div className="mt-1 font-mono text-xs text-muted-foreground">
                      {k.delta}
                    </div>
                  </div>
                  <Sparkline
                    data={k.spark}
                    width={72}
                    height={28}
                    tone={
                      k.tone.includes("breaking")
                        ? "breaking"
                        : k.tone.includes("drift")
                          ? "drift"
                          : "signal"
                    }
                  />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* recent incidents */}
          <Panel
            title="Recent incidents"
            action={
              <Link
                to="/incidents"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            }
          >
            <div className="divide-y divide-hairline">
              {incidents.slice(0, 4).map((inc) => (
                <Link
                  key={inc.id}
                  to="/incidents/$incidentId"
                  params={{ incidentId: inc.id }}
                  className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-raised"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">
                        {inc.code}
                      </span>
                      <IncidentStatusBadge status={inc.status} />
                    </div>
                    <div className="mt-1 truncate text-sm font-medium">
                      {inc.title}
                    </div>
                  </div>
                  <div className="hidden text-right sm:block">
                    <div className="font-mono text-xs text-muted-foreground">
                      {inc.api}
                    </div>
                    <div className="mt-0.5 font-mono text-xs text-muted-foreground/60">
                      {timeAgo(inc.updatedAt)}
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-foreground" />
                </Link>
              ))}
            </div>
          </Panel>

          {/* least stable APIs */}
          <Panel title="Least stable APIs">
            <div className="divide-y divide-hairline">
              {[...apis]
                .sort((a, b) => a.genome - b.genome)
                .slice(0, 4)
                .map((a) => (
                  <Link
                    key={a.id}
                    to="/apis/$apiId"
                    params={{ apiId: a.id }}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-raised"
                  >
                    <GenomeRing score={a.genome} size={38} stroke={3} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{a.name}</div>
                      <div className="font-mono text-xs text-muted-foreground">
                        {a.owningTeam}
                      </div>
                    </div>
                    <StatusBadge status={a.status} />
                  </Link>
                ))}
            </div>
          </Panel>
        </div>

        {/* recent changes */}
        <Panel
          title="Recent contract changes"
          action={
            <Link
              to="/contract"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              Open diff <ArrowRight className="h-3 w-3" />
            </Link>
          }
        >
          <div className="divide-y divide-hairline">
            {contractChanges.slice(0, 4).map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-3 px-4 py-3 font-mono text-sm"
              >
                <SeverityPill severity={c.severity} />
                <span className="min-w-0 flex-1 truncate text-foreground/80">
                  {c.target}
                </span>
                <span className="hidden text-xs text-muted-foreground sm:block">
                  {c.kind}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </PageBody>
    </>
  );
}
