import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowLeft, Sparkles, CheckCircle2, GitBranch } from "lucide-react";
import { PageHeader, PageBody, Panel } from "@/components/dashboard/page-shell";
import { IncidentStatusBadge, StatusBadge } from "@/components/ui-kit/status-badge";
import { getIncident, incidents } from "@/data/incidents";
import { relatedIncidents } from "@/data/copilot";
import { clockUTC, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { IncidentStatus } from "@/types";

export const Route = createFileRoute("/_dashboard/incidents/$incidentId")({
  loader: ({ params }) => {
    const incident = getIncident(params.incidentId);
    if (!incident) throw notFound();
    return { incident };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.incident.code} — Invariant.` : "Incident" },
    ],
  }),
  notFoundComponent: () => (
    <PageBody>
      <div className="text-sm text-muted-foreground">Incident not found.</div>
    </PageBody>
  ),
  component: IncidentDetail,
});

const pipeline: IncidentStatus[] = [
  "detected",
  "analyzing",
  "identified",
  "mitigating",
  "resolved",
];

function IncidentDetail() {
  const { incident } = Route.useLoaderData();
  const currentIdx = pipeline.indexOf(incident.status);

  return (
    <>
      <PageHeader
        eyebrow={`${incident.code} · ${incident.api}`}
        title={incident.title}
        actions={
          <div className="flex items-center gap-2">
            <Link
              to="/incidents"
              className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> All incidents
            </Link>
            <Link
              to="/copilot"
              className="inline-flex items-center gap-1.5 rounded-lg bg-signal px-3 py-2 text-sm font-medium text-signal-foreground transition-transform hover:scale-[1.02]"
            >
              <Sparkles className="h-4 w-4" /> Ask Copilot
            </Link>
          </div>
        }
      />
      <PageBody className="space-y-6">
        {/* status pipeline */}
        <Panel title="Status pipeline">
          <div className="flex flex-wrap items-center gap-2 p-5">
            {pipeline.map((step, i) => {
              const done = i < currentIdx;
              const active = i === currentIdx;
              return (
                <div key={step} className="flex items-center gap-2">
                  <div
                    className={cn(
                      "flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-xs capitalize",
                      active
                        ? "border-signal/40 bg-signal/10 text-signal"
                        : done
                          ? "border-stable/30 bg-stable/10 text-stable"
                          : "border-hairline bg-secondary text-muted-foreground",
                    )}
                  >
                    {done ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          active ? "bg-signal live-dot" : "bg-muted-foreground",
                        )}
                      />
                    )}
                    {step}
                  </div>
                  {i < pipeline.length - 1 && (
                    <span
                      className={cn(
                        "h-px w-5",
                        i < currentIdx ? "bg-stable/40" : "bg-hairline",
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </Panel>

        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-6">
            <Panel title="Summary">
              <div className="space-y-4 p-4">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {incident.summary}
                </p>
                {incident.rootCause && (
                  <div className="rounded-lg border border-breaking/20 bg-breaking/5 p-3">
                    <div className="mb-1 font-mono text-[11px] uppercase tracking-wider text-breaking/80">
                      Root cause
                    </div>
                    <p className="text-sm text-foreground/90">
                      {incident.rootCause}
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { l: "Severity", v: incident.severity },
                    { l: "Services", v: incident.affectedServices },
                    { l: "Endpoints", v: incident.affectedEndpoints },
                  ].map((s) => (
                    <div key={s.l} className="rounded-lg bg-background/40 p-3">
                      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {s.l}
                      </div>
                      <div className="mt-1 font-mono text-sm font-semibold capitalize">
                        {s.v}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>

            <Panel title="Investigation timeline">
              <div className="relative space-y-0 p-4">
                {incident.timeline.map((ev, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="relative flex gap-4 pb-5 last:pb-0"
                  >
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
                  </motion.div>
                ))}
              </div>
            </Panel>
          </div>

          <div className="space-y-6">
            <Panel title="Details">
              <dl className="divide-y divide-hairline text-sm">
                {[
                  ["Status", <IncidentStatusBadge key="s" status={incident.status} />],
                  ["Assignee", incident.assignee],
                  ["Opened", timeAgo(incident.openedAt)],
                  ["Updated", timeAgo(incident.updatedAt)],
                  ["API", incident.api],
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
            </Panel>

            <Panel title="Similar past incidents">
              <div className="divide-y divide-hairline">
                {relatedIncidents.map((r) => (
                  <Link
                    key={r.id}
                    to="/incidents/$incidentId"
                    params={{ incidentId: r.id }}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-raised"
                  >
                    <GitBranch className="h-4 w-4 text-analyzing" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm">{r.title}</div>
                      <div className="font-mono text-xs text-muted-foreground">
                        {r.code}
                      </div>
                    </div>
                    <span className="font-mono text-xs text-stable">
                      {Math.round(r.similarity * 100)}%
                    </span>
                  </Link>
                ))}
              </div>
            </Panel>

            {incident.status !== "resolved" && (
              <button className="w-full rounded-xl border border-stable/30 bg-stable/10 px-4 py-3 text-sm font-medium text-stable transition-colors hover:bg-stable/15">
                Mark resolved (requires resolution notes)
              </button>
            )}
          </div>
        </div>
      </PageBody>
    </>
  );
}

void incidents;
