// Core domain types for Invariant. — mirrors the V5 spec entities.

export type Severity = "breaking" | "risky" | "safe";
export type StatusKind = "stable" | "drift" | "breaking" | "analyzing";
export type ApiStatus = "stable" | "drifting" | "breaking" | "analyzing";
export type ApiKind = "internal" | "third-party";

export interface ApiRecord {
  id: string;
  name: string;
  baseUrl: string;
  kind: ApiKind;
  tags: string[];
  owningTeam: string;
  genome: number; // 0-100 stability score
  genomeTrend: number[]; // sparkline
  status: ApiStatus;
  endpointCount: number;
  currentVersion: string;
  openIncidents: number;
  lastChecked: string; // ISO
  monitorInterval: string;
}

export interface EndpointRecord {
  id: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  status: ApiStatus;
  p95: number; // ms
  errorRate: number; // %
  consumers: number;
  lastChange: string | null;
}

export interface VersionRecord {
  id: string;
  version: string;
  createdAt: string;
  endpointCount: number;
  isCurrent: boolean;
  changeCount: number;
  breakingCount: number;
  source: string;
}

export interface ChangeRecord {
  id: string;
  severity: Severity;
  kind: "added" | "removed" | "modified";
  target: string; // endpoint or field path
  summary: string;
  before?: string;
  after?: string;
}

export interface DriftEvent {
  id: string;
  apiId: string;
  apiName: string;
  endpoint: string;
  type: "schema" | "latency" | "error-rate" | "auth";
  confidence: number; // 0-1
  detectedAt: string;
  baseline: string;
  observed: string;
  deviation: string;
  status: StatusKind;
}

export type IncidentStatus =
  | "detected"
  | "analyzing"
  | "identified"
  | "mitigating"
  | "resolved";
export type IncidentSeverity = "critical" | "high" | "medium" | "low";

export interface Incident {
  id: string;
  code: string; // INV-231
  title: string;
  api: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  openedAt: string;
  updatedAt: string;
  assignee: string;
  affectedServices: number;
  affectedEndpoints: number;
  rootCause?: string;
  summary: string;
  timeline: IncidentEvent[];
}

export interface IncidentEvent {
  at: string;
  kind: StatusKind;
  label: string;
  detail?: string;
}

export interface GraphNode {
  id: string;
  label: string;
  type: "service" | "api" | "endpoint" | "external";
  status: ApiStatus;
  health: number; // 0-100
}

export interface GraphEdge {
  source: string;
  target: string;
  weight: number;
}

export interface Citation {
  id: string;
  kind: "incident" | "change" | "drift" | "endpoint";
  label: string;
  ref: string;
}

export interface ChatTurn {
  id: string;
  role: "user" | "copilot";
  content: string;
  citations?: Citation[];
  suggestions?: string[];
  fallback?: boolean;
}
