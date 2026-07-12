import { motion } from "motion/react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Eyebrow } from "./eyebrow";
import { ForceGraph } from "@/components/graph/force-graph";
import { graphNodes, graphEdges, blastRadiusFrom } from "@/data/graph";
import { inViewProps, EASE } from "@/lib/motion";

export function GraphTeaser() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <motion.div {...inViewProps} transition={{ duration: 0.6, ease: EASE }}>
            <Eyebrow>Reliability Graph</Eyebrow>
            <h2 className="mt-5 text-balance text-4xl font-bold tracking-[-0.02em] sm:text-5xl">
              See exactly what breaks
              <br />
              <span className="text-muted-foreground">before it does.</span>
            </h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">
              Invariant models the dependency graph between every API, endpoint
              and the code that consumes it. When a contract changes, the blast
              radius lights up instantly — no more guessing which service
              breaks.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4 font-mono text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-breaking" /> breaking
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-drift" /> drifting
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-stable" /> stable
              </span>
            </div>
            <Link
              to="/graph"
              className="group mt-7 inline-flex items-center gap-2 rounded-full border border-hairline bg-surface/60 px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface"
            >
              Explore the graph
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </motion.div>

          <motion.div
            {...inViewProps}
            transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
            className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-hairline bg-[#0b0c0e]"
          >
            <div className="absolute inset-0 grid-backdrop opacity-30" />
            <div className="absolute left-4 top-4 z-10 rounded-lg border border-hairline bg-background/70 px-3 py-1.5 font-mono text-[11px] text-signal backdrop-blur">
              blast radius · Stripe /charges
            </div>
            <ForceGraph
              nodes={graphNodes}
              edges={graphEdges}
              highlight={blastRadiusFrom.stripe}
              interactive={false}
              className="h-full w-full"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
