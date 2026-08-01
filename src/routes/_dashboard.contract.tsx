import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { GitCompareArrows, ChevronDown, Loader2 } from "lucide-react";
import { PageHeader, PageBody, Panel } from "@/components/dashboard/page-shell";
import { SeverityPill } from "@/components/ui-kit/status-badge";
import { getContractIntelligence } from "@/lib/contract.functions";
import type { Severity } from "@/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_dashboard/contract")({
  head: () => ({
    meta: [
      { title: "Contract Intelligence — Invariant." },
      {
        name: "description",
        content:
          "Semantic diffs between OpenAPI versions with breaking, risky and safe change classification.",
      },
    ],
  }),
  component: Contract,
});

const order: Severity[] = ["breaking", "risky", "safe"];
const groupLabels: Record<Severity, string> = {
  breaking: "Breaking changes",
  risky: "Risky changes",
  safe: "Safe changes",
};

function Contract() {
  const [apiId, setApiId] = useState<string | undefined>(undefined);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<Severity | "all">("all");

  const fn = useServerFn(getContractIntelligence);
  const { data, isLoading } = useQuery({
    queryKey: ["contract-intelligence", apiId ?? "first"],
    queryFn: () => fn({ data: apiId ? { apiId } : {} }),
  });

  if (isLoading || !data) {
    return (
      <PageBody>
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading contract diffs…
        </div>
      </PageBody>
    );
  }

  const changes = data.changes;
  const versions = data.versions;
  const counts = order.reduce(
    (acc, s) => ({ ...acc, [s]: changes.filter((c: any) => c.severity === s).length }),
    {} as Record<Severity, number>,
  );
  const selected = data.apis.find((a: any) => a.id === data.selectedId);

  return (
    <>
      <PageHeader
        eyebrow={selected?.name ?? "No API selected"}
        title="Contract Intelligence"
        description="Semantic diff between two spec versions — not a string diff."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {data.apis.length > 0 && (
              <select
                value={data.selectedId ?? ""}
                onChange={(e) => {
                  setApiId(e.target.value);
                  setExpanded(null);
                }}
                className="rounded-lg border border-hairline bg-surface px-3 py-2 font-mono text-xs text-foreground outline-none"
              >
                {data.apis.map((a: any) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            )}
            {versions.length >= 2 && (
              <div className="flex items-center gap-2 rounded-lg border border-hairline bg-surface px-3 py-2 font-mono text-xs">
                <span className="text-muted-foreground">{versions[1].version}</span>
                <GitCompareArrows className="h-3.5 w-3.5 text-signal" />
                <span className="text-foreground">{versions[0].version}</span>
              </div>
            )}
          </div>
        }
      />
      <PageBody className="space-y-5">
        {data.apis.length === 0 ? (
          <Panel className="p-10 text-center text-sm text-muted-foreground">
            No APIs registered yet. Register an API or upload an OpenAPI spec to start tracking
            contract changes.
          </Panel>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              {order.map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter((f) => (f === s ? "all" : s))}
                  className={cn(
                    "flex items-center justify-between rounded-xl border bg-surface/60 px-4 py-3 text-left transition-colors",
                    filter === s ? "border-signal/40" : "border-hairline hover:bg-surface-raised",
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <SeverityPill severity={s} />
                  </div>
                  <span className="font-mono text-2xl font-semibold tabular-nums">{counts[s]}</span>
                </button>
              ))}
            </div>

            {changes.length === 0 && (
              <Panel className="p-10 text-center text-sm text-muted-foreground">
                No contract changes detected for {selected?.name}. Upload a newer spec version to
                run a semantic diff.
              </Panel>
            )}

            {order
              .filter((s) => filter === "all" || filter === s)
              .map((sev) => {
                const items = changes.filter((c: any) => c.severity === sev);
                if (!items.length) return null;
                return (
                  <Panel key={sev} title={`${groupLabels[sev]} · ${items.length}`}>
                    <div className="divide-y divide-hairline">
                      {items.map((c: any) => {
                        const open = expanded === c.id;
                        return (
                          <div key={c.id}>
                            <button
                              onClick={() => setExpanded(open ? null : c.id)}
                              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-raised/60"
                            >
                              <span className="font-mono text-xs uppercase text-muted-foreground">
                                {c.kind}
                              </span>
                              <span className="min-w-0 flex-1 truncate font-mono text-sm text-foreground/85">
                                {c.target}
                              </span>
                              <ChevronDown
                                className={cn(
                                  "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                                  open && "rotate-180",
                                )}
                              />
                            </button>
                            {open && (
                              <div className="border-t border-hairline bg-background/40 px-4 py-4">
                                <p className="mb-3 text-sm text-muted-foreground">{c.summary}</p>
                                <div className="grid gap-3 md:grid-cols-2">
                                  <div>
                                    <div className="mb-1.5 font-mono text-[11px] uppercase tracking-wider text-breaking/80">
                                      Before
                                    </div>
                                    <pre className="overflow-x-auto rounded-lg border border-hairline bg-[#0b0c0e] p-3 font-mono text-xs text-foreground/80">
                                      {c.before_snippet ?? "—"}
                                    </pre>
                                  </div>
                                  <div>
                                    <div className="mb-1.5 font-mono text-[11px] uppercase tracking-wider text-stable/80">
                                      After
                                    </div>
                                    <pre className="overflow-x-auto rounded-lg border border-hairline bg-[#0b0c0e] p-3 font-mono text-xs text-foreground/80">
                                      {c.after_snippet ?? "—"}
                                    </pre>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </Panel>
                );
              })}
          </>
        )}
      </PageBody>
    </>
  );
}
