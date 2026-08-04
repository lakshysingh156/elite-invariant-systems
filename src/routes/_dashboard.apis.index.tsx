import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Boxes, Upload, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, PageBody } from "@/components/dashboard/page-shell";
import { DataTable, type Column } from "@/components/ui-kit/data-table";
import { StatusBadge } from "@/components/ui-kit/status-badge";
import { GenomeRing } from "@/components/ui-kit/metrics";
import { timeAgo } from "@/lib/format";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { listApis, createApi, submitSpecVersion } from "@/lib/apis.functions";

export const Route = createFileRoute("/_dashboard/apis/")({
  head: () => ({ meta: [{ title: "API Inventory — Invariant." }] }),
  component: ApiInventory,
});

type ApiRow = {
  id: string;
  name: string;
  base_url: string;
  kind: "internal" | "third-party";
  tags: string[] | null;
  owning_team: string | null;
  monitor_interval: string;
  status: "stable" | "drifting" | "breaking" | "analyzing";
  genome: number;
  current_version_id: string | null;
  last_checked: string | null;
  updated_at: string;
};

function ApiInventory() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const listFn = useServerFn(listApis);
  const createFn = useServerFn(createApi);
  const uploadFn = useServerFn(submitSpecVersion);

  const { data: apis = [], isLoading } = useQuery({
    queryKey: ["apis"],
    queryFn: () => listFn(),
  });

  const [registerOpen, setRegisterOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    baseUrl: "",
    kind: "internal" as "internal" | "third-party",
    owningTeam: "",
    monitorInterval: "15m",
    tags: "",
  });

  const createMut = useMutation({
    mutationFn: async () => {
      return createFn({
        data: {
          name: form.name,
          baseUrl: form.baseUrl,
          kind: form.kind,
          owningTeam: form.owningTeam || undefined,
          monitorInterval: form.monitorInterval as "5m" | "15m" | "1h" | "6h" | "24h",
          tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        },
      });
    },
    onSuccess: (res) => {
      toast.success("API registered");
      qc.invalidateQueries({ queryKey: ["apis"] });
      setRegisterOpen(false);
      setForm({ name: "", baseUrl: "", kind: "internal", owningTeam: "", monitorInterval: "15m", tags: "" });
      setUploadOpen(res.id);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed"),
  });

  const fileRef = useRef<HTMLInputElement>(null);
  const [versionLabel, setVersionLabel] = useState("");
  const [specText, setSpecText] = useState("");

  const uploadMut = useMutation({
    mutationFn: async () => {
      if (!uploadOpen) throw new Error("No API selected");
      return uploadFn({
        data: {
          apiId: uploadOpen,
          specText,
          versionLabel: versionLabel || undefined,
        },
      });
    },
    onSuccess: (res) => {
      toast.success(
        `Version ${res.versionLabel} analysed — ${res.summary.breaking} breaking, ${res.summary.risky} risky, ${res.summary.safe} safe`,
      );
      qc.invalidateQueries({ queryKey: ["apis"] });
      qc.invalidateQueries({ queryKey: ["api-detail"] });
      setUploadOpen(null);
      setSpecText("");
      setVersionLabel("");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Upload failed"),
  });

  const onFile = async (f: File | null) => {
    if (!f) return;
    const text = await f.text();
    setSpecText(text);
    if (!versionLabel) setVersionLabel(f.name.replace(/\.(json|ya?ml)$/i, ""));
  };

  const columns: Column<ApiRow>[] = [
    {
      key: "name",
      header: "API",
      sortValue: (r) => r.name,
      render: (r) => (
        <div className="flex items-center gap-3">
          <GenomeRing score={r.genome} size={34} stroke={3} showLabel={false} />
          <div>
            <div className="font-medium">{r.name}</div>
            <div className="font-mono text-xs text-muted-foreground">
              {r.base_url.replace(/^https?:\/\//, "")}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "kind",
      header: "Type",
      sortValue: (r) => r.kind,
      render: (r) => (
        <span className={r.kind === "internal" ? "text-analyzing font-mono text-xs" : "text-drift font-mono text-xs"}>
          {r.kind}
        </span>
      ),
    },
    {
      key: "team",
      header: "Team",
      sortValue: (r) => r.owning_team ?? "",
      render: (r) => <span className="text-muted-foreground">{r.owning_team ?? "—"}</span>,
    },
    {
      key: "genome",
      header: "Genome",
      mono: true,
      align: "right",
      sortValue: (r) => r.genome,
      render: (r) => (
        <span
          className={
            r.genome >= 90 ? "text-stable" : r.genome >= 75 ? "text-drift" : "text-breaking"
          }
        >
          {r.genome}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortValue: (r) => r.status,
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: "checked",
      header: "Last checked",
      mono: true,
      align: "right",
      sortValue: (r) => r.last_checked ?? "",
      render: (r) => (
        <span className="text-xs text-muted-foreground">
          {r.last_checked ? timeAgo(r.last_checked) : "never"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setUploadOpen(r.id);
          }}
          className="inline-flex items-center gap-1 rounded-md border border-hairline px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <Upload className="h-3 w-3" /> Upload spec
        </button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="API Inventory"
        description="Every API your workspace tracks — the single source of truth."
        actions={
          <button
            onClick={() => setRegisterOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-brand-foreground transition-transform hover:scale-[1.02]"
          >
            <Plus className="h-4 w-4" /> Register API
          </button>
        }
      />
      <PageBody>
        {isLoading ? (
          <div className="flex items-center justify-center py-24 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : apis.length === 0 ? (
          <div className="rounded-xl border border-hairline bg-surface/60 py-16 text-center">
            <Boxes className="mx-auto h-8 w-8 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No APIs registered yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Register your first API and upload an OpenAPI spec to start tracking contract drift.
            </p>
            <button
              onClick={() => setRegisterOpen(true)}
              className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground"
            >
              <Plus className="h-4 w-4" /> Register your first API
            </button>
          </div>
        ) : (
          <DataTable
            data={apis as ApiRow[]}
            columns={columns}
            searchKeys={(r) =>
              `${r.name} ${r.base_url} ${r.owning_team ?? ""} ${(r.tags ?? []).join(" ")}`
            }
            searchPlaceholder="Search APIs by name, URL, team, tag…"
            onRowClick={(r) => navigate({ to: "/apis/$apiId", params: { apiId: r.id } })}
            filters={[
              {
                key: "kind",
                label: "Type",
                options: ["internal", "third-party"],
                match: (row, v) => row.kind === v,
              },
              {
                key: "status",
                label: "Status",
                options: ["stable", "drifting", "breaking", "analyzing"],
                match: (row, v) => row.status === v,
              },
            ]}
          />
        )}
      </PageBody>

      {/* Register API dialog */}
      <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Register a new API</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Payments Gateway" />
            </div>
            <div>
              <Label>Base URL</Label>
              <Input value={form.baseUrl} onChange={(e) => setForm({ ...form, baseUrl: e.target.value })} placeholder="https://api.stripe.com/v1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <select
                  value={form.kind}
                  onChange={(e) => setForm({ ...form, kind: e.target.value as "internal" | "third-party" })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="internal">internal</option>
                  <option value="third-party">third-party</option>
                </select>
              </div>
              <div>
                <Label>Owning team</Label>
                <Input value={form.owningTeam} onChange={(e) => setForm({ ...form, owningTeam: e.target.value })} placeholder="Payments" />
              </div>
            </div>
            <div>
              <Label>Monitor interval</Label>
              <select
                value={form.monitorInterval}
                onChange={(e) => setForm({ ...form, monitorInterval: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {["5m", "15m", "1h", "6h", "24h"].map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Tags (comma-separated)</Label>
              <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="payments, vendor, critical" />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => createMut.mutate()}
              disabled={createMut.isPending || !form.name || !form.baseUrl}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground disabled:opacity-70"
            >
              {createMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Register & upload spec
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload spec dialog */}
      <Dialog open={!!uploadOpen} onOpenChange={(v) => !v && setUploadOpen(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload OpenAPI spec</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Version label</Label>
              <Input value={versionLabel} onChange={(e) => setVersionLabel(e.target.value)} placeholder="2026-07-16 or v1.4.0" />
            </div>
            <div>
              <Label>Spec file (JSON)</Label>
              <input
                ref={fileRef}
                type="file"
                accept=".json,application/json"
                onChange={(e) => onFile(e.target.files?.[0] ?? null)}
                className="mt-1 block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-accent"
              />
            </div>
            <div>
              <Label>Or paste JSON</Label>
              <textarea
                value={specText}
                onChange={(e) => setSpecText(e.target.value)}
                placeholder={'{"openapi":"3.0.0", ...}'}
                rows={8}
                className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              We'll parse the spec, diff it against the current version, classify every change as
              <span className="text-breaking"> breaking</span>,
              <span className="text-drift"> risky</span>, or
              <span className="text-stable"> safe</span>, and auto-open incidents for anything breaking.
            </p>
          </div>
          <DialogFooter>
            <button
              onClick={() => uploadMut.mutate()}
              disabled={uploadMut.isPending || !specText}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground disabled:opacity-70"
            >
              {uploadMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Analyse spec
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
