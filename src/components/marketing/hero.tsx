import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowRight, BookText } from "lucide-react";
import { Eyebrow } from "./eyebrow";
import { TopologyField } from "./topology-field";
import { StatusBadge } from "@/components/ui-kit/status-badge";
import { fadeUp as fade } from "@/lib/motion";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-36 pb-28 sm:pt-44 sm:pb-36">
      {/* live topology backdrop */}
      <div className="pointer-events-none absolute inset-0">
        <TopologyField className="h-full w-full opacity-90" />
        <div className="absolute inset-0 grid-backdrop opacity-30" />
        {/* signal eclipse glow behind headline */}
        <div
          className="absolute left-1/2 top-[38%] h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklab, var(--signal) 14%, transparent), transparent 62%)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/20 to-background" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-background to-transparent" />
      </div>

      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <motion.div variants={fade} custom={0} initial="hidden" animate="show">
          <Eyebrow>V1.0 — AI Reliability Engineer</Eyebrow>
        </motion.div>

        <motion.h1
          variants={fade}
          custom={1}
          initial="hidden"
          animate="show"
          className="mt-6 text-balance text-5xl font-bold leading-[0.98] tracking-[-0.035em] text-foreground sm:text-6xl md:text-7xl"
        >
          Your APIs evolve.
          <br />
          <span className="text-foreground-dim">Invariant makes sure</span>
          <br />
          they don&apos;t break.
        </motion.h1>

        <motion.p
          variants={fade}
          custom={2}
          initial="hidden"
          animate="show"
          className="mx-auto mt-7 max-w-xl text-balance text-base leading-relaxed text-muted-foreground sm:text-lg"
        >
          The reliability engineer for every API your team depends on. Detect
          contract &amp; runtime drift, map the exact blast radius, and
          investigate with an AI copilot — before production does.
        </motion.p>

        <motion.div
          variants={fade}
          custom={3}
          initial="hidden"
          animate="show"
          className="mt-9 flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            to="/signup"
            className="group inline-flex items-center gap-2 rounded-full bg-signal px-5 py-2.5 text-sm font-semibold text-signal-foreground transition-transform hover:scale-[1.03] active:scale-95 signal-glow"
          >
            Get started
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-full border border-hairline bg-surface/60 px-5 py-2.5 text-sm font-medium text-foreground backdrop-blur transition-colors hover:bg-surface"
          >
            <BookText className="h-4 w-4" />
            Live demo
          </Link>
        </motion.div>

        <motion.div
          variants={fade}
          custom={4}
          initial="hidden"
          animate="show"
          className="mt-14 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 font-mono text-xs text-muted-foreground"
        >
          <span className="inline-flex items-center gap-2">
            <StatusBadge status="stable" label="8 APIs stable" pulse />
          </span>
          <span className="hidden h-3 w-px bg-hairline sm:block" />
          <span>semantic diff, not string diff</span>
          <span className="hidden h-3 w-px bg-hairline sm:block" />
          <span>self-hosted first</span>
        </motion.div>
      </div>
    </section>
  );
}
