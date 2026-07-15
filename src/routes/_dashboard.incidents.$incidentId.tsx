import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  GitBranch,
  AlertOctagon,
  Activity,
  Radar,
  Wrench,
  History,
} from "lucide-react";
import { PageBody } from "@/components/dashboard/page-shell";
import {
  IncidentStatusBadge,
  StatusBadge,
} from "@/components/ui-kit/status-badge";
import { getIncident, incidents } from "@/data/incidents";
import { relatedIncidents } from "@/data/copilot";
import { ForceGraph } from "@/components/graph/force-graph";
import { graphNodes, graphEdges, blastRadiusFrom } from "@/data/graph";
import { clockUTC, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_dashboard/incidents/$incidentId")({
  loader: ({ params }) => {
    const incident = getIncident(params.incidentId);
    if (!incident) throw notFound();
    return { incident };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData
          ? `${loaderData.incident.code} — Invariant.`
          : "Incident",
      },
    ],
  }),
  notFoundComponent: () => (
    <PageBody>
      <div className="text-sm text-muted-foreground">Incident not found.</div>
    </PageBody>
  ),
  component: IncidentDetail,
});

const tabs = [
  { id: "overview", label: "Overview", icon: AlertOctagon },
  { id: "timeline", label: "Timeline", icon: Activity },
  { id: "blast", label: "Blast radius", icon: Radar },
  { id: "cause", label: "Root cause", icon: GitBranch },
  { id: "fix", label: "Fix", icon: Wrench },
  { id: "similar", label: "Similar", icon: History },
] as const;

const sevChip: Record<string, string> = {
  critical: "text-breaking bg-breaking/10 border-breaking/40",
  high: "text-drift bg-drift/10 border-drift/40",
  medium: "text-analyzing bg-analyzing/10 border-analyzing/40",
  low: "text-muted-foreground bg-secondary border-hairline",
};

function IncidentDetail() {
  const { incident } = Route.useLoaderData();
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("overview");

  return (
    <>
      {/* header */}
      <div className="border-b border-hairline bg-background/60 px-6 pt-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              <Link
                to="/incidents"
                className="inline-flex items-center gap-1 hover:text-foreground"
              >
                <ArrowLeft className="h-3 w-3" /> incidents
              </Link>
              <span>/</span>
              <span>{incident.code}</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-md border px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider",
                  sevChip[incident.severity],
                )}
              >
                {incident.severity}
              </span>
              <IncidentStatusBadge status={incident.status} />
              <span className="rounded border border-hairline bg-secondary px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                production
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                opened {timeAgo(incident.openedAt)} · {incident.assignee}
              </span>
            </div>
            <h1 className="mt-2 truncate text-2xl font-semibold tracking-tight">
              {incident.title}
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              to="/copilot"
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-brand-foreground transition-transform hover:scale-[1.02] brand-glow"
            >
              <Sparkles className="h-4 w-4" /> Investigate with Copilot
            </Link>
          </div>
        </div>

        {/* metric strip */}
        <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-t-lg border border-b-0 border-hairline bg-hairline sm:grid-cols-4">
          {[
            { l: "Affected services", v: incident.affectedServices },
            { l: "Affected endpoints", v: incident.affectedEndpoints },
            { l: "SLA remaining", v: "2h 14m" },
            { l: "Last update", v: timeAgo(incident.updatedAt) },
          ].map((s) => (
            <div key={s.l} className="bg-background/60 px-4 py-3">
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {s.l}
              </div>
              <div className="mt-1 font-mono text-base font-semibold tabular-nums">
                {s.v}
              </div>
            </div>
          ))}
        </div>

        {/* tabs */}
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "inline-flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm transition-colors",
                tab === t.id
                  ? "border-brand text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <PageBody className="space-y-5">
        {tab === "overview" && (
          <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
            <div className="space-y-5">
              <div className="rounded-xl border border-hairline bg-surface/60 p-5 elevate">
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Summary
                </div>
                <p className="mt-2 text-sm leading-relaxed text-foreground/85">
                  {incident.summary}
                </p>
                {incident.rootCause && (
                  <div className="mt-4 rounded-lg border border-breaking/20 bg-breaking/5 p-3">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-breaking/80">
                      Root cause
                    </div>
                    <p className="mt-1 text-sm text-foreground/90">
                      {incident.rootCause}
                    </p>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-hairline bg-surface/60 elevate">
                <div className="border-b border-hairline px-4 py-3 text-sm font-medium">
                  Recent activity
                </div>
                <div className="p-4">
                  {incident.timeline.slice(0, 4).map((ev, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex gap-4 pb-3 last:pb-0"
                    >
                      <StatusBadge
                        status={ev.kind}
                        label=""
                        className="!px-1.5"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {ev.label}
                          </span>
                          <span className="font-mono text-xs text-muted-foreground">
                            {clockUTC(ev.at)}
                          </span>
                        </div>
                        {ev.detail && (
                          <div className="mt-0.5 font-mono text-xs text-muted-foreground">
                            {ev.detail}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <MetaCard incident={incident} />
              <SimilarList />
            </div>
          </div>
        )}

        {tab === "timeline" && (
          <div className="rounded-xl border border-hairline bg-surface/60 p-5 elevate">
            {incident.timeline.map((ev, i) => (
              <div key={i} className="relative flex gap-4 pb-5 last:pb-0">
                <div className="flex flex-col items-center">
                  <StatusBadge status={ev.kind} label="" className="!px-1.5" />
                  {i < incident.timeline.length - 1 && (
                    <span className="mt-1 w-px flex-1 bg-hairline" />
                  )}
                </div>
                <div className="pb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{ev.label}</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {clockUTC(ev.at)}
                    </span>
                  </div>
                  {ev.detail && (
                    <div className="mt-0.5 font-mono text-xs text-muted-foreground">
                      {ev.detail}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "blast" && (
          <div className="overflow-hidden rounded-xl border border-hairline bg-surface/60 elevate">
            <div className="border-b border-hairline px-4 py-3">
              <div className="text-sm font-medium">Blast radius</div>
              <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                {incident.affectedServices} services · {incident.affectedEndpoints} endpoints reachable from the change origin.
              </div>
            </div>
            <div className="relative h-[420px] bg-[#0b0c0e]">
              <div className="absolute inset-0 grid-backdrop opacity-25" />
              <ForceGraph
                nodes={graphNodes}
                edges={graphEdges}
                highlight={blastRadiusFrom.stripe}
                className="h-full w-full"
              />
            </div>
          </div>
        )}

        {tab === "cause" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-hairline bg-surface/60 p-5 elevate">
              <div className="font-mono text-[10px] uppercase tracking-wider text-analyzing">
                copilot analysis · 94% confidence
              </div>
              <p className="mt-2 text-sm leading-relaxed text-foreground/90">
                {incident.rootCause ??
                  "Root cause analysis pending. Copilot is correlating recent contract diffs with observed runtime signals."}
              </p>
            </div>
            <div className="rounded-xl border border-hairline bg-surface/60 p-5 font-mono text-xs elevate">
              <div className="mb-2 text-muted-foreground">
                stripe · POST /v1/charges · response schema
              </div>
              <div className="text-breaking/90">- amount: integer</div>
              <div className="text-signal/90">+ amount: string</div>
              <div className="mt-1 text-muted-foreground/70">
                - outcome.seller_message
              </div>
              <div className="mt-1 text-muted-foreground/70">
                + required header: Stripe-Version
              </div>
            </div>
          </div>
        )}

        {tab === "fix" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-signal/30 bg-signal/[0.04] p-5 elevate">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-signal">
                <CheckCircle2 className="h-3.5 w-3.5" /> recommended patch
              </div>
              <div className="mt-2 text-sm text-foreground/90">
                Update <span className="font-mono">payments-service</span> to parse `amount` as string and coerce with `Number.parseInt`. Pin `Stripe-Version` in the outbound client.
              </div>
            </div>
            <div className="overflow-hidden rounded-xl border border-hairline bg-surface/60 font-mono text-xs elevate">
              <div className="border-b border-hairline bg-background/40 px-4 py-2 text-muted-foreground">
                packages/payments/src/adapter.ts
              </div>
              <div className="p-4">
                <div className="text-breaking/90">
                  - const amount = data.amount as number;
                </div>
                <div className="text-signal/90">
                  + const amount = Number.parseInt(data.amount, 10);
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="rounded-lg bg-brand px-3 py-2 text-sm font-medium text-brand-foreground hover:scale-[1.02] brand-glow">
                Open patch PR
              </button>
              <button className="rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-foreground/80 hover:bg-surface-raised">
                Copy diff
              </button>
            </div>
          </div>
        )}

        {tab === "similar" && <SimilarList expanded />}
      </PageBody>
    </>
  );
}

function MetaCard({ incident }: { incident: (typeof incidents)[number] }) {
  return (
    <div className="rounded-xl border border-hairline bg-surface/60 elevate">
      <div className="border-b border-hairline px-4 py-3 text-sm font-medium">
        Details
      </div>
      <dl className="divide-y divide-hairline text-sm">
        {[
          ["Status", <IncidentStatusBadge key="s" status={incident.status} />],
          ["API", incident.api],
          ["Assignee", incident.assignee],
          ["Opened", timeAgo(incident.openedAt)],
          ["Updated", timeAgo(incident.updatedAt)],
          ["Environment", "production"],
          ["Region", "us-east-1"],
        ].map(([k, v]) => (
          <div
            key={k as string}
            className="flex items-center justify-between px-4 py-2.5"
          >
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="font-medium">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function SimilarList({ expanded }: { expanded?: boolean }) {
  return (
    <div className="rounded-xl border border-hairline bg-surface/60 elevate">
      <div className="border-b border-hairline px-4 py-3 text-sm font-medium">
        Similar past incidents
      </div>
      <div className="divide-y divide-hairline">
        {relatedIncidents.map((r) => (
          <Link
            key={r.id}
            to="/incidents/$incidentId"
            params={{ incidentId: r.id }}
            className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-raised"
          >
            <div className="grid h-8 w-8 place-items-center rounded-md border border-hairline bg-background/40">
              <GitBranch className="h-4 w-4 text-analyzing" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm">{r.title}</div>
              <div className="font-mono text-xs text-muted-foreground">
                {r.code}
                {expanded && " · resolved · vendor rotation"}
              </div>
            </div>
            <span className="font-mono text-xs text-signal">
              {Math.round(r.similarity * 100)}% match
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
