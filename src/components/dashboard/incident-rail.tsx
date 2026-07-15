import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { incidents } from "@/data/incidents";
import { IncidentStatusBadge } from "@/components/ui-kit/status-badge";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const sevRail: Record<string, string> = {
  critical: "bg-breaking",
  high: "bg-drift",
  medium: "bg-analyzing",
  low: "bg-muted-foreground/40",
};

export function IncidentRail() {
  const open = incidents.filter((i) => i.status !== "resolved").slice(0, 5);
  return (
    <div className="rounded-xl border border-hairline bg-surface/60 elevate">
      <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Active incidents</span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-breaking">
            {open.length} open
          </span>
        </div>
        <Link
          to="/incidents"
          className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground hover:text-foreground"
        >
          All <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
      <div>
        {open.map((inc) => (
          <Link
            key={inc.id}
            to="/incidents/$incidentId"
            params={{ incidentId: inc.id }}
            className="group flex items-stretch gap-0 border-b border-hairline/60 transition-colors last:border-0 hover:bg-surface-raised/60"
          >
            <span className={cn("w-0.5 shrink-0", sevRail[inc.severity])} />
            <div className="min-w-0 flex-1 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-muted-foreground">
                  {inc.code}
                </span>
                <IncidentStatusBadge status={inc.status} />
                <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {inc.severity}
                </span>
              </div>
              <div className="mt-1 truncate text-sm font-medium">
                {inc.title}
              </div>
              <div className="mt-0.5 flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
                <span>{inc.api}</span>
                <span>·</span>
                <span>{inc.affectedEndpoints} eps</span>
                <span className="ml-auto">{timeAgo(inc.updatedAt)}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
