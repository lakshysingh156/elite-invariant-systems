import { Link } from "@tanstack/react-router";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import { apis } from "@/data/apis";
import { Sparkline } from "@/components/ui-kit/metrics";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/format";

const dotTone: Record<string, string> = {
  stable: "bg-signal",
  drifting: "bg-drift",
  breaking: "bg-breaking",
  analyzing: "bg-analyzing",
};

const riskFrom = (genome: number, status: string) => {
  if (status === "breaking") return { label: "critical", tone: "text-breaking" };
  if (status === "drifting" || genome < 80)
    return { label: "elevated", tone: "text-drift" };
  if (status === "analyzing") return { label: "review", tone: "text-analyzing" };
  return { label: "low", tone: "text-muted-foreground" };
};

function reqSpark(seed: number) {
  return Array.from({ length: 14 }, (_, i) =>
    Math.round(seed + Math.sin(i / 2 + seed) * (seed / 4)),
  );
}

export function FleetTable() {
  const rows = [...apis].sort((a, b) => a.genome - b.genome);

  return (
    <div className="overflow-hidden rounded-xl border border-hairline bg-surface/60 elevate">
      <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
        <div>
          <div className="text-sm font-medium">API fleet</div>
          <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {apis.length} tracked · 127 monitored org-wide
          </div>
        </div>
        <Link
          to="/apis"
          className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground hover:text-foreground"
        >
          Open fleet <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-hairline bg-background/30 text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-2 font-normal">API</th>
              <th className="px-3 py-2 font-normal">Health</th>
              <th className="px-3 py-2 font-normal">Genome</th>
              <th className="px-3 py-2 font-normal">Requests (24h)</th>
              <th className="px-3 py-2 font-normal">p95</th>
              <th className="px-3 py-2 font-normal">Last change</th>
              <th className="px-3 py-2 font-normal">Risk</th>
              <th className="px-3 py-2 font-normal">Deps</th>
              <th className="w-6 px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((a, i) => {
              const risk = riskFrom(a.genome, a.status);
              const reqs = Math.round(120 + a.endpointCount * 6 + (i % 4) * 32);
              const p95 = 40 + (100 - a.genome) * 4 + i * 3;
              return (
                <tr
                  key={a.id}
                  className="group border-b border-hairline/60 transition-colors last:border-0 hover:bg-surface-raised/60"
                >
                  <td className="px-4 py-3">
                    <Link
                      to="/apis/$apiId"
                      params={{ apiId: a.id }}
                      className="flex items-center gap-2"
                    >
                      <span className="text-sm font-medium">{a.name}</span>
                      <span className="rounded border border-hairline bg-background/60 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                        {a.kind === "third-party" ? "vendor" : "internal"}
                      </span>
                    </Link>
                    <div className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
                      {a.owningTeam} · {a.currentVersion}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          dotTone[a.status],
                          a.status !== "stable" && "live-dot",
                        )}
                      />
                      <span className="font-mono text-xs capitalize text-foreground/80">
                        {a.status}
                      </span>
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "font-mono text-sm font-semibold tabular-nums",
                          a.genome >= 90
                            ? "text-signal"
                            : a.genome >= 75
                              ? "text-drift"
                              : "text-breaking",
                        )}
                      >
                        {a.genome}
                      </span>
                      <Sparkline
                        data={a.genomeTrend.slice(-10)}
                        width={54}
                        height={16}
                        tone={
                          a.genome >= 90
                            ? "signal"
                            : a.genome >= 75
                              ? "drift"
                              : "breaking"
                        }
                      />
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs tabular-nums text-foreground/80">
                        {reqs}k
                      </span>
                      <Sparkline
                        data={reqSpark(reqs)}
                        width={54}
                        height={16}
                        tone="signal"
                      />
                    </div>
                  </td>
                  <td className="px-3 py-3 font-mono text-xs tabular-nums text-foreground/80">
                    {p95}ms
                  </td>
                  <td className="px-3 py-3 font-mono text-xs text-muted-foreground">
                    {timeAgo(a.lastChecked)}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={cn(
                        "font-mono text-[11px] uppercase tracking-wider",
                        risk.tone,
                      )}
                    >
                      {risk.label}
                    </span>
                  </td>
                  <td className="px-3 py-3 font-mono text-xs tabular-nums text-foreground/80">
                    {2 + (i % 5)}
                  </td>
                  <td className="px-2 py-3">
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 transition-colors group-hover:text-foreground" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
