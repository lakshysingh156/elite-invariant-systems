import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, useEffect } from "react";
import { motion } from "motion/react";
import { Sparkles, Send, FileText, History, Zap } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-shell";
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
  head: () => ({ meta: [{ title: "AI Copilot — Invariant." }] }),
  component: Copilot,
});

const citationTone: Record<string, string> = {
  incident: "text-breaking border-breaking/30 bg-breaking/10",
  change: "text-drift border-drift/30 bg-drift/10",
  drift: "text-analyzing border-analyzing/30 bg-analyzing/10",
  endpoint: "text-stable border-stable/30 bg-stable/10",
};

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
    setTurns((t) => [...t, { id: `u${Date.now()}`, role: "user", content: q }]);
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
            "Based on the reliability graph and recent signals, the most likely driver is the Stripe /charges contract change (INV-231). It removed a required response field and changed `amount` to a string — your payments-service still parses it as an integer. I've linked the exact change record and the drift event below.",
          citations: [
            { id: "x1", kind: "incident", label: "Incident INV-231", ref: "inc-231" },
            { id: "x2", kind: "change", label: "Change · amount type", ref: "c2" },
          ],
          suggestions: ["What's the recommended fix?", "Who owns payments-service?"],
        },
      ]);
    }, 1100);
  };

  return (
    <>
      <PageHeader
        title="AI Copilot"
        description="Investigate reliability incidents in plain English — every answer cited."
      />
      <div className="grid h-[calc(100vh-8.5rem)] grid-cols-1 lg:grid-cols-[1fr_20rem]">
        {/* chat column */}
        <div className="flex min-h-0 flex-col border-r border-hairline">
          <div className="flex-1 space-y-5 overflow-y-auto p-6">
            {turns.map((t) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("flex", t.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    t.role === "user"
                      ? "rounded-br-sm bg-secondary"
                      : "rounded-bl-sm border border-hairline bg-surface/60",
                  )}
                >
                  {t.role === "copilot" && (
                    <div className="mb-2 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-signal">
                      <Sparkles className="h-3 w-3" /> Copilot
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
                      className="h-1.5 w-1.5 rounded-full bg-signal"
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

          {/* composer */}
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
              className="flex items-center gap-2 rounded-xl border border-hairline bg-surface/60 px-3 py-2 focus-within:border-signal/40"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about an incident, API, or change…"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
              />
              <button
                type="submit"
                className="grid h-8 w-8 place-items-center rounded-lg bg-signal text-signal-foreground transition-transform hover:scale-105"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>

        {/* investigation rail */}
        <aside className="hidden min-h-0 flex-col gap-5 overflow-y-auto p-5 lg:flex">
          <div>
            <div className="mb-2 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              <Zap className="h-3 w-3" /> Suggested actions
            </div>
            <div className="space-y-2">
              {suggestedActions.map((a) => (
                <button
                  key={a.id}
                  className={cn(
                    "w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                    a.tone === "signal"
                      ? "border-signal/30 bg-signal/10 text-signal hover:bg-signal/15"
                      : "border-hairline bg-surface/60 text-foreground/85 hover:bg-surface-raised",
                  )}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Related incidents
            </div>
            <div className="space-y-2">
              {relatedIncidents.map((r) => (
                <div
                  key={r.id}
                  className="rounded-lg border border-hairline bg-surface/60 p-3"
                >
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="text-muted-foreground">{r.code}</span>
                    <span className="text-stable">{Math.round(r.similarity * 100)}%</span>
                  </div>
                  <div className="mt-1 text-sm">{r.title}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              <History className="h-3 w-3" /> Investigation history
            </div>
            <div className="space-y-1">
              {copilotHistory.map((h) => (
                <button
                  key={h.id}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-surface-raised"
                >
                  <span className="min-w-0 truncate text-foreground/85">
                    {h.title}
                  </span>
                  <span className="ml-2 shrink-0 font-mono text-xs text-muted-foreground">
                    {h.when}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
