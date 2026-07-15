import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Radio } from "lucide-react";
import { cn } from "@/lib/utils";

type Ev = {
  id: string;
  at: string;
  kind: "breaking" | "drift" | "analyzing" | "stable";
  label: string;
  detail: string;
};

const seed: Ev[] = [
  {
    id: "e1",
    at: "03:42:11",
    kind: "breaking",
    label: "Contract change · Stripe /charges",
    detail: "3 breaking changes · `amount` type mismatch",
  },
  {
    id: "e2",
    at: "03:42:15",
    kind: "analyzing",
    label: "Blast radius computed",
    detail: "3 services · 12 endpoints reachable",
  },
  {
    id: "e3",
    at: "03:42:18",
    kind: "analyzing",
    label: "Copilot investigation started",
    detail: "correlating with INV-C231, dr1",
  },
  {
    id: "e4",
    at: "03:42:32",
    kind: "drift",
    label: "Mitigation drafted",
    detail: "Patch PR opened on payments-service",
  },
  {
    id: "e5",
    at: "03:45:04",
    kind: "stable",
    label: "Auth Gateway · handshake stable",
    detail: "p95 41ms · error 0.02%",
  },
];

const pool: Omit<Ev, "id" | "at">[] = [
  {
    kind: "analyzing",
    label: "Twilio /Messages · error-rate check",
    detail: "3.1% vs 0.4% baseline · +3.2σ",
  },
  {
    kind: "drift",
    label: "Search Service · p95 latency drift",
    detail: "631ms vs 142ms baseline",
  },
  {
    kind: "stable",
    label: "Shopify Admin · contract diff",
    detail: "1 additive change · non-breaking",
  },
  {
    kind: "analyzing",
    label: "Snowflake connector · schema check",
    detail: "1 column added · consumer-safe",
  },
  {
    kind: "breaking",
    label: "Auth0 /oauth/token · payload shape",
    detail: "scope field now array",
  },
];

const toneRail: Record<Ev["kind"], string> = {
  breaking: "bg-breaking",
  drift: "bg-drift",
  analyzing: "bg-analyzing",
  stable: "bg-signal",
};

const toneText: Record<Ev["kind"], string> = {
  breaking: "text-breaking",
  drift: "text-drift",
  analyzing: "text-analyzing",
  stable: "text-signal",
};

function nowClock() {
  const d = new Date();
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(
    d.getUTCMinutes(),
  ).padStart(2, "0")}:${String(d.getUTCSeconds()).padStart(2, "0")}`;
}

export function LiveTimeline() {
  const [events, setEvents] = useState<Ev[]>(seed);

  useEffect(() => {
    const t = setInterval(() => {
      const p = pool[Math.floor(Math.random() * pool.length)];
      setEvents((prev) =>
        [
          { ...p, id: `e${Date.now()}`, at: nowClock() },
          ...prev,
        ].slice(0, 8),
      );
    }, 4200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="rounded-xl border border-hairline bg-surface/60 elevate">
      <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
        <div className="flex items-center gap-2">
          <Radio className="h-3.5 w-3.5 text-signal live-dot" />
          <span className="text-sm font-medium">Reliability timeline</span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            live
          </span>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          UTC · production
        </span>
      </div>
      <div className="max-h-[420px] overflow-hidden">
        <AnimatePresence initial={false}>
          {events.map((ev, i) => (
            <motion.div
              key={ev.id}
              layout
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "relative grid grid-cols-[auto_5rem_1fr] items-start gap-3 border-b border-hairline/60 px-4 py-2.5 last:border-0",
                i === 0 && "bg-signal/[0.03]",
              )}
            >
              <span
                className={cn(
                  "mt-1.5 h-2 w-2 rounded-full",
                  toneRail[ev.kind],
                  i === 0 && "live-dot",
                )}
              />
              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                {ev.at}
              </span>
              <div className="min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="truncate text-sm font-medium">
                    {ev.label}
                  </span>
                  <span
                    className={cn(
                      "font-mono text-[10px] uppercase tracking-wider",
                      toneText[ev.kind],
                    )}
                  >
                    {ev.kind}
                  </span>
                </div>
                <div className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                  {ev.detail}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
