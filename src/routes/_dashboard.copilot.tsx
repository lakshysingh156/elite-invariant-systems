import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "motion/react";
import { Sparkles, Send, FileText, Loader2, Radio, Plus } from "lucide-react";
import { toast } from "sonner";
import { listCopilotThread, askCopilot } from "@/lib/copilot.functions";
import { getDashboardOverview } from "@/lib/dashboard.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_dashboard/copilot")({
  head: () => ({ meta: [{ title: "AI Reliability Analyst — Invariant." }] }),
  component: Copilot,
});

// simple in-memory thread id per browser session
function useThreadId() {
  return useMemo(() => {
    if (typeof window === "undefined") return crypto.randomUUID();
    const key = "invariant.copilotThread";
    let t = window.localStorage.getItem(key);
    if (!t) {
      t = crypto.randomUUID();
      window.localStorage.setItem(key, t);
    }
    return t;
  }, []);
}

const citationTone: Record<string, string> = {
  incident: "text-breaking border-breaking/30 bg-breaking/10",
  change: "text-drift border-drift/30 bg-drift/10",
  drift: "text-analyzing border-analyzing/30 bg-analyzing/10",
  endpoint: "text-stable border-stable/30 bg-stable/10",
};

function Copilot() {
  const threadId = useThreadId();
  const qc = useQueryClient();
  const listFn = useServerFn(listCopilotThread);
  const askFn = useServerFn(askCopilot);
  const overviewFn = useServerFn(getDashboardOverview);

  const { data: turns = [], isLoading } = useQuery({
    queryKey: ["copilot", threadId],
    queryFn: () => listFn({ data: { threadId } }),
  });
  const { data: overview } = useQuery({
    queryKey: ["dashboard-overview"],
    queryFn: () => overviewFn(),
  });

  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const askMut = useMutation({
    mutationFn: (q: string) => askFn({ data: { threadId, question: q } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["copilot", threadId] }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Copilot failed"),
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, askMut.isPending]);

  const ask = (q: string) => {
    if (!q.trim() || askMut.isPending) return;
    askMut.mutate(q);
    setInput("");
  };

  const startNew = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("invariant.copilotThread");
      window.location.reload();
    }
  };

  const suggestedQuestions = overview?.stats.apiCount
    ? [
        overview.openIncidents[0]
          ? `Explain incident ${overview.openIncidents[0].code} and what to do about it`
          : "Which APIs in my workspace have the worst reliability right now?",
        "What breaking changes have shipped in the last 30 days?",
        "Which service has the biggest blast radius if a vendor breaks?",
        "Summarise the health of my API fleet",
      ]
    : [
        "How do I get started?",
        "What data does Invariant need to be useful?",
        "How do you detect breaking changes?",
      ];

  return (
    <div className="grid h-[calc(100vh-3.5rem)] grid-cols-1 lg:grid-cols-[20rem_1fr]">
      {/* LEFT — workspace context */}
      <aside className="hidden min-h-0 flex-col overflow-y-auto border-r border-hairline bg-background/40 p-5 lg:flex">
        <div className="mb-4 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          <Radio className="h-3 w-3" /> workspace context
        </div>

        <div className="rounded-xl border border-hairline bg-surface/60 p-4">
          <div className="grid grid-cols-2 gap-3 font-mono text-xs">
            <Stat label="APIs" value={overview?.stats.apiCount ?? 0} />
            <Stat label="Open incidents" value={overview?.stats.openIncidents ?? 0} tone={overview?.stats.openIncidents ? "text-breaking" : undefined} />
            <Stat label="Breaking (30d)" value={overview?.stats.breaking30d ?? 0} tone={overview?.stats.breaking30d ? "text-breaking" : undefined} />
            <Stat label="Avg genome" value={overview?.stats.avgGenome ?? 0} />
          </div>
        </div>

        <div className="mt-5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Open incidents
        </div>
        <div className="mt-2 space-y-1">
          {(overview?.openIncidents ?? []).slice(0, 5).map((i: any) => (
            <div key={i.id} className="rounded-md border border-hairline bg-surface/60 px-2.5 py-1.5">
              <div className="font-mono text-[10px] uppercase tracking-wider text-breaking">{i.code}</div>
              <div className="mt-0.5 truncate text-xs">{i.title}</div>
            </div>
          ))}
          {!overview?.openIncidents.length && (
            <div className="text-xs text-muted-foreground">No open incidents.</div>
          )}
        </div>

        <button
          onClick={startNew}
          className="mt-5 inline-flex items-center justify-center gap-1.5 rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-foreground/80 hover:bg-surface-raised"
        >
          <Plus className="h-4 w-4" /> New conversation
        </button>
      </aside>

      {/* CENTER — chat */}
      <section className="flex min-h-0 flex-col">
        <div className="flex items-center justify-between border-b border-hairline px-5 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand" />
            <div>
              <div className="text-sm font-medium">AI Reliability Analyst</div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                grounded in your workspace · every answer cited
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading conversation…
            </div>
          )}

          {!isLoading && turns.length === 0 && (
            <div className="mx-auto max-w-xl rounded-xl border border-hairline bg-surface/60 p-6 text-center">
              <Sparkles className="mx-auto h-6 w-6 text-brand" />
              <h3 className="mt-3 text-lg font-semibold">Ask Copilot anything</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Copilot reads your APIs, contract changes, and incidents to answer with real data.
              </p>
            </div>
          )}

          {turns.map((t: any) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("flex", t.role === "user" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  t.role === "user"
                    ? "rounded-br-sm bg-secondary"
                    : "rounded-bl-sm border border-hairline bg-surface/60 elevate",
                )}
              >
                {t.role !== "user" && (
                  <div className="mb-2 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-brand">
                    <Sparkles className="h-3 w-3" /> analyst
                  </div>
                )}
                <p className="whitespace-pre-line text-foreground/90">{t.content}</p>
                {t.citations && Array.isArray(t.citations) && t.citations.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {t.citations.map((c: any, i: number) => (
                      <span
                        key={i}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[11px]",
                          citationTone[c.kind] ?? citationTone.change,
                        )}
                      >
                        <FileText className="h-3 w-3" />
                        {c.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {askMut.isPending && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-hairline bg-surface/60 px-4 py-3">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-brand"
                    style={{ animation: "signal-pulse 1s infinite", animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="border-t border-hairline p-4">
          {turns.length === 0 && (
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
              placeholder="Ask about an incident, an API, a change, or a service…"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
            />
            <button
              type="submit"
              disabled={askMut.isPending || !input.trim()}
              className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-brand-foreground transition-transform hover:scale-105 brand-glow disabled:opacity-60"
            >
              {askMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number | string; tone?: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn("mt-1 text-xl font-semibold tabular-nums", tone)}>{value}</div>
    </div>
  );
}
