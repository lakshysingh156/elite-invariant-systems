import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { PageHeader, PageBody, EmptyState } from "@/components/dashboard/page-shell";
import { IncidentStatusBadge } from "@/components/ui-kit/status-badge";
import { incidents } from "@/data/incidents";
import type { IncidentSeverity } from "@/types";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/format";

export const Route = createFileRoute("/_dashboard/incidents/")({
  head: () => ({ meta: [{ title: "Incident Center — Invariant." }] }),
  component: IncidentCenter,
});

const sevTone: Record<IncidentSeverity, string> = {
  critical: "text-breaking border-breaking/40 bg-breaking/10",
  high: "text-drift border-drift/40 bg-drift/10",
  medium: "text-analyzing border-analyzing/40 bg-analyzing/10",
  low: "text-muted-foreground border-hairline bg-secondary",
};

const filters = ["all", "open", "resolved"] as const;

function IncidentCenter() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<(typeof filters)[number]>("all");

  const list = incidents.filter((i) =>
    filter === "all"
      ? true
      : filter === "open"
        ? i.status !== "resolved"
        : i.status === "resolved",
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
                  filter === f
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {f}
              </button>
            ))}
          </div>
        }
      />
      <PageBody>
        {list.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="No incidents here"
            description="Nothing matches this filter. When Invariant correlates a qualifying signal, it appears here as a structured incident."
          />
        ) : (
          <div className="space-y-3">
            {list.map((inc) => (
              <button
                key={inc.id}
                onClick={() =>
                  navigate({
                    to: "/incidents/$incidentId",
                    params: { incidentId: inc.id },
                  })
                }
                className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 rounded-xl border border-hairline bg-surface/60 p-4 text-left transition-colors hover:border-signal/30 hover:bg-surface-raised"
              >
                <span
                  className={cn(
                    "rounded-md border px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wide",
                    sevTone[inc.severity],
                  )}
                >
                  {inc.severity}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">
                      {inc.code}
                    </span>
                    <IncidentStatusBadge status={inc.status} />
                  </div>
                  <div className="mt-1 truncate font-medium">{inc.title}</div>
                  <div className="mt-0.5 truncate text-xs text-muted-foreground">
                    {inc.api} · {inc.affectedServices} services ·{" "}
                    {inc.affectedEndpoints} endpoints · {inc.assignee}
                  </div>
                </div>
                <div className="text-right font-mono text-xs text-muted-foreground">
                  {timeAgo(inc.updatedAt)}
                </div>
              </button>
            ))}
          </div>
        )}
      </PageBody>
    </>
  );
}
