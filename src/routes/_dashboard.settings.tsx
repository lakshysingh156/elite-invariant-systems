import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Copy, Plus, Trash2, ShieldAlert } from "lucide-react";
import { PageHeader, PageBody, Panel } from "@/components/dashboard/page-shell";
import { StatusBadge } from "@/components/ui-kit/status-badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_dashboard/settings")({
  head: () => ({ meta: [{ title: "Settings — Invariant." }] }),
  component: Settings,
});

const tabs = ["Profile", "Members", "Integrations", "API Keys"] as const;
type Tab = (typeof tabs)[number];

const members = [
  { name: "Maya Chen", email: "maya@acme.dev", role: "Owner", status: "stable" as const },
  { name: "Diego Ruiz", email: "diego@acme.dev", role: "Admin", status: "stable" as const },
  { name: "Priya Nair", email: "priya@acme.dev", role: "Member", status: "stable" as const },
  { name: "Sam Okafor", email: "sam@acme.dev", role: "Member", status: "analyzing" as const },
];

const keys = [
  { id: "k1", name: "Production SDK", prefix: "inv_live_a1b2••••", created: "Apr 2, 2026" },
  { id: "k2", name: "CI pipeline", prefix: "inv_ci_9x8y••••", created: "May 18, 2026" },
];

function Settings() {
  const [tab, setTab] = useState<Tab>("Profile");
  return (
    <>
      <PageHeader title="Settings" description="Manage your organization and workspace." />
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

        {tab === "Profile" && (
          <Panel title="Organization profile" className="max-w-2xl">
            <div className="space-y-4 p-5">
              {[
                { l: "Organization name", v: "Acme Inc." },
                { l: "Slug", v: "acme" },
                { l: "Primary team", v: "Platform" },
              ].map((f) => (
                <label key={f.l} className="block">
                  <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    {f.l}
                  </span>
                  <input
                    defaultValue={f.v}
                    className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:border-signal/40 focus:ring-2 focus:ring-signal/10"
                  />
                </label>
              ))}
              <button className="rounded-lg bg-signal px-4 py-2 text-sm font-medium text-signal-foreground">
                Save changes
              </button>
            </div>
          </Panel>
        )}

        {tab === "Members" && (
          <Panel title="Team members">
            <div className="divide-y divide-hairline">
              {members.map((m) => (
                <div key={m.email} className="flex items-center gap-3 px-4 py-3.5">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-analyzing/15 font-mono text-xs text-analyzing ring-1 ring-inset ring-analyzing/25">
                    {m.name.split(" ").map((n) => n[0]).join("")}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{m.name}</div>
                    <div className="font-mono text-xs text-muted-foreground">{m.email}</div>
                  </div>
                  <span className="ml-auto rounded-md bg-secondary px-2 py-1 font-mono text-xs text-muted-foreground">
                    {m.role}
                  </span>
                  <StatusBadge status={m.status} label={m.status === "stable" ? "active" : "pending"} />
                </div>
              ))}
            </div>
          </Panel>
        )}

        {tab === "Integrations" && (
          <div className="grid gap-4 sm:grid-cols-2">
            {["Slack", "Email", "GitHub", "Webhook"].map((s) => (
              <Panel key={s} className="flex items-center justify-between p-4">
                <div>
                  <div className="text-sm font-medium">{s}</div>
                  <div className="font-mono text-xs text-muted-foreground">
                    Alert routing
                  </div>
                </div>
                <StatusBadge status="stable" label="connected" />
              </Panel>
            ))}
          </div>
        )}

        {tab === "API Keys" && (
          <Panel
            title="API keys"
            action={
              <button className="inline-flex items-center gap-1.5 rounded-lg bg-signal px-2.5 py-1.5 text-xs font-medium text-signal-foreground">
                <Plus className="h-3.5 w-3.5" /> New key
              </button>
            }
          >
            <div className="divide-y divide-hairline">
              {keys.map((k) => (
                <div key={k.id} className="flex items-center gap-3 px-4 py-3.5">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{k.name}</div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {k.prefix} · created {k.created}
                    </div>
                  </div>
                  <button className="ml-auto grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-secondary">
                    <Copy className="h-4 w-4" />
                  </button>
                  <button className="grid h-8 w-8 place-items-center rounded-md text-breaking hover:bg-breaking/10">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-start gap-2 border-t border-hairline bg-breaking/5 px-4 py-3 text-xs text-muted-foreground">
              <ShieldAlert className="h-4 w-4 shrink-0 text-breaking" />
              Revoking a key requires typed confirmation and is irreversible.
            </div>
          </Panel>
        )}
      </PageBody>
    </>
  );
}
