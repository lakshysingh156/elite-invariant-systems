import { motion } from "motion/react";
import { Check } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Eyebrow } from "./eyebrow";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

const tiers = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    features: ["3 monitors", "Daily checks", "Email alerts", "7-day history"],
    cta: "Start free",
    emphasized: false,
  },
  {
    name: "Pro",
    price: "$9",
    cadence: "/month",
    features: [
      "15 monitors",
      "Hourly checks",
      "AI impact analysis (100/mo)",
      "All alert channels",
      "30-day history",
    ],
    cta: "Get started",
    emphasized: true,
  },
  {
    name: "Team",
    price: "$29",
    cadence: "/month",
    features: [
      "50 monitors",
      "15-min checks",
      "Migration guides",
      "Auto-patch PRs (20/mo)",
      "GitHub integration",
      "90-day history",
    ],
    cta: "Get started",
    emphasized: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <Eyebrow>Pricing</Eyebrow>
          <h2 className="mt-5 text-balance text-4xl font-bold tracking-[-0.02em] sm:text-5xl">
            Simple, transparent pricing.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground">
            Start free. Upgrade when your API surface grows. No seat traps.
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {tiers.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: EASE }}
              className={cn(
                "relative flex flex-col rounded-2xl border p-6",
                t.emphasized
                  ? "border-signal/40 bg-surface-raised shadow-[0_0_60px_-20px_var(--signal)]"
                  : "border-hairline bg-surface/60",
              )}
            >
              {t.emphasized && (
                <span className="absolute right-5 top-5 rounded-full bg-signal/15 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-signal ring-1 ring-inset ring-signal/30">
                  Popular
                </span>
              )}
              <div className="font-mono text-sm uppercase tracking-wider text-muted-foreground">
                {t.name}
              </div>
              <div className="mt-4 flex items-end gap-1">
                <span className="text-4xl font-bold tracking-tight">
                  {t.price}
                </span>
                <span className="mb-1 text-sm text-muted-foreground">
                  {t.cadence}
                </span>
              </div>
              <ul className="mt-6 flex-1 space-y-3">
                {t.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-2.5 text-sm text-foreground/90"
                  >
                    <Check
                      className={cn(
                        "h-4 w-4 shrink-0",
                        t.emphasized ? "text-signal" : "text-stable",
                      )}
                      strokeWidth={2.5}
                    />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/signup"
                className={cn(
                  "mt-7 inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-medium transition-transform hover:scale-[1.02] active:scale-95",
                  t.emphasized
                    ? "bg-signal text-signal-foreground"
                    : "border border-hairline bg-secondary text-foreground hover:bg-accent",
                )}
              >
                {t.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
