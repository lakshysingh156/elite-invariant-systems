import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "motion/react";
import { Zap, X, Crosshair, Loader2, Boxes } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-shell";
import { StatusBadge } from "@/components/ui-kit/status-badge";
import { GenomeRing } from "@/components/ui-kit/metrics";
import { ForceGraph } from "@/components/graph/force-graph";
import { getReliabilityGraph } from "@/lib/graph.functions";
import type { GraphNode } from "@/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_dashboard/graph")({
  head: () => ({ meta: [{ title: "Reliability Graph — Invariant." }] }),
  component: GraphPage,
});

function GraphPage() {
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [trace, setTrace] = useState<string | null>(null);
  const graphFn = useServerFn(getReliabilityGraph);

  const { data, isLoading } = useQuery({
    queryKey: ["reliability-graph"],
    queryFn: () => graphFn(),
  });

  const highlight = trace && data?.blast ? data.blast[trace] : undefined;
  const traceSources = data
    ? data.nodes.filter((n: any) => data.blast[n.id]).slice(0, 6)
    : [];

  return (
    <>
      <PageHeader
        title="Reliability Graph"
        description="Dependency surface across services, APIs and external vendors."
      />
      <div className="relative flex h-[calc(100vh-8.5rem)]">
        <div className="relative flex-1 overflow-hidden bg-[#0b0c0e]">
          <div className="absolute inset-0 grid-backdrop opacity-25" />

          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading graph…
            </div>
          )}

          {!isLoading && data && data.nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="max-w-md rounded-xl border border-hairline bg-surface/60 p-6 text-center">
                <Boxes className="mx-auto h-8 w-8 text-muted-foreground" />
                <h3 className="mt-3 text-lg font-semibold">No dependencies yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Register APIs and load demo data from the Overview page to populate this graph.
                </p>
              </div>
            </div>
          )}

          {data && traceSources.length > 0 && (
            <div className="absolute left-4 top-4 z-10 flex flex-col gap-2">
              <div className="rounded-lg border border-hairline bg-background/80 p-2 backdrop-blur">
                <div className="mb-1.5 flex items-center gap-1.5 px-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  <Crosshair className="h-3 w-3" /> Trace blast radius
                </div>
                <div className="flex flex-col gap-1">
                  {traceSources.map((t: any) => (
                    <button
                      key={t.id}
                      onClick={() => setTrace((cur) => (cur === t.id ? null : t.id))}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-2 py-1.5 text-left font-mono text-xs transition-colors",
                        trace === t.id ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60",
                      )}
                    >
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full",
                          t.status === "breaking" ? "bg-breaking" : t.status === "drifting" ? "bg-drift" : "bg-stable",
                        )}
                      />
                      {t.label}
                      {trace === t.id && <Zap className="ml-auto h-3 w-3 text-brand" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

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

          {data && data.nodes.length > 0 && (
            <ForceGraph
              nodes={data.nodes as any}
              edges={data.edges as any}
              highlight={highlight}
              selectedId={selected?.id}
              onSelect={setSelected}
              className="h-full w-full"
            />
          )}
        </div>

        <AnimatePresence>
          {selected && data && (
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
                  <h3 className="mt-1 font-mono text-lg font-semibold">{selected.label}</h3>
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
                  <div className="mt-2 font-mono text-xs text-muted-foreground">health score</div>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  Direct connections
                </div>
                {data.edges
                  .filter((e: any) => e.source === selected.id || e.target === selected.id)
                  .map((e: any, i: number) => {
                    const other = e.source === selected.id ? e.target : e.source;
                    const node = data.nodes.find((n: any) => n.id === other);
                    return (
                      <div key={i} className="flex items-center gap-2 rounded-md bg-background/40 px-2.5 py-2 font-mono text-xs">
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            node?.status === "breaking"
                              ? "bg-breaking"
                              : node?.status === "drifting"
                                ? "bg-drift"
                                : "bg-stable",
                          )}
                        />
                        {node?.label}
                        <span className="ml-auto text-muted-foreground">×{e.weight}</span>
                      </div>
                    );
                  })}
              </div>

              {data.blast[selected.id] && (
                <button
                  onClick={() => setTrace(selected.id)}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-brand-foreground transition-transform hover:scale-[1.02] brand-glow"
                >
                  <Zap className="h-4 w-4" /> Show blast radius
                </button>
              )}
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
