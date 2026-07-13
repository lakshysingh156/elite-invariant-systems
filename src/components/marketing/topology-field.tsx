import { useEffect, useRef } from "react";

/**
 * Live API topology — a real dependency mesh Invariant continuously watches.
 * Fixed service/vendor nodes with health status, animated request packets
 * traveling the edges, a periodic blast-radius pulse, and gentle mouse parallax.
 * Communicates the product concept, not decoration.
 */

type Tone = "stable" | "drift" | "breaking" | "analyzing";

const TONE_RGB: Record<Tone, string> = {
  stable: "120, 220, 170",
  drift: "235, 195, 120",
  breaking: "240, 120, 120",
  analyzing: "200, 140, 245",
};

interface TNode {
  id: string;
  // normalized position 0..1
  nx: number;
  ny: number;
  x: number;
  y: number;
  r: number;
  tone: Tone;
  label: string;
  phase: number;
}

const NODES: Omit<TNode, "x" | "y" | "phase">[] = [
  { id: "checkout", nx: 0.2, ny: 0.32, r: 5, tone: "breaking", label: "checkout-web" },
  { id: "payments", nx: 0.36, ny: 0.6, r: 6, tone: "breaking", label: "payments" },
  { id: "stripe", nx: 0.16, ny: 0.72, r: 5, tone: "breaking", label: "Stripe /charges" },
  { id: "orders", nx: 0.5, ny: 0.4, r: 5, tone: "stable", label: "orders-api" },
  { id: "billing", nx: 0.54, ny: 0.72, r: 4, tone: "stable", label: "billing" },
  { id: "auth", nx: 0.66, ny: 0.24, r: 4, tone: "stable", label: "auth-gw" },
  { id: "notif", nx: 0.78, ny: 0.5, r: 4, tone: "stable", label: "notifications" },
  { id: "twilio", nx: 0.9, ny: 0.64, r: 5, tone: "drift", label: "Twilio /Messages" },
  { id: "search", nx: 0.74, ny: 0.78, r: 4, tone: "drift", label: "search-svc" },
  { id: "shipping", nx: 0.86, ny: 0.34, r: 4, tone: "analyzing", label: "Shippo /rates" },
];

const EDGES: [string, string][] = [
  ["checkout", "payments"],
  ["payments", "stripe"],
  ["payments", "billing"],
  ["checkout", "orders"],
  ["orders", "payments"],
  ["orders", "auth"],
  ["checkout", "auth"],
  ["orders", "shipping"],
  ["notif", "twilio"],
  ["orders", "notif"],
  ["search", "auth"],
  ["notif", "search"],
];

const BLAST = new Set(["stripe", "payments", "checkout", "orders", "billing"]);

interface Packet {
  from: string;
  to: string;
  t: number;
  speed: number;
  tone: Tone;
}

export function TopologyField({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const mouse = { x: 0.5, y: 0.5, active: false };
    let t = 0;
    let blastT = -1;

    const nodes: TNode[] = NODES.map((n, i) => ({
      ...n,
      x: 0,
      y: 0,
      phase: i * 0.7,
    }));
    const byId = new Map(nodes.map((n) => [n.id, n]));

    const packets: Packet[] = EDGES.map(([from, to]) => ({
      from,
      to,
      t: Math.random(),
      speed: 0.0025 + Math.random() * 0.003,
      tone: byId.get(from)!.tone,
    }));

    const layout = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      for (const n of nodes) {
        n.x = n.nx * w;
        n.y = n.ny * h;
      }
    };

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = (e.clientX - rect.left) / rect.width;
      mouse.y = (e.clientY - rect.top) / rect.height;
      mouse.active = true;
    };
    const onLeave = () => (mouse.active = false);

    const draw = () => {
      t += 1;
      ctx.clearRect(0, 0, w, h);

      // periodic blast-radius pulse from stripe
      if (!reduce && t % 320 === 0) blastT = t;
      const blastAge = blastT >= 0 ? (t - blastT) / 90 : 999;
      const blastActive = blastAge < 1;

      const parX = mouse.active ? (mouse.x - 0.5) * 14 : 0;
      const parY = mouse.active ? (mouse.y - 0.5) * 14 : 0;

      const px = (n: TNode) => n.x + parX * (n.nx - 0.5) * 2;
      const py = (n: TNode) => n.y + parY * (n.ny - 0.5) * 2;

      // edges
      for (const [from, to] of EDGES) {
        const a = byId.get(from)!;
        const b = byId.get(to)!;
        const inBlast = BLAST.has(from) && BLAST.has(to);
        ctx.beginPath();
        ctx.moveTo(px(a), py(a));
        ctx.lineTo(px(b), py(b));
        ctx.strokeStyle = inBlast
          ? "rgba(240,120,120,0.18)"
          : "rgba(150,160,175,0.09)";
        ctx.lineWidth = inBlast ? 1.1 : 0.7;
        ctx.stroke();
      }

      // packets
      if (!reduce) {
        for (const p of packets) {
          const a = byId.get(p.from)!;
          const b = byId.get(p.to)!;
          p.t += p.speed;
          if (p.t > 1) p.t = 0;
          const x = px(a) + (px(b) - px(a)) * p.t;
          const y = py(a) + (py(b) - py(a)) * p.t;
          const rgb = TONE_RGB[p.tone];
          ctx.beginPath();
          ctx.arc(x, y, 1.7, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${rgb}, 0.9)`;
          ctx.shadowColor = `rgba(${rgb}, 0.9)`;
          ctx.shadowBlur = 6;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      // blast ring
      if (blastActive) {
        const origin = byId.get("stripe")!;
        const maxR = Math.hypot(w, h) * 0.6;
        const rr = blastAge * maxR;
        ctx.beginPath();
        ctx.arc(px(origin), py(origin), rr, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(240,120,120,${(1 - blastAge) * 0.4})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // nodes
      for (const n of nodes) {
        const x = px(n);
        const y = py(n);
        const rgb = TONE_RGB[n.tone];
        const pulse = reduce ? 1 : 0.85 + Math.sin(t * 0.05 + n.phase) * 0.15;

        // halo for non-stable
        if (n.tone !== "stable" && !reduce) {
          const hr = n.r + 6 + Math.sin(t * 0.06 + n.phase) * 3;
          ctx.beginPath();
          ctx.arc(x, y, hr, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${rgb}, 0.18)`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(x, y, n.r * pulse, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb}, 0.95)`;
        ctx.shadowColor = `rgba(${rgb}, 0.8)`;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;

        // core
        ctx.beginPath();
        ctx.arc(x, y, n.r * 0.42, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(14,15,17,0.9)";
        ctx.fill();

        // label — suppressed in the central text column so the headline stays clean
        if (n.nx < 0.3 || n.nx > 0.72) {
          ctx.font = "500 9.5px ui-monospace, 'JetBrains Mono', monospace";
          ctx.fillStyle = `rgba(200,205,215,0.5)`;
          ctx.textAlign = "center";
          ctx.fillText(n.label, x, y + n.r + 13);
        }
      }

      raf = requestAnimationFrame(draw);
    };

    layout();
    draw();
    window.addEventListener("resize", layout);
    window.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", layout);
      window.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden />;
}
