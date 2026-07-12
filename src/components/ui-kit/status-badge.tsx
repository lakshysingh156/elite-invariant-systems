import { cn } from "@/lib/utils";
import type { ApiStatus, StatusKind, Severity, IncidentStatus } from "@/types";

type Tone = "stable" | "drift" | "breaking" | "analyzing";

const toneMap: Record<Tone, { dot: string; text: string; ring: string; bg: string }> = {
  stable: {
    dot: "bg-stable",
    text: "text-stable",
    ring: "ring-stable/25",
    bg: "bg-stable/10",
  },
  drift: {
    dot: "bg-drift",
    text: "text-drift",
    ring: "ring-drift/25",
    bg: "bg-drift/10",
  },
  breaking: {
    dot: "bg-breaking",
    text: "text-breaking",
    ring: "ring-breaking/25",
    bg: "bg-breaking/10",
  },
  analyzing: {
    dot: "bg-analyzing",
    text: "text-analyzing",
    ring: "ring-analyzing/25",
    bg: "bg-analyzing/10",
  },
};

const apiStatusToTone: Record<ApiStatus, Tone> = {
  stable: "stable",
  drifting: "drift",
  breaking: "breaking",
  analyzing: "analyzing",
};

const apiStatusLabel: Record<ApiStatus, string> = {
  stable: "Stable",
  drifting: "Drifting",
  breaking: "Breaking",
  analyzing: "Analyzing",
};

export function toneForStatus(s: ApiStatus | StatusKind): Tone {
  if (s in apiStatusToTone) return apiStatusToTone[s as ApiStatus];
  return s as Tone;
}

export function StatusBadge({
  status,
  label,
  pulse,
  className,
}: {
  status: ApiStatus | StatusKind;
  label?: string;
  pulse?: boolean;
  className?: string;
}) {
  const tone = toneForStatus(status);
  const t = toneMap[tone];
  const text =
    label ??
    (status in apiStatusLabel
      ? apiStatusLabel[status as ApiStatus]
      : status.charAt(0).toUpperCase() + status.slice(1));
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        t.bg,
        t.text,
        t.ring,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", t.dot, pulse && "live-dot")} />
      <span className="font-mono tracking-tight">{text}</span>
    </span>
  );
}

const severityTone: Record<Severity, Tone> = {
  breaking: "breaking",
  risky: "drift",
  safe: "stable",
};
const severityLabel: Record<Severity, string> = {
  breaking: "Breaking",
  risky: "Risky",
  safe: "Safe",
};

export function SeverityPill({
  severity,
  className,
}: {
  severity: Severity;
  className?: string;
}) {
  const t = toneMap[severityTone[severity]];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset font-mono",
        t.bg,
        t.text,
        t.ring,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-[2px]", t.dot)} />
      {severityLabel[severity]}
    </span>
  );
}

const incidentStatusTone: Record<IncidentStatus, Tone> = {
  detected: "breaking",
  analyzing: "analyzing",
  identified: "drift",
  mitigating: "drift",
  resolved: "stable",
};

export function IncidentStatusBadge({
  status,
  className,
}: {
  status: IncidentStatus;
  className?: string;
}) {
  const t = toneMap[incidentStatusTone[status]];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset font-mono capitalize",
        t.bg,
        t.text,
        t.ring,
        className,
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          t.dot,
          status !== "resolved" && "live-dot",
        )}
      />
      {status}
    </span>
  );
}
