import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { BrandMark } from "@/components/brand/wordmark";


const SESSION_KEY = "invariant.intro.seen";

/**
 * Cinematic landing intro — black screen → mark → glowing "reliability eclipse"
 * ring draws in → wordmark resolves with a light sweep → curtain lifts to the hero.
 * Session-scoped (won't replay), skippable, and reduced-motion aware.
 */
export function IntroReveal() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let seen = false;
    try {
      seen = sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      seen = false;
    }
    if (seen || reduce) return;

    setShow(true);
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* ignore */
    }
    const t = window.setTimeout(() => setShow(false), 2600);
    return () => window.clearTimeout(t);
  }, []);

  const dismiss = () => setShow(false);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="intro"
          className="fixed inset-0 z-[100] grid place-items-center bg-background"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "blur(6px)" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          onClick={dismiss}
        >
          <div className="pointer-events-none absolute inset-0 grid-backdrop opacity-20" />

          <div className="relative grid place-items-center">
            {/* eclipse ring */}
            <svg
              width="360"
              height="360"
              viewBox="0 0 360 360"
              className="absolute"
              aria-hidden
            >
              <defs>
                <linearGradient id="introRing" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.1" />
                  <stop offset="55%" stopColor="var(--brand)" stopOpacity="1" />
                  <stop offset="100%" stopColor="var(--brand)" stopOpacity="0.2" />

                </linearGradient>
                <filter id="introGlow">
                  <feGaussianBlur stdDeviation="6" result="b" />
                  <feMerge>
                    <feMergeNode in="b" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <motion.circle
                cx="180"
                cy="180"
                r="120"
                fill="none"
                stroke="url(#introRing)"
                strokeWidth="2"
                strokeLinecap="round"
                filter="url(#introGlow)"
                initial={{ pathLength: 0, opacity: 0, rotate: -90 }}
                animate={{ pathLength: 1, opacity: 1, rotate: 0 }}
                transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
                style={{ transformOrigin: "180px 180px" }}
              />
              {/* faint outer scan ring */}
              <motion.circle
                cx="180"
                cy="180"
                r="150"
                fill="none"
                stroke="var(--hairline)"
                strokeWidth="1"
                strokeDasharray="2 8"
                initial={{ opacity: 0, rotate: 0 }}
                animate={{ opacity: 1, rotate: 60 }}
                transition={{ duration: 2.4, ease: "linear" }}
                style={{ transformOrigin: "180px 180px" }}
              />
            </svg>

            {/* soft bloom */}
            <motion.div
              className="absolute h-40 w-40 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, color-mix(in oklab, var(--brand) 40%, transparent), transparent 70%)",
              }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: [0, 0.9, 0.5], scale: [0.5, 1.1, 1] }}
              transition={{ duration: 1.6, ease: "easeOut" }}
            />

            <div className="relative flex flex-col items-center gap-5">
              <motion.span
                className="grid h-14 w-14 place-items-center rounded-2xl bg-brand/15 ring-1 ring-inset ring-brand/40 brand-glow"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              >
                <BrandMark size={28} className="text-brand" strokeWidth={2.4} />
              </motion.span>


              <motion.span
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="text-2xl font-semibold tracking-tight"
              >
                <span className="text-sweep">Invariant</span>
                <span className="text-brand">.</span>
              </motion.span>

              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.3, duration: 0.5 }}
                className="font-mono text-[10px] uppercase tracking-[0.35em] text-muted-foreground"
              >
                initializing watch loop
              </motion.span>
            </div>
          </div>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6 }}
            className="absolute bottom-8 font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground/70 transition-colors hover:text-foreground"
          >
            skip →
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
