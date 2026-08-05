import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Github, Check, GitPullRequest, ShieldCheck, ExternalLink, Loader2 } from "lucide-react";
import { PageHeader, PageBody, Panel } from "@/components/dashboard/page-shell";
import { SeverityPill } from "@/components/ui-kit/status-badge";
import { timeAgo } from "@/lib/format";
import { getGithubOverview } from "@/lib/apis.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_dashboard/github")({
  head: () => ({ meta: [{ title: "GitHub Integration — Invariant." }] }),
  component: GithubPage,
});

function GithubPage() {
  const overviewFn = useServerFn(getGithubOverview);
  const { data, isLoading } = useQuery({
    queryKey: ["github-overview"],
    queryFn: () => overviewFn(),
  });

  const apis: any[] = data?.apis ?? [];
  const prs: any[] = data?.prs ?? [];

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
              <span className="font-mono text-sm">
                {data?.connectedRepos ?? 0} repo{(data?.connectedRepos ?? 0) === 1 ? "" : "s"} linked
              </span>
            </div>
            <div className="mt-1 font-mono text-xs text-stable">Token installed · healthy</div>
          </Panel>
          <Panel className="p-4">
            <div className="text-sm text-muted-foreground">PRs opened by Invariant</div>
            <div className="mt-2 font-mono text-2xl font-semibold">{data?.prCount ?? 0}</div>
            <div className="font-mono text-xs text-muted-foreground">
              {data?.criticalCount ?? 0} flagged breaking
            </div>
          </Panel>
          <Panel className="p-4">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4" /> Permissions
            </div>
            <div className="mt-2 space-y-1 font-mono text-xs text-muted-foreground">
              <div>contents: read/write</div>
              <div>pull_requests: write</div>
              <div>metadata: read</div>
            </div>
          </Panel>
        </div>

        <Panel title="Pull requests opened for breaking changes">
          {isLoading ? (
            <div className="flex items-center justify-center px-4 py-12 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : prs.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-muted-foreground">
              No pull requests yet — link a repo to an API and we'll open one on the next breaking
              change.
            </div>
          ) : (
            <div className="divide-y divide-hairline">
              {prs.map((p) => (
                <a
                  key={p.id}
                  href={p.github_pr_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface-raised/60"
                >
                  <GitPullRequest className="h-4 w-4 text-analyzing" />
                  <span className="font-mono text-sm">#{p.github_pr_number}</span>
                  <span className="text-sm">{p.api_name}</span>
                  <SeverityPill severity={p.severity === "critical" ? "breaking" : "risky"} />
                  <span className="ml-auto font-mono text-xs text-muted-foreground">
                    {timeAgo(p.opened_at)}
                  </span>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                </a>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Watched repositories">
          {isLoading ? (
            <div className="flex items-center justify-center px-4 py-12 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : apis.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-muted-foreground">
              No APIs registered yet.
            </div>
          ) : (
            <div className="divide-y divide-hairline">
              {apis.map((a) => (
                <div key={a.id} className="flex items-center gap-3 px-4 py-3.5">
                  <Github className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono text-sm">{a.github_repo ?? a.name}</span>
                  {!a.github_repo && (
                    <span className="font-mono text-xs text-muted-foreground">
                      no repo configured
                    </span>
                  )}
                  <span
                    className={cn(
                      "ml-auto inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs",
                      a.github_repo
                        ? "border-stable/30 bg-stable/10 text-stable"
                        : "border-hairline bg-secondary text-muted-foreground",
                    )}
                  >
                    {a.github_repo && <Check className="h-3 w-3" />}
                    {a.github_repo ? "Connected" : "Not linked"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </PageBody>
    </>
  );
}
