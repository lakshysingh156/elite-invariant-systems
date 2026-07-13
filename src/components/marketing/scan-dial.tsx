import { useMemo } from "react";
import { motion } from "motion/react";
import { Eyebrow } from "./eyebrow";
import { inViewProps, EASE } from "@/lib/motion";

const TICKS = 64;

function Dial() {
  const ticks = useMemo(
    () =>
      Array.from({ length: TICKS }, (_, i) => {
        const angle = (i / TICKS) * 360;
        // deterministic "long" ticks every few marks for rhythm
        const long = i % 8 === 0;
        const mid = i % 4 === 0;
        return { angle, long, mid, i };
      }),
    [],
  );

  return (
    <div className="relative aspect-square w-full max-w-[440px]">
      {/* technical corner brackets */}
      {[
        "left-0 top-0 border-l border-t",
        "right-0 top-0 border-r border-t",
        "left-0 bottom-0 border-l border-b",
        "right-0 bottom-0 border-r border-b",
      ].map((c) => (
        <span
          key={c}
          className={`pointer-events-none absolute h-6 w-6 border-hairline ${c}`}
        />
      ))}

      {/* rotating segmented ring */}
      <div className="absolute inset-0 spin-slow">
        <svg viewBox="0 0 400 400" className="h-full w-full">
          {ticks.map(({ angle, long, mid, i }) => {
            const r1 = long ? 150 : mid ? 158 : 162;
            const r2 = 176;
            const rad = (angle * Math.PI) / 180;
            const x1 = 200 + r1 * Math.cos(rad);
            const y1 = 200 + r1 * Math.sin(rad);
            const x2 = 200 + r2 * Math.cos(rad);
            const y2 = 200 + r2 * Math.sin(rad);
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={
                  long
                    ? "color-mix(in oklab, var(--foreground) 60%, transparent)"
                    : "color-mix(in oklab, var(--foreground) 22%, transparent)"
                }
                strokeWidth={long ? 2 : 1}
                strokeLinecap="round"
              />
            );
          })}
        </svg>
      </div>

      {/* counter-rotating inner dashed ring */}
      <div
        className="absolute inset-[64px] spin-slow"
        style={{ animationDirection: "reverse", animationDuration: "60s" }}
      >
        <svg viewBox="0 0 272 272" className="h-full w-full">
          <circle
            cx="136"
            cy="136"
            r="120"
            fill="none"
            stroke="var(--hairline)"
            strokeWidth="1"
            strokeDasharray="1 10"
          />
        </svg>
      </div>

      {/* sweeping radar beam — a trailing arc confined to the ring band */}
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 5.5, ease: "linear", repeat: Infinity }}
        style={{
          background:
            "conic-gradient(from 0deg, transparent 0deg, transparent 288deg, color-mix(in oklab, var(--signal) 22%, transparent) 344deg, color-mix(in oklab, var(--signal) 60%, transparent) 360deg)",
          WebkitMaskImage:
            "radial-gradient(circle, transparent 30%, #000 34%, #000 92%, transparent 95%)",
          maskImage:
            "radial-gradient(circle, transparent 30%, #000 34%, #000 92%, transparent 95%)",
        }}
      />


      {/* live core */}
      <div className="absolute inset-0 grid place-items-center">
        <div className="relative grid h-28 w-28 place-items-center rounded-full border border-hairline bg-background/70 backdrop-blur">
          <span
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "radial-gradient(circle, color-mix(in oklab, var(--signal) 22%, transparent), transparent 70%)",
            }}
          />
          <span className="absolute h-14 w-14 rounded-full border border-signal/30 live-dot" />
          <span className="relative h-2.5 w-2.5 rounded-full bg-signal signal-glow" />
          <span className="absolute bottom-5 font-mono text-[9px] uppercase tracking-[0.2em] text-signal">
            live
          </span>
        </div>
      </div>
    </div>
  );
}

export function ScanDial() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      <div className="pointer-events-none absolute inset-0 grid-backdrop opacity-[0.06]" />
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.div {...inViewProps} transition={{ duration: 0.6, ease: EASE }}>
            <Eyebrow>Always watching</Eyebrow>
            <h2 className="mt-5 text-balance text-5xl font-bold leading-[0.95] tracking-[-0.03em] sm:text-6xl">
              Continuous by
              <br />
              <span className="text-foreground-dim">design.</span>
            </h2>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-muted-foreground">
              Invariant never stops scanning. Every request, every spec, every
              deploy is swept against the last known-good baseline — so drift is
              caught the moment it appears, not the moment it pages you.
            </p>

            <div className="mt-8 flex flex-wrap gap-2.5 font-mono text-[11px] uppercase tracking-[0.14em]">
              {[
                "continuous diff",
                "runtime drift",
                "blast radius",
                "24/7 baseline",
              ].map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-hairline bg-surface/60 px-3 py-1.5 text-muted-foreground"
                >
                  {t}
                </span>
              ))}
            </div>

            <div className="mt-8 flex items-center gap-6 font-mono text-xs text-muted-foreground">
              <div>
                <div className="text-2xl font-semibold text-foreground">
                  1.2M
                </div>
                <div className="mt-0.5">calls / day swept</div>
              </div>
              <span className="h-8 w-px bg-hairline" />
              <div>
                <div className="text-2xl font-semibold text-foreground">
                  &lt;30s
                </div>
                <div className="mt-0.5">drift → alert</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            {...inViewProps}
            transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
            className="grid place-items-center"
          >
            <Dial />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
