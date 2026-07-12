import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Radio, Boxes, GitCompareArrows, Sparkles } from "lucide-react";
import { Eyebrow } from "./eyebrow";
import { EASE } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    icon: Radio,
    label: "Collector",
    title: "Capture every call",
    body: "A lightweight SDK or proxy streams request/response samples and registered specs into the pipeline.",
    code: "collector → sampling → queue",
  },
  {
    icon: GitCompareArrows,
    label: "Analyzer",
    title: "Diff the contract",
    body: "Specs and live traffic are compared semantically against the last known-good baseline.",
    code: "openapi + runtime → unified graph",
  },
  {
    icon: Boxes,
    label: "Blast radius",
    title: "Map the impact",
    body: "The reliability graph resolves exactly which services and endpoints a change affects.",
    code: "graph.trace(change) → 3 svc · 12 ep",
  },
  {
    icon: Sparkles,
    label: "Copilot",
    title: "Investigate & resolve",
    body: "The AI copilot correlates signals into an incident, cites root cause, and drafts a patch.",
    code: "claude-sonnet + rag → incident",
  },
];

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        lineRef.current,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: ref.current,
            start: "top 60%",
            end: "bottom 70%",
            scrub: 0.6,
          },
        },
      );
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section id="how" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-4xl px-6">
        <div className="text-center">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="mx-auto mt-5 max-w-xl text-balance text-4xl font-bold tracking-[-0.02em] sm:text-5xl">
            From raw traffic to a resolved incident.
          </h2>
        </div>

        <div ref={ref} className="relative mt-16 pl-8 sm:pl-0">
          {/* rail */}
          <div className="absolute left-8 top-2 bottom-2 w-px bg-hairline sm:left-1/2">
            <div
              ref={lineRef}
              className="absolute inset-0 origin-top bg-gradient-to-b from-signal via-signal/60 to-transparent"
            />
          </div>

          <div className="space-y-10">
            {steps.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, ease: EASE }}
                className={`relative sm:grid sm:grid-cols-2 sm:gap-10 ${
                  i % 2 ? "sm:[&>*:first-child]:col-start-2" : ""
                }`}
              >
                <div
                  className={`relative rounded-2xl border border-hairline bg-surface/60 p-5 ${
                    i % 2 ? "sm:text-right" : ""
                  }`}
                >
                  <div
                    className={`flex items-center gap-2.5 ${i % 2 ? "sm:flex-row-reverse" : ""}`}
                  >
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-signal/10 ring-1 ring-inset ring-signal/25">
                      <s.icon className="h-4 w-4 text-signal" />
                    </div>
                    <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      {String(i + 1).padStart(2, "0")} · {s.label}
                    </span>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {s.body}
                  </p>
                  <code
                    className={`mt-3 inline-block rounded-md bg-background/60 px-2.5 py-1 font-mono text-[11px] text-signal/90 ring-1 ring-inset ring-hairline`}
                  >
                    {s.code}
                  </code>
                </div>

                {/* node dot */}
                <span className="absolute left-[-1.72rem] top-6 h-3 w-3 rounded-full border-2 border-background bg-signal sm:left-1/2 sm:-translate-x-1/2" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
