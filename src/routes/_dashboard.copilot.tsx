import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Sparkles,
  Send,
  FileText,
  History,
  Zap,
  AlertOctagon,
  Terminal,
  Boxes,
  Radio,
} from "lucide-react";
import {
  seedConversation,
  suggestedQuestions,
  copilotHistory,
  relatedIncidents,
  suggestedActions,
} from "@/data/copilot";
import type { ChatTurn } from "@/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_dashboard/copilot")({
  head: () => ({ meta: [{ title: "AI Reliability Analyst — Invariant." }] }),
  component: Copilot,
});

const citationTone: Record<string, string> = {
  incident: "text-breaking border-breaking/30 bg-breaking/10",
  change: "text-drift border-drift/30 bg-drift/10",
  drift: "text-analyzing border-analyzing/30 bg-analyzing/10",
  endpoint: "text-signal border-signal/30 bg-signal/10",
};

const contextIncident = {
  code: "INV-231",
  title: "Stripe /charges response contract broke payment capture",
  severity: "critical",
  api: "Stripe Payments",
  openedAt: "03:42:11 UTC",
  affectedServices: ["payments-service", "checkout-web", "receipts-worker"],
  affectedEndpoints: 12,
  signals: [
    { kind: "contract", detail: "3 breaking changes on POST /charges" },
    { kind: "runtime", detail: "capture error rate 42% (baseline 0.2%)" },
    { kind: "graph", detail: "3 services in blast radius" },
  ],
};

const evidenceLogs = [
  {
    at: "03:42:22",
    src: "payments-service",
    line: 'TypeError: cannot parse amount "2400" as integer',
    tone: "text-breaking",
  },
  {
    at: "03:42:24",
    src: "payments-service",
    line: "at parseCharge (adapter.ts:47:12)",
    tone: "text-muted-foreground",
  },
  {
    at: "03:42:31",
    src: "stripe-egress",
    line: "response.headers[stripe-version] = 2026-06-30",
    tone: "text-drift",
  },
  {
    at: "03:43:02",
    src: "invariant.diff",
    line: "schema.response.amount: integer → string",
    tone: "text-analyzing",
  },
];

function Copilot() {
  const [turns, setTurns] = useState<ChatTurn[]>(seedConversation);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, thinking]);

  const ask = (q: string) => {
    if (!q.trim()) return;
    setTurns((t) => [
      ...t,
      { id: `u${Date.now()}`, role: "user", content: q },
    ]);
    setInput("");
    setThinking(true);
    setTimeout(() => {
      setThinking(false);
      setTurns((t) => [
        ...t,
        {
          id: `c${Date.now()}`,
          role: "copilot",
          content:
            "Based on the reliability graph and recent signals, the most likely driver is the Stripe /charges contract change (INV-231). It removed a required response field and changed `amount` to a string — payments-service still parses it as an integer. Confidence 94%.",
          citations: [
            {
              id: "x1",
              kind: "incident",
              label: "Incident INV-231",
              ref: "inc-231",
            },
            { id: "x2", kind: "change", label: "Change · amount type", ref: "c2" },
          ],
          suggestions: [
            "What's the recommended fix?",
            "Who owns payments-service?",
          ],
        },
      ]);
    }, 1100);
  };

  return (
    <div className="grid h-[calc(100vh-3.5rem)] grid-cols-1 lg:grid-cols-[22rem_1fr_22rem]">
      {/* LEFT — incident context */}
      <aside className="hidden min-h-0 flex-col overflow-y-auto border-r border-hairline bg-background/40 p-5 lg:flex">
        <div className="mb-4 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          <AlertOctagon className="h-3 w-3" /> incident context
        </div>
        <div className="rounded-xl border border-breaking/30 bg-breaking/5 p-4">
          <div className="flex items-center justify-between font-mono text-[11px]">
            <span className="text-breaking">{contextIncident.code}</span>
            <span className="uppercase tracking-wider text-breaking/80">
              {contextIncident.severity}
            </span>
          </div>
          <div className="mt-2 text-sm font-medium leading-snug">
            {contextIncident.title}
          </div>
          <div className="mt-2 font-mono text-[11px] text-muted-foreground">
            {contextIncident.api} · opened {contextIncident.openedAt}
          </div>
        </div>

        <div className="mt-5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Affected services
        </div>
        <div className="mt-2 space-y-1">
          {contextIncident.affectedServices.map((s) => (
            <div
              key={s}
              className="flex items-center gap-2 rounded-md border border-hairline bg-surface/60 px-2.5 py-1.5 font-mono text-xs"
            >
              <Boxes className="h-3 w-3 text-muted-foreground" />
              {s}
            </div>
          ))}
        </div>

        <div className="mt-5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Signals
        </div>
        <div className="mt-2 space-y-2">
          {contextIncident.signals.map((s) => (
            <div
              key={s.kind}
              className="rounded-md border border-hairline bg-surface/60 p-2.5"
            >
              <div className="font-mono text-[10px] uppercase tracking-wider text-analyzing">
                {s.kind}
              </div>
              <div className="mt-0.5 text-xs text-foreground/85">{s.detail}</div>
            </div>
          ))}
        </div>

        <div className="mt-5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          <History className="mr-1 inline h-3 w-3" /> investigations
        </div>
        <div className="mt-2 space-y-1">
          {copilotHistory.map((h) => (
            <button
              key={h.id}
              className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-surface-raised"
            >
              <span className="min-w-0 truncate text-foreground/85">
                {h.title}
              </span>
              <span className="ml-2 shrink-0 font-mono text-[10px] text-muted-foreground">
                {h.when}
              </span>
            </button>
          ))}
        </div>
      </aside>

      {/* CENTER — analysis */}
      <section className="flex min-h-0 flex-col">
        <div className="flex items-center justify-between border-b border-hairline px-5 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand" />
            <div>
              <div className="text-sm font-medium">AI Reliability Analyst</div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                grounded · cited · every step reproducible
              </div>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-signal/30 bg-signal/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-signal">
            <Radio className="h-3 w-3 live-dot" /> investigating
          </span>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {turns.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex",
                t.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  t.role === "user"
                    ? "rounded-br-sm bg-secondary"
                    : "rounded-bl-sm border border-hairline bg-surface/60 elevate",
                )}
              >
                {t.role === "copilot" && (
                  <div className="mb-2 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-brand">
                    <Sparkles className="h-3 w-3" /> analyst
                  </div>
                )}
                <p className="whitespace-pre-line text-foreground/90">
                  {t.content}
                </p>
                {t.citations && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {t.citations.map((c) => (
                      <span
                        key={c.id}
                        className={cn(
                          "inline-flex cursor-pointer items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[11px] transition-transform hover:scale-105",
                          citationTone[c.kind],
                        )}
                      >
                        <FileText className="h-3 w-3" />
                        {c.label}
                      </span>
                    ))}
                  </div>
                )}
                {t.suggestions && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {t.suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => ask(s)}
                        className="rounded-full border border-hairline bg-background/40 px-3 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {thinking && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-hairline bg-surface/60 px-4 py-3">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-brand"
                    style={{
                      animation: "signal-pulse 1s infinite",
                      animationDelay: `${i * 0.15}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="border-t border-hairline p-4">
          {turns.length <= 1 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => ask(q)}
                  className="rounded-full border border-hairline bg-surface/60 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
            className="flex items-center gap-2 rounded-xl border border-hairline bg-surface/60 px-3 py-2 focus-within:border-brand/40"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about the incident, an API, a change, or a service…"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
            />
            <button
              type="submit"
              className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-brand-foreground transition-transform hover:scale-105 brand-glow"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </section>

      {/* RIGHT — evidence */}
      <aside className="hidden min-h-0 flex-col overflow-y-auto border-l border-hairline bg-background/40 p-5 lg:flex">
        <div className="mb-4 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          <Terminal className="h-3 w-3" /> evidence
        </div>

        <div className="rounded-xl border border-hairline bg-surface/60">
          <div className="border-b border-hairline px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            recent logs · payments-service
          </div>
          <div className="p-3 font-mono text-[11px] leading-relaxed">
            {evidenceLogs.map((l, i) => (
              <div key={i} className="flex gap-2">
                <span className="shrink-0 text-muted-foreground/60">
                  {l.at}
                </span>
                <span className={cn("min-w-0 flex-1", l.tone)}>{l.line}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <Zap className="h-3 w-3" /> suggested actions
          </div>
          <div className="space-y-2">
            {suggestedActions.map((a) => (
              <button
                key={a.id}
                className={cn(
                  "w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                  a.tone === "signal"
                    ? "border-brand/30 bg-brand/10 text-brand hover:bg-brand/15"
                    : "border-hairline bg-surface/60 text-foreground/85 hover:bg-surface-raised",
                )}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            similar past incidents
          </div>
          <div className="space-y-2">
            {relatedIncidents.map((r) => (
              <div
                key={r.id}
                className="rounded-lg border border-hairline bg-surface/60 p-3"
              >
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="text-muted-foreground">{r.code}</span>
                  <span className="text-signal">
                    {Math.round(r.similarity * 100)}%
                  </span>
                </div>
                <div className="mt-1 text-sm">{r.title}</div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
