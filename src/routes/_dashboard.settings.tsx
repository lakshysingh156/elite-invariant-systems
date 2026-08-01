import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, ShieldAlert, Check } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, PageBody, Panel } from "@/components/dashboard/page-shell";
import { getWorkspaceSettings, renameWorkspace } from "@/lib/workspace.functions";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_dashboard/settings")({
  head: () => ({
    meta: [
      { title: "Workspace Settings — Invariant." },
      {
        name: "description",
        content: "Manage your Invariant workspace, members, and integrations.",
      },
    ],
  }),
  component: Settings,
});

const tabs = ["Workspace", "Members", "Integrations"] as const;
type Tab = (typeof tabs)[number];

function Settings() {
  const [tab, setTab] = useState<Tab>("Workspace");
  const qc = useQueryClient();
  const fn = useServerFn(getWorkspaceSettings);
  const renameFn = useServerFn(renameWorkspace);

  const { data, isLoading } = useQuery({
    queryKey: ["workspace-settings"],
    queryFn: () => fn(),
  });
  const [name, setName] = useState<string | null>(null);

  const rename = useMutation({
    mutationFn: (n: string) => renameFn({ data: { name: n } }),
    onSuccess: () => {
      toast.success("Workspace renamed");
      qc.invalidateQueries({ queryKey: ["workspace-settings"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Rename failed"),
  });

  if (isLoading || !data) {
    return (
      <PageBody>
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading workspace…
        </div>
      </PageBody>
    );
  }

  const orgName = name ?? data.org?.name ?? "";

  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage your organization and workspace."
        actions={
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "/";
            }}
            className="rounded-lg border border-hairline bg-surface px-3 py-2 text-xs hover:bg-surface-raised"
          >
            Sign out
          </button>
        }
      />
      <PageBody className="space-y-6">
        <div className="flex gap-1 border-b border-hairline">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "relative px-3 py-2.5 text-sm transition-colors",
                tab === t ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t}
              {tab === t && (
                <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-signal" />
              )}
            </button>
          ))}
        </div>

        {tab === "Workspace" && (
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Organization" className="p-0">
              <div className="space-y-4 p-4">
                <div>
                  <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    Name
                  </label>
                  <input
                    value={orgName}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-hairline bg-background px-3 py-2 text-sm outline-none focus:border-signal/50"
                  />
                </div>
                <div className="font-mono text-xs text-muted-foreground">
                  slug · {data.org?.slug} · your role · {data.myRole}
                </div>
                <button
                  disabled={rename.isPending || !orgName.trim()}
                  onClick={() => rename.mutate(orgName.trim())}
                  className="inline-flex items-center gap-2 rounded-lg bg-signal px-3 py-2 text-xs font-medium text-background disabled:opacity-50"
                >
                  {rename.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  Save changes
                </button>
              </div>
            </Panel>

            <Panel title="Account" className="p-0">
              <div className="space-y-3 p-4 text-sm">
                <Row label="Signed in as" value={data.me.email ?? data.me.id} />
                <Row label="APIs tracked" value={String(data.stats.apiCount)} />
                <Row label="Dependencies mapped" value={String(data.stats.depCount)} />
              </div>
            </Panel>
          </div>
        )}

        {tab === "Members" && (
          <Panel title={`Members · ${data.members.length}`}>
            <div className="divide-y divide-hairline">
              {data.members.map((m: any) => (
                <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-hairline bg-surface font-mono text-[11px]">
                    {(m.isMe ? (data.me.email ?? "me") : m.user_id).slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm">
                      {m.isMe ? (data.me.email ?? "You") : m.user_id}
                      {m.isMe && (
                        <span className="ml-2 font-mono text-[10px] uppercase text-muted-foreground">
                          you
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-[11px] text-muted-foreground">
                      joined {new Date(m.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <span className="rounded-md border border-hairline bg-secondary px-2 py-0.5 font-mono text-[11px] uppercase">
                    {m.role}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 border-t border-hairline px-4 py-3 text-xs text-muted-foreground">
              <ShieldAlert className="h-3.5 w-3.5" />
              Invites are issued by workspace owners — email invitations arrive in a later release.
            </div>
          </Panel>
        )}

        {tab === "Integrations" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <IntegrationCard
              name="OpenAPI upload"
              detail="Upload specs manually from the API detail page."
              status="Active"
            />
            <IntegrationCard
              name="GitHub PR checks"
              detail="Contract enforcement on every pull request."
              status="Not connected"
            />
            <IntegrationCard
              name="AI Copilot"
              detail="Grounded reasoning over your workspace data."
              status="Active"
            />
            <IntegrationCard
              name="Runtime monitors"
              detail="Scheduled drift probes against live endpoints."
              status="Not connected"
            />
          </div>
        )}
      </PageBody>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate font-mono text-xs">{value}</span>
    </div>
  );
}

function IntegrationCard({
  name,
  detail,
  status,
}: {
  name: string;
  detail: string;
  status: string;
}) {
  const active = status === "Active";
  return (
    <Panel className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium">{name}</div>
          <div className="mt-1 text-xs text-muted-foreground">{detail}</div>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-md border px-2 py-0.5 font-mono text-[10px] uppercase",
            active
              ? "border-stable/40 bg-stable/10 text-stable"
              : "border-hairline bg-secondary text-muted-foreground",
          )}
        >
          {status}
        </span>
      </div>
    </Panel>
  );
}
