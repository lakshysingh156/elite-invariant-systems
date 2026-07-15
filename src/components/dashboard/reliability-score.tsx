import { motion } from "motion/react";
import { ArrowUpRight, Info } from "lucide-react";
import { Sparkline } from "@/components/ui-kit/metrics";

// 30-day reliability history
const history = Array.from({ length: 30 }, (_, i) => {
  const base = 97.2 + Math.sin(i / 3) * 0.6;
  const dip = i > 18 && i < 22 ? -1.2 : 0;
  return Math.round((base + dip + (Math.random() - 0.5) * 0.4) * 10) / 10;
});

const SCORE = 98.4;
const DELTA = 2.3;

export function ReliabilityScore() {
  const size = 168;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = SCORE / 100;
  const offset = c - pct * c;

  return (
    <div className="rounded-xl border border-hairline bg-surface/60 p-5 elevate">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Reliability score
            <Info className="h-3 w-3" />
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            Rolling composite across contract, runtime & blast-radius signals.
          </div>
        </div>
        <span className="rounded-md border border-hairline bg-background/60 px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
          30d
        </span>
      </div>

      <div className="grid grid-cols-[auto_1fr] items-center gap-6">
        <div className="relative grid place-items-center">
          <svg width={size} height={size} className="-rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke="var(--hairline)"
              strokeWidth={stroke}
            />
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke="url(#relGrad)"
              strokeWidth={stroke}
              strokeDasharray={c}
              strokeLinecap="round"
              initial={{ strokeDashoffset: c }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            />
            <defs>
              <linearGradient id="relGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--brand)" />
                <stop offset="100%" stopColor="var(--signal)" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute flex flex-col items-center">
            <div className="font-mono text-4xl font-semibold tabular-nums tracking-tight">
              {SCORE}
            </div>
            <div className="mt-0.5 inline-flex items-center gap-0.5 font-mono text-xs text-signal">
              <ArrowUpRight className="h-3 w-3" />
              {DELTA}%
            </div>
          </div>
        </div>

        <div className="min-w-0">
          <div className="grid grid-cols-2 gap-3">
            {[
              { l: "Contract health", v: "99.1", tone: "text-signal" },
              { l: "Runtime health", v: "97.8", tone: "text-signal" },
              { l: "Confidence", v: "0.94", tone: "text-foreground" },
              { l: "Active risks", v: "3", tone: "text-drift" },
            ].map((k) => (
              <div
                key={k.l}
                className="rounded-lg border border-hairline bg-background/40 p-3"
              >
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {k.l}
                </div>
                <div className={`mt-1 font-mono text-lg font-semibold tabular-nums ${k.tone}`}>
                  {k.v}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-end justify-between">
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Trailing 30 days
            </div>
            <Sparkline data={history} width={220} height={38} tone="signal" />
          </div>
        </div>
      </div>
    </div>
  );
}
