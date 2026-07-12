import { motion } from "motion/react";
import { Eyebrow } from "./eyebrow";
import { EASE } from "@/lib/motion";

const without = [
  { t: "03:42", text: "Stripe changes /v1/charges response format" },
  { t: "03:42", text: "Payment service starts returning errors" },
  { t: "03:52", text: "Engineer wakes up, starts debugging" },
  { t: "04:47", text: "Hotfix deployed after 65 minutes" },
];
const withInv = [
  { t: "03:42", text: "Invariant detects the Stripe contract change" },
  { t: "03:42", text: "Impact analysis: 3 services, 12 endpoints" },
  { t: "03:43", text: "Root cause + patch PR drafted by Copilot" },
  { t: "03:45", text: "Patch reviewed & merged — zero downtime" },
];

function Panel({
  label,
  rows,
  tone,
  total,
  totalTone,
  delay,
}: {
  label: string;
  rows: { t: string; text: string }[];
  tone: string;
  total: string;
  totalTone: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: EASE }}
      className="relative overflow-hidden rounded-2xl border border-hairline bg-surface/60 p-6 backdrop-blur-sm"
    >
      <div className="mb-5 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground/70">
        {label}
      </div>
      <ul className="space-y-3.5">
        {rows.map((r, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: delay + 0.15 + i * 0.09, duration: 0.4 }}
            className="flex items-start gap-3 font-mono text-[13px]"
          >
            <span className="shrink-0 text-muted-foreground/60 tabular-nums">
              {r.t}
            </span>
            <span className={tone}>{r.text}</span>
          </motion.li>
        ))}
      </ul>
      <div className="mt-6 flex items-center justify-between border-t border-hairline pt-4">
        <span className="text-sm text-muted-foreground">Total damage</span>
        <span className={`font-mono text-sm font-semibold ${totalTone}`}>
          {total}
        </span>
      </div>
    </motion.div>
  );
}

export function ChaosSection() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center">
          <Eyebrow>Built for peace of mind</Eyebrow>
          <h2 className="mx-auto mt-5 max-w-2xl text-balance text-4xl font-bold tracking-[-0.02em] sm:text-5xl">
            One API change.
            <br />
            <span className="text-muted-foreground">65 minutes of chaos.</span>
          </h2>
        </div>
        <div className="mt-14 grid gap-5 md:grid-cols-2">
          <Panel
            label="Without Invariant"
            rows={without}
            tone="text-breaking/90"
            total="65 min outage"
            totalTone="text-breaking"
            delay={0}
          />
          <Panel
            label="With Invariant"
            rows={withInv}
            tone="text-stable/90"
            total="$0 · 0 min"
            totalTone="text-stable"
            delay={0.12}
          />
        </div>
      </div>
    </section>
  );
}
