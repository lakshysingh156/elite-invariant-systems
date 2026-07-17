import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2 } from "lucide-react";
import { PageHeader, PageBody, EmptyState } from "@/components/dashboard/page-shell";
import { IncidentStatusBadge } from "@/components/ui-kit/status-badge";
import { listIncidents } from "@/lib/incidents.functions";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/format";

export const Route = createFileRoute("/_dashboard/incidents/")({
  head: () => ({ meta: [{ title: "Incident Center — Invariant." }] }),
  component: IncidentCenter,
});

const sevTone: Record<string, string> = {
  critical: "text-breaking border-breaking/40 bg-breaking/10",
  high: "text-drift border-drift/40 bg-drift/10",
  medium: "text-analyzing border-analyzing/40 bg-analyzing/10",
  low: "text-muted-foreground border-hairline bg-secondary",
};

const filters = ["all", "open", "resolved"] as const;

function IncidentCenter() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<(typeof filters)[number]>("all");
  const listFn = useServerFn(listIncidents);
  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ["incidents"],
    queryFn: () => listFn(),
  });

  const list = incidents.filter((i: any) =>
    filter === "all" ? true : filter === "open" ? i.status !== "resolved" : i.status === "resolved",
  );

  return (
    <>
      <PageHeader
        title="Incident Center"
        description="Triage and investigate contract & runtime incidents."
        actions={
          <div className="flex rounded-lg border border-hairline bg-surface p-0.5">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm capitalize transition-colors",
                  filter === f ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {f}
              </button>
            ))}
          </div>
        }
      />
      <PageBody>
        {isLoading ? (
          <div className="flex items-center justify-center py-24 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading incidents…
          </div>
        ) : list.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="No incidents here"
            description="Nothing matches this filter. When Invariant correlates a qualifying signal, it appears here as a structured incident."
          />
        ) : (
          <div className="space-y-3">
            {list.map((inc: any) => (
              <button
                key={inc.id}
                onClick={() => navigate({ to: "/incidents/$incidentId", params: { incidentId: inc.id } })}
                className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 rounded-xl border border-hairline bg-surface/60 p-4 text-left transition-colors hover:border-brand/30 hover:bg-surface-raised"
              >
                <span className={cn("rounded-md border px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wide", sevTone[inc.severity])}>
                  {inc.severity}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{inc.code}</span>
                    <IncidentStatusBadge status={inc.status} />
                  </div>
                  <div className="mt-1 truncate font-medium">{inc.title}</div>
                  <div className="mt-0.5 truncate text-xs text-muted-foreground">
                    {inc.api_name} · {inc.affected_services} services · {inc.affected_endpoints} endpoints
                    {inc.assignee ? ` · ${inc.assignee}` : ""}
                  </div>
                </div>
                <div className="text-right font-mono text-xs text-muted-foreground">
                  {timeAgo(inc.updated_at)}
                </div>
              </button>
            ))}
          </div>
        )}
      </PageBody>
    </>
  );
}
