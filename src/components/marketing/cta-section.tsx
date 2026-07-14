import { motion } from "motion/react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { inViewProps, EASE } from "@/lib/motion";

export function CtaSection() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-4xl px-6">
        <motion.div
          {...inViewProps}
          transition={{ duration: 0.6, ease: EASE }}
          className="relative overflow-hidden rounded-3xl border border-hairline bg-surface/60 px-8 py-16 text-center"
        >
          <div className="absolute inset-0 grid-backdrop opacity-30" />
          <div className="absolute -inset-x-20 -top-32 h-64 bg-[radial-gradient(ellipse_at_center,var(--brand),transparent_60%)] opacity-[0.12]" />
          <div className="relative">
            <h2 className="mx-auto max-w-xl text-balance text-4xl font-bold tracking-[-0.02em] sm:text-5xl">
              Stop finding out from production.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground">
              Register your first API in under two minutes. Watch Invariant map
              your reliability surface and catch the next breaking change before
              your users do.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/signup"
                className="group inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-brand-foreground transition-transform hover:scale-[1.03] active:scale-95 brand-glow"
              >
                Get started free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center rounded-full border border-hairline bg-background/40 px-5 py-2.5 text-sm font-medium text-foreground backdrop-blur transition-colors hover:bg-secondary"
              >
                Explore the demo
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
