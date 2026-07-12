import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowRight, Github, Loader2 } from "lucide-react";
import { Wordmark } from "@/components/brand/wordmark";
import { StatusBadge } from "@/components/ui-kit/status-badge";
import { EASE } from "@/lib/motion";

export function AuthShell({ mode }: { mode: "login" | "signup" }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const isSignup = mode === "signup";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => navigate({ to: "/dashboard" }), 700);
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.05fr]">
      {/* form side */}
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Link to="/" className="w-fit">
          <Wordmark />
        </Link>

        <div className="flex flex-1 items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="w-full max-w-sm"
          >
            <h1 className="text-2xl font-bold tracking-tight">
              {isSignup ? "Create your workspace" : "Welcome back"}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {isSignup
                ? "Start watching your API surface in under two minutes."
                : "Sign in to your Invariant. dashboard."}
            </p>

            <div className="mt-7 space-y-2.5">
              <button
                onClick={() => submit(new Event("submit") as unknown as React.FormEvent)}
                className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-hairline bg-secondary px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
              >
                <Github className="h-4 w-4" />
                Continue with GitHub
              </button>
            </div>

            <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-hairline" />
              or
              <span className="h-px flex-1 bg-hairline" />
            </div>

            <form onSubmit={submit} className="space-y-4">
              {isSignup && (
                <Field label="Work email" type="email" placeholder="you@company.com" />
              )}
              {!isSignup && (
                <Field label="Email" type="email" placeholder="you@company.com" />
              )}
              <Field
                label="Password"
                type="password"
                placeholder="••••••••••"
                hint={!isSignup ? "Forgot?" : undefined}
              />
              {isSignup && (
                <Field label="Organization" type="text" placeholder="Acme Inc." />
              )}

              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-2 rounded-lg bg-signal px-4 py-2.5 text-sm font-semibold text-signal-foreground transition-transform hover:scale-[1.01] active:scale-95 disabled:opacity-70"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {isSignup ? "Create workspace" : "Sign in"}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              {isSignup ? "Already have an account? " : "New to Invariant? "}
              <Link
                to={isSignup ? "/login" : "/signup"}
                className="font-medium text-foreground hover:text-signal"
              >
                {isSignup ? "Sign in" : "Create one"}
              </Link>
            </p>
          </motion.div>
        </div>
        <p className="text-center font-mono text-[11px] text-muted-foreground/60">
          Demo build · no real credentials required
        </p>
      </div>

      {/* visual side */}
      <div className="relative hidden overflow-hidden border-l border-hairline bg-[#0b0c0e] lg:block">
        <div className="absolute inset-0 grid-backdrop opacity-40" />
        <div className="absolute -right-24 top-1/3 h-96 w-96 rounded-full bg-[radial-gradient(circle,var(--signal),transparent_65%)] opacity-[0.1]" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <StatusBadge status="stable" label="control plane online" pulse />
          <div>
            <div className="font-mono text-sm text-muted-foreground">
              <div className="text-signal"># live incident feed</div>
              <TypedLines />
            </div>
            <blockquote className="mt-10 max-w-md text-2xl font-semibold leading-snug tracking-tight text-balance">
              &ldquo;It watches every API we depend on and tells us the instant a
              contract changes — before production ever notices.&rdquo;
            </blockquote>
            <div className="mt-4 font-mono text-xs text-muted-foreground">
              — Platform team, mid-market SaaS
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TypedLines() {
  const lines = [
    { t: "03:42", c: "text-breaking", x: "detect  Stripe /charges contract change" },
    { t: "03:42", c: "text-analyzing", x: "trace   3 services · 12 endpoints" },
    { t: "03:43", c: "text-drift", x: "draft   patch PR → payments-service" },
    { t: "03:45", c: "text-stable", x: "resolve zero downtime" },
  ];
  return (
    <div className="mt-3 space-y-1.5">
      {lines.map((l, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 + i * 0.35, duration: 0.4 }}
          className="flex gap-3 text-[13px]"
        >
          <span className="text-muted-foreground/50">{l.t}</span>
          <span className={l.c}>{l.x}</span>
        </motion.div>
      ))}
    </div>
  );
}

function Field({
  label,
  type,
  placeholder,
  hint,
}: {
  label: string;
  type: string;
  placeholder: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {hint && (
          <span className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
            {hint}
          </span>
        )}
      </div>
      <input
        type={type}
        placeholder={placeholder}
        className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-signal/50 focus:ring-2 focus:ring-signal/15"
      />
    </label>
  );
}
