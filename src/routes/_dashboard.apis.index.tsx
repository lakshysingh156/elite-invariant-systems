import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Boxes } from "lucide-react";
import { PageHeader, PageBody } from "@/components/dashboard/page-shell";
import { DataTable, type Column } from "@/components/ui-kit/data-table";
import { StatusBadge } from "@/components/ui-kit/status-badge";
import { GenomeRing } from "@/components/ui-kit/metrics";
import { apis } from "@/data/apis";
import type { ApiRecord } from "@/types";
import { timeAgo } from "@/lib/format";

export const Route = createFileRoute("/_dashboard/apis/")({
  head: () => ({ meta: [{ title: "API Inventory — Invariant." }] }),
  component: ApiInventory,
});

const methodTone = (kind: string) =>
  kind === "internal" ? "text-analyzing" : "text-drift";

function ApiInventory() {
  const navigate = useNavigate();

  const columns: Column<ApiRecord>[] = [
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
              {r.baseUrl.replace(/^https?:\/\//, "")}
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
        <span className={`font-mono text-xs ${methodTone(r.kind)}`}>
          {r.kind}
        </span>
      ),
    },
    {
      key: "team",
      header: "Team",
      sortValue: (r) => r.owningTeam,
      render: (r) => (
        <span className="text-muted-foreground">{r.owningTeam}</span>
      ),
      defaultHidden: false,
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
            r.genome >= 90
              ? "text-stable"
              : r.genome >= 75
                ? "text-drift"
                : "text-breaking"
          }
        >
          {r.genome}
        </span>
      ),
    },
    {
      key: "endpoints",
      header: "Endpoints",
      mono: true,
      align: "right",
      sortValue: (r) => r.endpointCount,
      render: (r) => (
        <span className="text-muted-foreground">{r.endpointCount}</span>
      ),
    },
    {
      key: "incidents",
      header: "Open",
      mono: true,
      align: "right",
      sortValue: (r) => r.openIncidents,
      render: (r) => (
        <span className={r.openIncidents ? "text-breaking" : "text-muted-foreground"}>
          {r.openIncidents}
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
      sortValue: (r) => r.lastChecked,
      render: (r) => (
        <span className="text-xs text-muted-foreground">
          {timeAgo(r.lastChecked)}
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="API Inventory"
        description="Every API your org tracks — the single source of truth."
        actions={
          <button className="inline-flex items-center gap-1.5 rounded-lg bg-signal px-3 py-2 text-sm font-medium text-signal-foreground transition-transform hover:scale-[1.02]">
            <Boxes className="h-4 w-4" /> Register API
          </button>
        }
      />
      <PageBody>
        <DataTable
          data={apis}
          columns={columns}
          searchKeys={(r) => `${r.name} ${r.baseUrl} ${r.owningTeam} ${r.tags.join(" ")}`}
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
      </PageBody>
    </>
  );
}
