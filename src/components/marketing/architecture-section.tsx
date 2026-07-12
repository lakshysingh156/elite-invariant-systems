import { motion } from "motion/react";
import { Check } from "lucide-react";
import { Eyebrow } from "./eyebrow";
import { inViewProps, EASE } from "@/lib/motion";

const yaml: { key: string; value: string }[] = [
  { key: "ingestion", value: "collector → queue → analyzer" },
  { key: "diff", value: "openapi + runtime unified graph" },
  { key: "genome", value: "stability score per api" },
  { key: "copilot", value: "claude-sonnet + rag" },
  { key: "storage", value: "postgres · pgvector · redis" },
  { key: "outputs", value: "github pr · slack · webhook" },
];

const points = [
  "OpenAPI + runtime unified graph",
  "Semantic diff, not string diff",
  "Vector memory of past incidents",
  "GitHub-native workflow",
  "Self-hosted first, SSO ready",
];

export function ArchitectureSection() {
  return (
    <section id="architecture" className="relative py-24 sm:py-32">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-2">
        <motion.div {...inViewProps} transition={{ duration: 0.6, ease: EASE }}>
          <Eyebrow>Architecture</Eyebrow>
          <h2 className="mt-5 text-balance text-4xl font-bold tracking-[-0.02em] sm:text-5xl">
            Built like production infra should be.
          </h2>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">
            A high-throughput ingestion pipeline captures every API call, feeds
            it through a contract &amp; behaviour analyzer, then hands the delta
            to an LLM-powered incident copilot backed by a vector memory of your
            history.
          </p>
          <ul className="mt-7 space-y-3">
            {points.map((p, i) => (
              <motion.li
                key={p}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
                className="flex items-center gap-3 text-sm text-foreground/90"
              >
                <span className="grid h-5 w-5 place-items-center rounded-full bg-stable/15 ring-1 ring-inset ring-stable/30">
                  <Check className="h-3 w-3 text-stable" strokeWidth={3} />
                </span>
                {p}
              </motion.li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          {...inViewProps}
          transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
          className="overflow-hidden rounded-2xl border border-hairline bg-[#0b0c0e] shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)]"
        >
          <div className="flex items-center gap-2 border-b border-hairline px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-breaking/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-drift/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-stable/70" />
            <span className="ml-2 font-mono text-xs text-muted-foreground">
              architecture.yml
            </span>
          </div>
          <div className="p-5 font-mono text-[13px] leading-7">
            <div className="text-muted-foreground/60"># invariant control plane</div>
            {yaml.map((row, i) => (
              <motion.div
                key={row.key}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + i * 0.08 }}
                className="flex gap-3"
              >
                <span className="w-24 shrink-0 text-analyzing">{row.key}:</span>
                <span className="text-foreground/80">{row.value}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
