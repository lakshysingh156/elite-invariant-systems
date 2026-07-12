import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Github, Check, GitPullRequest, ShieldCheck } from "lucide-react";
import { PageHeader, PageBody, Panel } from "@/components/dashboard/page-shell";
import { SeverityPill } from "@/components/ui-kit/status-badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_dashboard/github")({
  head: () => ({ meta: [{ title: "GitHub Integration — Invariant." }] }),
  component: GithubPage,
});

const repos = [
  { name: "acme/payments-service", enabled: true, prs: 3 },
  { name: "acme/checkout-web", enabled: true, prs: 1 },
  { name: "acme/orders-api", enabled: true, prs: 0 },
  { name: "acme/receipts-worker", enabled: false, prs: 0 },
  { name: "acme/search-service", enabled: false, prs: 0 },
];

function GithubPage() {
  const [state, setState] = useState(repos);
  return (
    <>
      <PageHeader
        title="GitHub Integration"
        description="Review-time contract enforcement on every pull request."
      />
      <PageBody className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Panel className="p-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="h-2 w-2 rounded-full bg-stable live-dot" />
              Connection status
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Github className="h-5 w-5" />
              <span className="font-mono text-sm">acme-engineering</span>
            </div>
            <div className="mt-1 font-mono text-xs text-stable">Installed · healthy</div>
          </Panel>
          <Panel className="p-4">
            <div className="text-sm text-muted-foreground">PRs reviewed (30d)</div>
            <div className="mt-2 font-mono text-2xl font-semibold">128</div>
            <div className="font-mono text-xs text-muted-foreground">
              14 flagged breaking
            </div>
          </Panel>
          <Panel className="p-4">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4" /> Permissions
            </div>
            <div className="mt-2 space-y-1 font-mono text-xs text-muted-foreground">
              <div>contents: read</div>
              <div>pull_requests: write</div>
              <div>checks: write</div>
            </div>
          </Panel>
        </div>

        <Panel title="Sample PR contract review">
          <div className="p-4">
            <div className="flex items-center gap-2 font-mono text-sm">
              <GitPullRequest className="h-4 w-4 text-analyzing" />
              <span>#482 Update charge serialization</span>
              <span className="ml-auto rounded bg-breaking/15 px-2 py-0.5 text-xs text-breaking">
                risk 8.4
              </span>
            </div>
            <div className="mt-3 rounded-lg border border-hairline bg-[#0b0c0e] p-3 font-mono text-xs leading-6">
              <div className="text-signal">
                🛡 Invariant detected 1 breaking contract change
              </div>
              <div className="mt-2 flex items-center gap-2 text-foreground/80">
                <SeverityPill severity="breaking" />
                <span>response.amount changed integer → string</span>
              </div>
              <div className="mt-1 text-muted-foreground">
                Blast radius: 3 services · 12 endpoints. Recommend a versioned
                rollout.
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="Watched repositories">
          <div className="divide-y divide-hairline">
            {state.map((r, i) => (
              <div key={r.name} className="flex items-center gap-3 px-4 py-3.5">
                <Github className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-sm">{r.name}</span>
                {r.prs > 0 && (
                  <span className="rounded-full bg-analyzing/15 px-2 py-0.5 font-mono text-[11px] text-analyzing">
                    {r.prs} open PRs
                  </span>
                )}
                <button
                  onClick={() =>
                    setState((s) =>
                      s.map((x, j) => (j === i ? { ...x, enabled: !x.enabled } : x)),
                    )
                  }
                  className={cn(
                    "ml-auto inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors",
                    r.enabled
                      ? "border-stable/30 bg-stable/10 text-stable"
                      : "border-hairline bg-secondary text-muted-foreground hover:text-foreground",
                  )}
                >
                  {r.enabled && <Check className="h-3 w-3" />}
                  {r.enabled ? "Enabled" : "Enable"}
                </button>
              </div>
            ))}
          </div>
        </Panel>
      </PageBody>
    </>
  );
}
