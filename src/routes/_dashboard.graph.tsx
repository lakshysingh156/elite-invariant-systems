import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Zap, X, Crosshair } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-shell";
import { StatusBadge } from "@/components/ui-kit/status-badge";
import { GenomeRing } from "@/components/ui-kit/metrics";
import { ForceGraph } from "@/components/graph/force-graph";
import { graphNodes, graphEdges, blastRadiusFrom } from "@/data/graph";
import type { GraphNode } from "@/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_dashboard/graph")({
  head: () => ({ meta: [{ title: "Reliability Graph — Invariant." }] }),
  component: GraphPage,
});

const traceSources = [
  { id: "stripe", label: "Stripe /charges", tone: "breaking" as const },
  { id: "twilio", label: "Twilio /Messages", tone: "drift" as const },
  { id: "search-svc", label: "search-service", tone: "drift" as const },
];

function GraphPage() {
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [trace, setTrace] = useState<string | null>("stripe");
  const highlight = trace ? blastRadiusFrom[trace] : undefined;

  return (
    <>
      <PageHeader
        title="Reliability Graph"
        description="Dependency surface across services, APIs and external vendors."
      />
      <div className="relative flex h-[calc(100vh-8.5rem)]">
        {/* canvas */}
        <div className="relative flex-1 overflow-hidden bg-[#0b0c0e]">
          <div className="absolute inset-0 grid-backdrop opacity-25" />

          {/* trace controls */}
          <div className="absolute left-4 top-4 z-10 flex flex-col gap-2">
            <div className="rounded-lg border border-hairline bg-background/80 p-2 backdrop-blur">
              <div className="mb-1.5 flex items-center gap-1.5 px-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <Crosshair className="h-3 w-3" /> Trace blast radius
              </div>
              <div className="flex flex-col gap-1">
                {traceSources.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTrace((cur) => (cur === t.id ? null : t.id))}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2 py-1.5 text-left font-mono text-xs transition-colors",
                      trace === t.id
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:bg-secondary/60",
                    )}
                  >
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        t.tone === "breaking" ? "bg-breaking" : "bg-drift",
                      )}
                    />
                    {t.label}
                    {trace === t.id && <Zap className="ml-auto h-3 w-3 text-signal" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="absolute bottom-4 left-4 z-10 flex gap-4 rounded-lg border border-hairline bg-background/70 px-3 py-2 font-mono text-[11px] text-muted-foreground backdrop-blur">
            {[
              ["breaking", "bg-breaking"],
              ["drifting", "bg-drift"],
              ["stable", "bg-stable"],
              ["analyzing", "bg-analyzing"],
            ].map(([l, c]) => (
              <span key={l} className="inline-flex items-center gap-1.5">
                <span className={cn("h-2 w-2 rounded-full", c)} /> {l}
              </span>
            ))}
          </div>

          <ForceGraph
            nodes={graphNodes}
            edges={graphEdges}
            highlight={highlight}
            selectedId={selected?.id}
            onSelect={setSelected}
            className="h-full w-full"
          />
        </div>

        {/* detail sidebar */}
        <AnimatePresence>
          {selected && (
            <motion.aside
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 40, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="w-80 shrink-0 border-l border-hairline bg-surface/60 p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    {selected.type}
                  </div>
                  <h3 className="mt-1 font-mono text-lg font-semibold">
                    {selected.label}
                  </h3>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-secondary"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-5 flex items-center gap-4 rounded-lg border border-hairline bg-background/40 p-4">
                <GenomeRing score={selected.health} size={52} stroke={4} />
                <div>
                  <StatusBadge status={selected.status} pulse={selected.status !== "stable"} />
                  <div className="mt-2 font-mono text-xs text-muted-foreground">
                    health score
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  Direct connections
                </div>
                {graphEdges
                  .filter(
                    (e) => e.source === selected.id || e.target === selected.id,
                  )
                  .map((e, i) => {
                    const other = e.source === selected.id ? e.target : e.source;
                    const node = graphNodes.find((n) => n.id === other);
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-2 rounded-md bg-background/40 px-2.5 py-2 font-mono text-xs"
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            node?.status === "breaking"
                              ? "bg-breaking"
                              : node?.status === "drifting"
                                ? "bg-drift"
                                : node?.status === "analyzing"
                                  ? "bg-analyzing"
                                  : "bg-stable",
                          )}
                        />
                        {node?.label}
                        <span className="ml-auto text-muted-foreground">
                          ×{e.weight}
                        </span>
                      </div>
                    );
                  })}
              </div>

              <button
                onClick={() =>
                  setTrace(blastRadiusFrom[selected.id] ? selected.id : "stripe")
                }
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-signal px-3 py-2 text-sm font-medium text-signal-foreground transition-transform hover:scale-[1.02]"
              >
                <Zap className="h-4 w-4" /> Show blast radius
              </button>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
