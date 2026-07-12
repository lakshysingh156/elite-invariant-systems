import { motion } from "motion/react";
import {
  GitCompareArrows,
  Activity,
  Dna,
  Sparkles,
  GitPullRequest,
  Brain,
} from "lucide-react";
import { Eyebrow } from "./eyebrow";
import { EASE } from "@/lib/motion";
import { SeverityPill } from "@/components/ui-kit/status-badge";

const features = [
  {
    icon: GitCompareArrows,
    title: "OpenAPI Diff Engine",
    body: "Compare specs semantically, not as strings. Every parameter, response, and auth change is classified by severity.",
    visual: "diff",
  },
  {
    icon: Activity,
    title: "Runtime Drift Detection",
    body: "Latency, error and behaviour drift caught the moment production diverges from a 7-day rolling baseline.",
    visual: "wave",
  },
  {
    icon: Dna,
    title: "API Genome",
    body: "A living stability profile per API — schema, latency and error resilience distilled into one score.",
    visual: "genome",
  },
  {
    icon: Sparkles,
    title: "AI Incident Copilot",
    body: "Ask in plain English. Get root cause, blast radius and a proposed fix in seconds — every answer cited.",
    visual: "chat",
  },
  {
    icon: GitPullRequest,
    title: "GitHub PR Bot",
    body: "Every pull request gets an automatic contract review. Ship without fear of breaking downstream.",
    visual: "pr",
  },
  {
    icon: Brain,
    title: "Knowledge Memory",
    body: "Every incident, every fix, every regression — remembered as vectors, ready to prevent the next one.",
    visual: "memory",
  },
];

function MiniVisual({ kind }: { kind: string }) {
  if (kind === "diff")
    return (
      <div className="space-y-1 font-mono text-[10px]">
        <div className="flex items-center gap-2 text-breaking">
          <span>-</span>
          <span className="truncate">seller_message: string</span>
          <SeverityPill severity="breaking" className="ml-auto scale-90" />
        </div>
        <div className="flex items-center gap-2 text-stable">
          <span>+</span>
          <span className="truncate">risk_score: number</span>
          <SeverityPill severity="safe" className="ml-auto scale-90" />
        </div>
      </div>
    );
  if (kind === "wave")
    return (
      <svg viewBox="0 0 120 32" className="h-8 w-full">
        <polyline
          points="0,20 15,19 30,21 45,18 60,20 70,10 80,4 95,6 110,3 120,4"
          fill="none"
          stroke="var(--drift)"
          strokeWidth="1.5"
        />
        <line
          x1="0"
          y1="14"
          x2="120"
          y2="14"
          stroke="var(--hairline)"
          strokeDasharray="2 3"
        />
      </svg>
    );
  if (kind === "genome")
    return (
      <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-hairline">
          <div className="h-full w-[62%] rounded-full bg-drift" />
        </div>
        <span className="text-drift">62</span>
      </div>
    );
  if (kind === "chat")
    return (
      <div className="space-y-1.5">
        <div className="ml-auto w-fit rounded-md rounded-br-sm bg-secondary px-2 py-1 text-[10px]">
          why did capture fail?
        </div>
        <div className="w-fit rounded-md rounded-bl-sm bg-signal/10 px-2 py-1 text-[10px] text-signal ring-1 ring-inset ring-signal/20">
          Stripe removed a required field →
        </div>
      </div>
    );
  if (kind === "pr")
    return (
      <div className="flex items-center gap-2 font-mono text-[10px]">
        <GitPullRequest className="h-3.5 w-3.5 text-analyzing" />
        <span className="text-muted-foreground">#482 contract review</span>
        <span className="ml-auto rounded bg-breaking/15 px-1.5 py-0.5 text-breaking">
          risk 8.4
        </span>
      </div>
    );
  return (
    <div className="flex gap-1">
      {[...Array(9)].map((_, i) => (
        <span
          key={i}
          className="h-4 w-1 rounded-full"
          style={{
            background: "var(--analyzing)",
            opacity: 0.25 + (i % 3) * 0.25,
          }}
        />
      ))}
    </div>
  );
}

export function FeatureGrid() {
  return (
    <section id="features" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-2xl">
          <Eyebrow>Product</Eyebrow>
          <h2 className="mt-5 text-balance text-4xl font-bold tracking-[-0.02em] sm:text-5xl">
            Every layer of your API surface.
            <br />
            <span className="text-muted-foreground">Continuously watched.</span>
          </h2>
        </div>

        <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.06, ease: EASE }}
              className="group relative bg-surface p-6 transition-colors hover:bg-surface-raised"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary ring-1 ring-inset ring-hairline transition-colors group-hover:bg-signal/10 group-hover:ring-signal/30">
                <f.icon className="h-4.5 w-4.5 text-foreground transition-colors group-hover:text-signal" />
              </div>
              <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {f.body}
              </p>
              <div className="mt-5 rounded-lg border border-hairline bg-background/40 p-3">
                <MiniVisual kind={f.visual} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
