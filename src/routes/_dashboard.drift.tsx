import { createFileRoute } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader, PageBody, Panel } from "@/components/dashboard/page-shell";
import { StatusBadge } from "@/components/ui-kit/status-badge";
import { driftEvents, latencySeries } from "@/data/drift";
import { timeAgo } from "@/lib/format";

export const Route = createFileRoute("/_dashboard/drift")({
  head: () => ({ meta: [{ title: "Drift Reports — Invariant." }] }),
  component: Drift,
});

const typeLabel: Record<string, string> = {
  schema: "Schema",
  latency: "Latency",
  "error-rate": "Error rate",
  auth: "Auth",
};

function Drift() {
  return (
    <>
      <PageHeader
        title="Drift Reports"
        description="Live behaviour diverging from the 7-day rolling baseline."
      />
      <PageBody className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <Panel title="Search Service · GET /search — p95 latency">
            <div className="h-64 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={latencySeries} margin={{ left: -12, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="obs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--drift)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--drift)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="t"
                    tick={{ fontSize: 10, fontFamily: "JetBrains Mono", fill: "var(--muted-foreground)" }}
                    interval={11}
                    stroke="var(--hairline)"
                  />
                  <YAxis
                    tick={{ fontSize: 10, fontFamily: "JetBrains Mono", fill: "var(--muted-foreground)" }}
                    stroke="var(--hairline)"
                    width={44}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                      fontFamily: "JetBrains Mono",
                    }}
                    labelStyle={{ color: "var(--muted-foreground)" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="observed"
                    stroke="var(--drift)"
                    strokeWidth={2}
                    fill="url(#obs)"
                    name="observed"
                  />
                  <Line
                    type="monotone"
                    dataKey="baseline"
                    stroke="var(--muted-foreground)"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    dot={false}
                    name="baseline"
                  />
                  <Line
                    type="monotone"
                    dataKey="upper"
                    stroke="var(--breaking)"
                    strokeDasharray="2 4"
                    strokeWidth={1}
                    dot={false}
                    name="+3σ threshold"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
            {[
              { l: "Detected (24h)", v: "5", t: "text-analyzing" },
              { l: "Above threshold", v: "3", t: "text-breaking" },
              { l: "Peak deviation", v: "+4.4σ", t: "text-drift" },
              { l: "Mean confidence", v: "84%", t: "text-foreground" },
            ].map((s) => (
              <div
                key={s.l}
                className="rounded-xl border border-hairline bg-surface/60 p-4"
              >
                <div className="text-sm text-muted-foreground">{s.l}</div>
                <div className={`mt-2 font-mono text-2xl font-semibold ${s.t}`}>
                  {s.v}
                </div>
              </div>
            ))}
          </div>
        </div>

        <Panel title="Drift events">
          <div className="divide-y divide-hairline">
            {driftEvents.map((d) => (
              <div
                key={d.id}
                className="grid grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-3.5"
              >
                <StatusBadge status={d.status} pulse={d.status !== "stable"} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{d.endpoint}</span>
                    <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] uppercase text-muted-foreground">
                      {typeLabel[d.type]}
                    </span>
                  </div>
                  <div className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                    {d.apiName} · {d.baseline} → {d.observed} · {d.deviation}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm text-foreground">
                    {Math.round(d.confidence * 100)}%
                  </div>
                  <div className="font-mono text-xs text-muted-foreground">
                    {timeAgo(d.detectedAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </PageBody>
    </>
  );
}
