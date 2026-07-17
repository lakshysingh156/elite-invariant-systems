import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  AlertOctagon,
  Activity,
  GitBranch,
  Wrench,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { PageBody } from "@/components/dashboard/page-shell";
import { IncidentStatusBadge, StatusBadge } from "@/components/ui-kit/status-badge";
import { getIncidentDetail, updateIncidentStatus } from "@/lib/incidents.functions";
import { timeAgo, clockUTC } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_dashboard/incidents/$incidentId")({
  head: () => ({ meta: [{ title: "Incident — Invariant." }] }),
  component: IncidentDetail,
});

const sevChip: Record<string, string> = {
  critical: "text-breaking bg-breaking/10 border-breaking/40",
  high: "text-drift bg-drift/10 border-drift/40",
  medium: "text-analyzing bg-analyzing/10 border-analyzing/40",
  low: "text-muted-foreground bg-secondary border-hairline",
};

const changeChip: Record<string, string> = {
  breaking: "text-breaking bg-breaking/10",
  risky: "text-drift bg-drift/10",
  safe: "text-stable bg-stable/10",
};

const tabs = [
  { id: "overview", label: "Overview", icon: AlertOctagon },
  { id: "timeline", label: "Timeline", icon: Activity },
  { id: "cause", label: "Root cause", icon: GitBranch },
  { id: "fix", label: "Fix", icon: Wrench },
] as const;

function IncidentDetail() {
  const params = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("overview");
  const getFn = useServerFn(getIncidentDetail);
  const updateFn = useServerFn(updateIncidentStatus);

  const { data, isLoading } = useQuery({
    queryKey: ["incident", params.incidentId],
    queryFn: () => getFn({ data: { incidentId: params.incidentId } }),
  });

  const statusMut = useMutation({
    mutationFn: (status: "detected" | "analyzing" | "identified" | "mitigating" | "resolved") =>
      updateFn({ data: { incidentId: params.incidentId, status } }),
    onSuccess: () => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["incident", params.incidentId] });
      qc.invalidateQueries({ queryKey: ["incidents"] });
      qc.invalidateQueries({ queryKey: ["dashboard-overview"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  if (isLoading) {
    return (
      <PageBody>
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading incident…
        </div>
      </PageBody>
    );
  }

  if (!data) {
    return (
      <PageBody>
        <div className="text-sm text-muted-foreground">Incident not found.</div>
      </PageBody>
    );
  }

  const { incident, events, changes } = data;

  return (
    <>
      <div className="border-b border-hairline bg-background/60 px-6 pt-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              <Link to="/incidents" className="inline-flex items-center gap-1 hover:text-foreground">
                <ArrowLeft className="h-3 w-3" /> incidents
              </Link>
              <span>/</span>
              <span>{incident.code}</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={cn("rounded-md border px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider", sevChip[incident.severity])}>
                {incident.severity}
              </span>
              <IncidentStatusBadge status={incident.status} />
              <span className="font-mono text-xs text-muted-foreground">
                opened {timeAgo(incident.opened_at)}{incident.assignee ? ` · ${incident.assignee}` : ""}
              </span>
            </div>
            <h1 className="mt-2 truncate text-2xl font-semibold tracking-tight">{incident.title}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <select
              value={incident.status}
              onChange={(e) => statusMut.mutate(e.target.value as any)}
              className="rounded-lg border border-hairline bg-surface px-3 py-2 text-sm"
            >
              {["detected", "analyzing", "identified", "mitigating", "resolved"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <Link
              to="/copilot"
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-brand-foreground transition-transform hover:scale-[1.02] brand-glow"
            >
              <Sparkles className="h-4 w-4" /> Investigate with Copilot
            </Link>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-t-lg border border-b-0 border-hairline bg-hairline sm:grid-cols-4">
          {[
            { l: "Affected services", v: incident.affected_services },
            { l: "Affected endpoints", v: incident.affected_endpoints },
            { l: "Contract changes", v: changes.length },
            { l: "Last update", v: timeAgo(incident.updated_at) },
          ].map((s) => (
            <div key={s.l} className="bg-background/60 px-4 py-3">
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{s.l}</div>
              <div className="mt-1 font-mono text-base font-semibold tabular-nums">{s.v}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "inline-flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm transition-colors",
                tab === t.id ? "border-brand text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
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
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Summary</div>
                <p className="mt-2 text-sm leading-relaxed text-foreground/85">{incident.summary ?? "—"}</p>
                {incident.root_cause && (
                  <div className="mt-4 rounded-lg border border-breaking/20 bg-breaking/5 p-3">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-breaking/80">Root cause</div>
                    <p className="mt-1 text-sm text-foreground/90">{incident.root_cause}</p>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-hairline bg-surface/60 elevate">
                <div className="border-b border-hairline px-4 py-3 text-sm font-medium">Contract changes</div>
                {changes.length === 0 ? (
                  <div className="px-4 py-6 text-sm text-muted-foreground">No changes recorded.</div>
                ) : (
                  <div className="divide-y divide-hairline">
                    {changes.map((c: any) => (
                      <div key={c.id} className="grid grid-cols-[auto_1fr] gap-3 px-4 py-3">
                        <span className={cn("h-fit rounded px-1.5 py-0.5 font-mono text-[10px] uppercase", changeChip[c.severity])}>
                          {c.severity}
                        </span>
                        <div className="min-w-0">
                          <div className="text-sm">{c.summary}</div>
                          <div className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
                            {c.method ?? ""} {c.endpoint_path ?? ""} · {c.target}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-hairline bg-surface/60 elevate">
              <div className="border-b border-hairline px-4 py-3 text-sm font-medium">Details</div>
              <dl className="divide-y divide-hairline text-sm">
                {[
                  ["API", incident.api_name],
                  ["Severity", incident.severity],
                  ["Status", <IncidentStatusBadge key="s" status={incident.status} />],
                  ["Assignee", incident.assignee ?? "—"],
                  ["Opened", timeAgo(incident.opened_at)],
                  ["Updated", timeAgo(incident.updated_at)],
                ].map(([k, v]) => (
                  <div key={k as string} className="flex items-center justify-between px-4 py-2.5">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="font-medium">{v as any}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        )}

        {tab === "timeline" && (
          <div className="rounded-xl border border-hairline bg-surface/60 p-5 elevate">
            {events.length === 0 ? (
              <div className="text-sm text-muted-foreground">No events yet.</div>
            ) : (
              events.map((ev: any, i: number) => (
                <div key={ev.id} className="relative flex gap-4 pb-5 last:pb-0">
                  <div className="flex flex-col items-center">
                    <StatusBadge status={ev.kind as any} label="" className="!px-1.5" />
                    {i < events.length - 1 && <span className="mt-1 w-px flex-1 bg-hairline" />}
                  </div>
                  <div className="pb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{ev.label}</span>
                      <span className="font-mono text-xs text-muted-foreground">{clockUTC(ev.at)}</span>
                    </div>
                    {ev.detail && <div className="mt-0.5 font-mono text-xs text-muted-foreground">{ev.detail}</div>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "cause" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-hairline bg-surface/60 p-5 elevate">
              <div className="font-mono text-[10px] uppercase tracking-wider text-analyzing">root cause</div>
              <p className="mt-2 text-sm leading-relaxed text-foreground/90">
                {incident.root_cause ?? "Root cause analysis pending. Ask Copilot to correlate contract diffs with runtime signals."}
              </p>
            </div>
            {changes.slice(0, 6).map((c: any) => (
              <div key={c.id} className="rounded-xl border border-hairline bg-surface/60 p-4 font-mono text-xs elevate">
                <div className="mb-2 text-muted-foreground">{c.method ?? ""} {c.endpoint_path ?? ""} · {c.target}</div>
                {c.before_snippet && <div className="text-breaking/90">- {c.before_snippet}</div>}
                {c.after_snippet && <div className="text-signal/90">+ {c.after_snippet}</div>}
                <div className="mt-1 text-muted-foreground/70">{c.summary}</div>
              </div>
            ))}
          </div>
        )}

        {tab === "fix" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-signal/30 bg-signal/[0.04] p-5 elevate">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-signal">
                <CheckCircle2 className="h-3.5 w-3.5" /> next actions
              </div>
              <ul className="mt-2 list-disc pl-5 text-sm text-foreground/90">
                <li>Update the affected client to match the new schema.</li>
                <li>Pin the vendor version header if applicable.</li>
                <li>Add a contract test to catch regressions before deploy.</li>
              </ul>
            </div>
            <button
              onClick={() => statusMut.mutate("resolved")}
              disabled={statusMut.isPending || incident.status === "resolved"}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground brand-glow disabled:opacity-70"
            >
              {statusMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Mark resolved
            </button>
          </div>
        )}
      </PageBody>
    </>
  );
}
