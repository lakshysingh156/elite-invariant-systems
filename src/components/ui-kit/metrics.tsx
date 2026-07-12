import { cn } from "@/lib/utils";

function scoreTone(score: number) {
  if (score >= 90) return "text-stable";
  if (score >= 75) return "text-drift";
  return "text-breaking";
}
function scoreStroke(score: number) {
  if (score >= 90) return "var(--stable)";
  if (score >= 75) return "var(--drift)";
  return "var(--breaking)";
}

export function GenomeRing({
  score,
  size = 44,
  stroke = 4,
  showLabel = true,
  className,
}: {
  score: number;
  size?: number;
  stroke?: number;
  showLabel?: boolean;
  className?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  return (
    <div
      className={cn("relative inline-grid place-items-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--hairline)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={scoreStroke(score)}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.16,1,0.3,1)" }}
        />
      </svg>
      {showLabel && (
        <span
          className={cn(
            "absolute font-mono font-semibold tabular-nums",
            scoreTone(score),
          )}
          style={{ fontSize: size * 0.28 }}
        >
          {score}
        </span>
      )}
    </div>
  );
}

export function Sparkline({
  data,
  width = 120,
  height = 32,
  className,
  tone = "signal",
}: {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
  tone?: "signal" | "stable" | "drift" | "breaking";
}) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const stroke = `var(--${tone})`;
  const id = `spark-${tone}-${width}`;
  return (
    <svg width={width} height={height} className={className} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.25" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={`0,${height} ${pts.join(" ")} ${width},${height}`}
        fill={`url(#${id})`}
        stroke="none"
      />
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
