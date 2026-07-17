import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Activity } from "lucide-react";
import { PageHeader, PageBody, Panel, EmptyState } from "@/components/dashboard/page-shell";
import { getDashboardOverview } from "@/lib/dashboard.functions";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_dashboard/drift")({
  head: () => ({ meta: [{ title: "Drift Reports — Invariant." }] }),
  component: Drift,
});

const sevChip: Record<string, string> = {
  breaking: "text-breaking bg-breaking/10 border-breaking/40",
  risky: "text-drift bg-drift/10 border-drift/40",
  safe: "text-stable bg-stable/10 border-stable/40",
};

function Drift() {
  const overviewFn = useServerFn(getDashboardOverview);
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-overview"],
    queryFn: () => overviewFn(),
  });

  if (isLoading || !data) {
    return (
      <PageBody>
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading drift signals…
        </div>
      </PageBody>
    );
  }

  const { stats, recentChanges } = data;

  return (
    <>
      <PageHeader title="Drift Reports" description="Contract deviations across every API your workspace tracks." />
      <PageBody className="space-y-5">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-hairline bg-hairline sm:grid-cols-4">
          <Tile label="Changes (30d)" value={stats.changes30d} />
          <Tile label="Breaking" value={stats.breaking30d} tone="text-breaking" />
          <Tile label="Risky" value={stats.risky30d} tone="text-drift" />
          <Tile label="Safe" value={Math.max(0, stats.changes30d - stats.breaking30d - stats.risky30d)} tone="text-stable" />
        </div>

        <Panel title="Recent drift events">
          {recentChanges.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No drift detected"
              description="Every API you're tracking is aligned with its baseline. Upload a new spec version to detect drift."
            />
          ) : (
            <div className="divide-y divide-hairline">
              {recentChanges.map((c: any) => (
                <div key={c.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-3">
                  <span className={cn("rounded-md border px-2 py-1 font-mono text-[10px] uppercase", sevChip[c.severity])}>
                    {c.severity}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{c.method ?? ""} {c.endpoint_path ?? c.target}</span>
                      <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] uppercase text-muted-foreground">
                        {c.kind}
                      </span>
                    </div>
                    <div className="mt-0.5 truncate text-xs text-muted-foreground">
                      {c.api_name} · {c.summary}
                    </div>
                  </div>
                  <div className="font-mono text-xs text-muted-foreground">{timeAgo(c.created_at)}</div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </PageBody>
    </>
  );
}

function Tile({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="bg-surface/60 px-4 py-3">
      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn("mt-1 font-mono text-xl font-semibold tabular-nums", tone)}>{value}</div>
    </div>
  );
}
