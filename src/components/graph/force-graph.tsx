import { useEffect, useRef, useState, useCallback } from "react";
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  type Simulation,
} from "d3-force";
import type { GraphNode, GraphEdge } from "@/types";

type SimNode = GraphNode & {
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx?: number | null;
  fy?: number | null;
};
type SimLink = { source: SimNode; target: SimNode; weight: number };

const STATUS_COLOR: Record<GraphNode["status"], string> = {
  stable: "rgba(120, 220, 170, 1)",
  drifting: "rgba(235, 195, 120, 1)",
  breaking: "rgba(240, 120, 120, 1)",
  analyzing: "rgba(200, 140, 245, 1)",
};

export function ForceGraph({
  nodes,
  edges,
  highlight,
  onSelect,
  selectedId,
  animateTrace = true,
  interactive = true,
  className,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
  highlight?: string[]; // node ids in blast radius
  onSelect?: (node: GraphNode | null) => void;
  selectedId?: string | null;
  animateTrace?: boolean;
  interactive?: boolean;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const simRef = useRef<Simulation<SimNode, undefined> | null>(null);
  const stateRef = useRef<{
    nodes: SimNode[];
    links: SimLink[];
    hover: string | null;
    drag: SimNode | null;
    t: number;
  }>({ nodes: [], links: [], hover: null, drag: null, t: 0 });
  const [, force] = useState(0);

  const hlSet = highlight ? new Set(highlight) : null;

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const simNodes: SimNode[] = nodes.map((n) => ({
      ...n,
      x: Math.random() * 400,
      y: Math.random() * 300,
      vx: 0,
      vy: 0,
    }));
    const byId = new Map(simNodes.map((n) => [n.id, n]));
    const simLinks: SimLink[] = edges
      .map((e) => ({
        source: byId.get(e.source)!,
        target: byId.get(e.target)!,
        weight: e.weight,
      }))
      .filter((l) => l.source && l.target);
    stateRef.current.nodes = simNodes;
    stateRef.current.links = simLinks;

    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sim.force("center", forceCenter(w / 2, h / 2));
      sim.alpha(0.4).restart();
    };

    const sim = forceSimulation(simNodes)
      .force(
        "link",
        forceLink(simLinks)
          .id((d: any) => d.id)
          .distance((l: any) => 120 + (4 - l.weight) * 22)
          .strength(0.35),
      )
      .force("charge", forceManyBody().strength(-720))
      .force("collide", forceCollide(46))
      .alphaDecay(0.018);
    simRef.current = sim;

    const draw = () => {
      const st = stateRef.current;
      st.t += 1;
      ctx.clearRect(0, 0, w, h);

      // edges
      for (const l of st.links) {
        const active =
          !hlSet || (hlSet.has(l.source.id) && hlSet.has(l.target.id));
        ctx.beginPath();
        ctx.moveTo(l.source.x, l.source.y);
        // slight curve
        const mx = (l.source.x + l.target.x) / 2;
        const my = (l.source.y + l.target.y) / 2 - 12;
        ctx.quadraticCurveTo(mx, my, l.target.x, l.target.y);
        ctx.strokeStyle = active
          ? "rgba(120, 220, 170, 0.35)"
          : "rgba(150, 160, 175, 0.1)";
        ctx.lineWidth = active ? 1.4 : 0.8;
        ctx.stroke();

        // animated trace packet along highlighted edges
        if (active && hlSet && animateTrace && !reduce) {
          const p = ((st.t * 0.01) % 1);
          const px = (1 - p) * (1 - p) * l.source.x + 2 * (1 - p) * p * mx + p * p * l.target.x;
          const py = (1 - p) * (1 - p) * l.source.y + 2 * (1 - p) * p * my + p * p * l.target.y;
          ctx.beginPath();
          ctx.arc(px, py, 2.2, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(150, 240, 190, 0.95)";
          ctx.shadowColor = "rgba(120,220,170,0.9)";
          ctx.shadowBlur = 8;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      // nodes
      for (const n of st.nodes) {
        const dim = hlSet ? !hlSet.has(n.id) : false;
        const color = STATUS_COLOR[n.status];
        const isSel = selectedId === n.id || st.hover === n.id;
        const r = (n.type === "service" ? 9 : n.type === "external" ? 8 : 7) + (isSel ? 2 : 0);

        // pulse ring for non-stable
        if (!dim && n.status !== "stable" && !reduce) {
          const pr = r + 4 + Math.sin(st.t * 0.06 + n.x) * 2;
          ctx.beginPath();
          ctx.arc(n.x, n.y, pr, 0, Math.PI * 2);
          ctx.strokeStyle = color.replace("1)", "0.25)");
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = dim ? "rgba(90,96,108,0.5)" : color;
        if (!dim) {
          ctx.shadowColor = color;
          ctx.shadowBlur = isSel ? 20 : 10;
        }
        ctx.fill();
        ctx.shadowBlur = 0;

        // inner dot
        ctx.beginPath();
        ctx.arc(n.x, n.y, r * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(12,13,15,0.9)";
        ctx.fill();

        // label
        if (!dim && (isSel || n.type === "service" || n.type === "external")) {
          ctx.font =
            "500 10px ui-monospace, 'JetBrains Mono', monospace";
          ctx.fillStyle = isSel
            ? "rgba(245,247,250,0.95)"
            : "rgba(200,205,215,0.7)";
          ctx.textAlign = "center";
          ctx.fillText(n.label, n.x, n.y + r + 12);
        }
      }
    };

    let raf = 0;
    const tick = () => {
      draw();
      raf = requestAnimationFrame(tick);
    };
    sim.on("tick", () => {});
    resize();
    tick();

    // interaction
    const pos = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const pick = (x: number, y: number) =>
      stateRef.current.nodes.find((n) => Math.hypot(n.x - x, n.y - y) < 14) ||
      null;

    const onMove = (e: MouseEvent) => {
      if (!interactive) return;
      const { x, y } = pos(e);
      if (stateRef.current.drag) {
        stateRef.current.drag.fx = x;
        stateRef.current.drag.fy = y;
        sim.alphaTarget(0.2).restart();
        return;
      }
      const hit = pick(x, y);
      stateRef.current.hover = hit?.id ?? null;
      canvas.style.cursor = hit ? "pointer" : "default";
    };
    const onDown = (e: MouseEvent) => {
      if (!interactive) return;
      const { x, y } = pos(e);
      const hit = pick(x, y);
      if (hit) {
        stateRef.current.drag = hit;
        hit.fx = x;
        hit.fy = y;
      }
    };
    const onUp = () => {
      if (stateRef.current.drag) {
        stateRef.current.drag.fx = null;
        stateRef.current.drag.fy = null;
        stateRef.current.drag = null;
        sim.alphaTarget(0);
      }
    };
    const onClick = (e: MouseEvent) => {
      if (!interactive || !onSelect) return;
      const { x, y } = pos(e);
      onSelect(pick(x, y));
    };

    if (interactive) {
      canvas.addEventListener("mousemove", onMove);
      canvas.addEventListener("mousedown", onDown);
      window.addEventListener("mouseup", onUp);
      canvas.addEventListener("click", onClick);
    }
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(raf);
      sim.stop();
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      canvas.removeEventListener("click", onClick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, highlight, selectedId, interactive, animateTrace]);

  const noop = useCallback(() => force((v) => v + 1), []);
  void noop;

  return (
    <div ref={wrapRef} className={className}>
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
