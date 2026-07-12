import { useEffect, useRef } from "react";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  tone: string;
  pulse: number;
}

const TONES = [
  "rgba(120, 220, 170, 0.9)", // stable
  "rgba(120, 220, 170, 0.9)",
  "rgba(230, 190, 120, 0.9)", // drift
  "rgba(200, 130, 245, 0.9)", // analyzing
];

/**
 * Live API topology — a subtle, mouse-reactive dependency mesh.
 * Represents the surface Invariant continuously watches. Not a fake dashboard.
 */
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
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    const mouse = { x: -9999, y: -9999 };
    let nodes: Node[] = [];

    const build = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(46, Math.floor((w * h) / 16000));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        r: Math.random() * 1.6 + 1,
        tone: TONES[Math.floor(Math.random() * TONES.length)],
        pulse: Math.random() * Math.PI * 2,
      }));
    };

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const onLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const linkDist = 128;
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (!reduce) {
          n.x += n.vx;
          n.y += n.vy;
          n.pulse += 0.02;
        }
        // gentle attraction to mouse
        const dxm = mouse.x - n.x;
        const dym = mouse.y - n.y;
        const dm = Math.hypot(dxm, dym);
        if (dm < 160) {
          n.x += (dxm / dm) * 0.35;
          n.y += (dym / dm) * 0.35;
        }
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;

        for (let j = i + 1; j < nodes.length; j++) {
          const m = nodes[j];
          const dx = n.x - m.x;
          const dy = n.y - m.y;
          const d = Math.hypot(dx, dy);
          if (d < linkDist) {
            const a = (1 - d / linkDist) * 0.16;
            ctx.strokeStyle = `rgba(160, 170, 185, ${a})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(m.x, m.y);
            ctx.stroke();
          }
        }
      }
      for (const n of nodes) {
        const p = reduce ? 1 : 0.7 + Math.sin(n.pulse) * 0.3;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * p, 0, Math.PI * 2);
        ctx.fillStyle = n.tone;
        ctx.shadowColor = n.tone;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      raf = requestAnimationFrame(draw);
    };

    build();
    draw();
    window.addEventListener("resize", build);
    window.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", build);
      window.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden />;
}
