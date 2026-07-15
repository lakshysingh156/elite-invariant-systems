import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { ForceGraph } from "@/components/graph/force-graph";
import { graphNodes, graphEdges, blastRadiusFrom } from "@/data/graph";

export function MiniGraph() {
  return (
    <div className="overflow-hidden rounded-xl border border-hairline bg-surface/60 elevate">
      <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
        <div>
          <div className="text-sm font-medium">Dependency health</div>
          <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            live · blast radius from Stripe
          </div>
        </div>
        <Link
          to="/graph"
          className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground hover:text-foreground"
        >
          Open <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="relative h-[260px] bg-[#0b0c0e]">
        <div className="absolute inset-0 grid-backdrop opacity-25" />
        <ForceGraph
          nodes={graphNodes}
          edges={graphEdges}
          highlight={blastRadiusFrom.stripe}
          className="h-full w-full"
        />
      </div>
    </div>
  );
}
