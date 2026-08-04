import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, PageBody, Panel } from "@/components/dashboard/page-shell";
import { StatusBadge, SeverityPill } from "@/components/ui-kit/status-badge";
import { GenomeRing } from "@/components/ui-kit/metrics";
import { getApiDetail, submitSpecVersion, updateApiSettings } from "@/lib/apis.functions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { timeAgo, shortDate } from "@/lib/format";

export const Route = createFileRoute("/_dashboard/apis/$apiId")({
  head: () => ({ meta: [{ title: "API — Invariant." }] }),
  notFoundComponent: () => (
    <PageBody>
      <div className="text-sm text-muted-foreground">API not found.</div>
    </PageBody>
  ),
  component: ApiDetail,
});

const tabs = ["Endpoints", "Versions", "Contract Changes"] as const;
type Tab = (typeof tabs)[number];

const methodColor: Record<string, string> = {
  GET: "text-stable",
  POST: "text-analyzing",
  PUT: "text-drift",
  PATCH: "text-drift",
  DELETE: "text-breaking",
};

function ApiDetail() {
  const { apiId } = Route.useParams();
  const detailFn = useServerFn(getApiDetail);
  const { data, isLoading } = useQuery({
    queryKey: ["api-detail", apiId],
    queryFn: () => detailFn({ data: { apiId } }),
  });
  const [tab, setTab] = useState<Tab>("Endpoints");
  const qc = useQueryClient();
  const submitFn = useServerFn(submitSpecVersion);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [specText, setSpecText] = useState("");
  const [versionLabel, setVersionLabel] = useState("");
  const [specUrl, setSpecUrl] = useState<string | null>(null);
  const settingsFn = useServerFn(updateApiSettings);

  const saveSpecUrl = useMutation({
    mutationFn: (value: string) =>
      settingsFn({ data: { apiId, specUrl: value.trim() || null } }),
    onSuccess: () => {
      toast.success("Spec URL saved — automatic monitoring will use it");
      qc.invalidateQueries({ queryKey: ["api-detail", apiId] });
      qc.invalidateQueries({ queryKey: ["apis"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to save spec URL"),
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      submitFn({ data: { apiId, specText, versionLabel: versionLabel || undefined } }),
    onSuccess: (res: any) => {
      setUploadOpen(false);
      setSpecText("");
      setVersionLabel("");
      setTab("Contract Changes");
      toast.success(`Version ${res.versionLabel} analyzed`, {
        description: `${res.summary.breaking} breaking · ${res.summary.risky} risky · ${res.summary.safe} safe`,
      });
      qc.invalidateQueries({ queryKey: ["api-detail", apiId] });
      qc.invalidateQueries({ queryKey: ["apis"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to analyze spec"),
  });

  async function onFile(file: File | undefined) {
    if (!file) return;
    setSpecText(await file.text());
  }

  if (isLoading) {
    return (
      <PageBody>
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
        </div>
      </PageBody>
    );
  }
  if (!data) throw notFound();
  const { api, versions, changes, endpoints } = data as any;

  return (
    <>
      <PageHeader
        eyebrow={api.owning_team ?? undefined}
        title={api.name}
        description={api.base_url}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSpecUrl(api.spec_url ?? "");
                setUploadOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <Upload className="h-4 w-4" /> Upload new spec version
            </button>
            <Link
              to="/apis"
              className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Inventory
            </Link>
          </div>
        }
      />
      <PageBody className="space-y-6">
        <div className="grid gap-4 rounded-xl border border-hairline bg-surface/60 p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center">
          <div className="flex items-center gap-4">
            <GenomeRing score={api.genome} size={68} stroke={5} />
            <div>
              <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Genome score</div>
              <div className="mt-1 flex items-center gap-2">
                <StatusBadge status={api.status} pulse={api.status !== "stable"} />
                <span className="font-mono text-xs text-muted-foreground">{api.kind}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center sm:col-start-3 sm:gap-6">
            {[
              { l: "Endpoints", v: endpoints.length },
              { l: "Versions", v: versions.length },
              { l: "Interval", v: api.monitor_interval },
            ].map((s) => (
              <div key={s.l}>
                <div className="font-mono text-lg font-semibold tabular-nums">{s.v}</div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

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
              {tab === t && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-brand" />}
            </button>
          ))}
        </div>

        {tab === "Endpoints" && (
          <Panel>
            {endpoints.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                No endpoints yet — upload an OpenAPI spec from the API Inventory.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-hairline">
                  <tr className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground/70">
                    <th className="px-4 py-2.5 text-left">Method</th>
                    <th className="px-4 py-2.5 text-left">Path</th>
                    <th className="px-4 py-2.5 text-left">Operation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {endpoints.map((e: any) => (
                    <tr key={e.id} className="hover:bg-surface-raised/60">
                      <td className={cn("px-4 py-3 font-mono font-semibold", methodColor[e.method])}>{e.method}</td>
                      <td className="px-4 py-3 font-mono">{e.path}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{e.operation_id ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>
        )}

        {tab === "Versions" && (
          <Panel>
            {versions.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-muted-foreground">No versions yet.</div>
            ) : (
              <div className="divide-y divide-hairline">
                {versions.map((v: any) => (
                  <div key={v.id} className="flex items-center gap-4 px-4 py-3.5">
                    <div className="font-mono text-sm font-medium">{v.version}</div>
                    {v.is_current && (
                      <span className="rounded-full bg-brand/15 px-2 py-0.5 font-mono text-[10px] uppercase text-brand ring-1 ring-inset ring-brand/25">
                        current
                      </span>
                    )}
                    <div className="ml-auto flex items-center gap-4 font-mono text-xs text-muted-foreground">
                      <span>{v.endpoint_count} endpoints</span>
                      <span>{v.change_count} changes</span>
                      {v.breaking_count > 0 && <span className="text-breaking">{v.breaking_count} breaking</span>}
                      <span>{shortDate(v.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        )}

        {tab === "Contract Changes" && (
          <Panel>
            {changes.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                No contract changes detected. Upload a new spec version to trigger a diff.
              </div>
            ) : (
              <div className="divide-y divide-hairline">
                {changes.map((c: any) => (
                  <div key={c.id} className="flex items-start gap-3 px-4 py-3.5">
                    <SeverityPill severity={c.severity} />
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-sm text-foreground/90">{c.target}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{c.summary}</div>
                    </div>
                    <div className="font-mono text-xs text-muted-foreground">{timeAgo(c.created_at)}</div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        )}
      </PageBody>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload new spec version</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="version-label">Version label (optional)</Label>
              <Input
                id="version-label"
                placeholder="2026-08-01"
                value={versionLabel}
                onChange={(e) => setVersionLabel(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="spec-url">Live spec URL (optional)</Label>
              <div className="flex gap-2">
                <Input
                  id="spec-url"
                  placeholder="https://api.example.com/openapi.json"
                  value={specUrl ?? ""}
                  onChange={(e) => setSpecUrl(e.target.value)}
                />
                <button
                  type="button"
                  disabled={saveSpecUrl.isPending}
                  onClick={() => saveSpecUrl.mutate(specUrl ?? "")}
                  className="shrink-0 rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  Save
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Where the live OpenAPI JSON is served. Saved separately — we re-check it on your
                monitor interval.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="spec-file">Spec file</Label>
              <Input
                id="spec-file"
                type="file"
                accept=".json,application/json"
                onChange={(e) => void onFile(e.target.files?.[0])}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="spec-text">Or paste JSON OpenAPI</Label>
              <textarea
                id="spec-text"
                value={specText}
                onChange={(e) => setSpecText(e.target.value)}
                rows={12}
                spellCheck={false}
                placeholder='{ "openapi": "3.0.0", "paths": { ... } }'
                className="w-full rounded-lg border border-hairline bg-surface px-3 py-2 font-mono text-xs outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              disabled={!specText.trim() || submitMutation.isPending}
              onClick={() => submitMutation.mutate()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-brand-foreground disabled:opacity-50"
            >
              {submitMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Analyze &amp; save version
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
