import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { Eyebrow } from "./eyebrow";

const steps = [
  {
    tag: "01 · Change",
    title: "An API contract changes",
    body: "Stripe deprecates a field on POST /charges. No email. No warning. Just a diff.",
  },
  {
    tag: "02 · Analyze",
    title: "Invariant reads the diff semantically",
    body: "Not string comparison — schema, types, cardinality, required-ness. In 40ms.",
  },
  {
    tag: "03 · Blast radius",
    title: "The dependency graph lights up",
    body: "3 services, 12 endpoints, 4 background jobs downstream of one field.",
  },
  {
    tag: "04 · Investigate",
    title: "Copilot pairs with the on-call",
    body: "Root cause, confidence score, previous incidents, recommended patch — cited.",
  },
  {
    tag: "05 · Confidence",
    title: "The graph goes green",
    body: "Fix merged. Baselines updated. Postmortem drafted. Zero pages.",
  },
];

const stripes = [
  ["#ef4444", "#ef4444", "#ef4444", "#ef4444", "#ef4444"],
  ["#ef4444", "#f59e0b", "#f59e0b", "#f59e0b", "#ef4444"],
  ["#f59e0b", "#f59e0b", "#a855f7", "#f59e0b", "#f59e0b"],
  ["#a855f7", "#a855f7", "#a855f7", "#a855f7", "#f59e0b"],
  ["#22c55e", "#22c55e", "#22c55e", "#22c55e", "#22c55e"],
];

export function ChangeToConfidence() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const activeRaw = useTransform(scrollYProgress, [0.15, 0.85], [0, 4]);

  return (
    <section
      ref={ref}
      className="relative border-y border-hairline py-24 sm:py-32"
    >
      <div className="pointer-events-none absolute inset-0 grid-backdrop opacity-20" />

      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <Eyebrow>From change to confidence</Eyebrow>
          <h2 className="mx-auto mt-5 max-w-3xl text-balance text-4xl font-bold tracking-[-0.02em] sm:text-5xl">
            The five seconds that used to be
            <br />
            <span className="text-muted-foreground">a five-hour incident.</span>
          </h2>
        </div>

        <div className="mt-16 grid gap-10 lg:grid-cols-[1fr_1fr]">
          {/* left: step cards */}
          <ol className="space-y-3">
            {steps.map((s, i) => (
              <StepCard key={s.tag} step={s} index={i} progress={activeRaw} />
            ))}
          </ol>

          {/* right: sticky visual */}
          <div className="lg:sticky lg:top-24 lg:h-fit">
            <div className="relative overflow-hidden rounded-2xl border border-hairline bg-surface/60 p-6 elevate">
              <div className="mb-4 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                <span>reliability graph</span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-signal live-dot" />
                  live
                </span>
              </div>

              {/* diff line */}
              <div className="rounded-lg border border-hairline bg-background/40 p-4 font-mono text-xs">
                <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                  <span>POST /v1/charges</span>
                  <span className="ml-auto">stripe.com</span>
                </div>
                <div className="text-breaking/90">
                  - amount: integer
                </div>
                <div className="text-signal/90">
                  + amount: string
                </div>
                <div className="mt-1 text-muted-foreground/70">
                  - outcome.seller_message
                </div>
              </div>

              {/* graph grid — dots colored by step */}
              <div className="mt-6 grid grid-cols-5 gap-3">
                {Array.from({ length: 25 }).map((_, i) => (
                  <StepDot
                    key={i}
                    row={Math.floor(i / 5)}
                    col={i % 5}
                    progress={activeRaw}
                  />
                ))}
              </div>

              {/* copilot line */}
              <div className="mt-6 rounded-lg border border-hairline bg-background/40 p-3">
                <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-analyzing">
                  copilot · 94% confidence
                </div>
                <div className="text-sm text-foreground/85">
                  Root cause: `amount` type mismatch in{" "}
                  <span className="font-mono">payments-service:parseCharge()</span>.
                  Patch drafted.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StepCard({
  step,
  index,
  progress,
}: {
  step: (typeof steps)[number];
  index: number;
  progress: ReturnType<typeof useTransform<number, number>>;
}) {
  const opacity = useTransform(progress, (p) =>
    Math.max(0.35, 1 - Math.abs(p - index) * 0.4),
  );
  const scale = useTransform(progress, (p) =>
    1 - Math.min(Math.abs(p - index) * 0.02, 0.03),
  );
  return (
    <motion.li
      style={{ opacity, scale }}
      className="rounded-xl border border-hairline bg-surface/40 p-5"
    >
      <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        {step.tag}
      </div>
      <div className="mt-2 text-xl font-semibold tracking-tight">
        {step.title}
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
        {step.body}
      </p>
    </motion.li>
  );
}

function StepDot({
  row,
  col,
  progress,
}: {
  row: number;
  col: number;
  progress: ReturnType<typeof useTransform<number, number>>;
}) {
  const color = useTransform(progress, (p) => {
    const idx = Math.max(0, Math.min(4, Math.round(p)));
    return stripes[idx][col] ?? "#22c55e";
    void row;
  });
  const glow = useTransform(progress, (p) => {
    const idx = Math.max(0, Math.min(4, Math.round(p)));
    const c = stripes[idx][col];
    return `0 0 12px ${c}66`;
  });
  return (
    <motion.div
      className="h-8 rounded-md border border-hairline"
      style={{ backgroundColor: color, boxShadow: glow }}
    />
  );
}
