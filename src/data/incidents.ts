import type { Incident } from "@/types";

export const incidents: Incident[] = [
  {
    id: "inc-231",
    code: "INV-231",
    title: "Stripe /charges response contract broke payment capture",
    api: "Stripe Payments",
    severity: "critical",
    status: "mitigating",
    openedAt: "2026-07-12T03:42:00Z",
    updatedAt: "2026-07-12T03:45:00Z",
    assignee: "Maya Chen",
    affectedServices: 3,
    affectedEndpoints: 12,
    rootCause:
      "Stripe removed `outcome.seller_message` and changed `amount` from integer to string on POST /charges.",
    summary:
      "A breaking change in the Stripe Payments contract propagated to the payment, checkout, and receipt services. Blast radius analysis identified 12 downstream endpoints.",
    timeline: [
      {
        at: "2026-07-12T03:42:00Z",
        kind: "breaking",
        label: "Contract change detected",
        detail: "3 breaking changes on POST /charges",
      },
      {
        at: "2026-07-12T03:42:20Z",
        kind: "analyzing",
        label: "Blast radius computed",
        detail: "3 services · 12 endpoints affected",
      },
      {
        at: "2026-07-12T03:43:00Z",
        kind: "analyzing",
        label: "Copilot root-cause analysis",
        detail: "Correlated with change INV-C231",
      },
      {
        at: "2026-07-12T03:45:00Z",
        kind: "drift",
        label: "Mitigation in progress",
        detail: "Draft patch PR opened on payments-service",
      },
    ],
  },
  {
    id: "inc-230",
    code: "INV-230",
    title: "Search Service latency baseline breach",
    api: "Search Service",
    severity: "high",
    status: "analyzing",
    openedAt: "2026-07-12T08:12:00Z",
    updatedAt: "2026-07-12T08:20:00Z",
    assignee: "Diego Ruiz",
    affectedServices: 2,
    affectedEndpoints: 4,
    summary:
      "GET /search p95 latency climbed to 631ms, +4.4σ above the 7-day rolling baseline. Correlated with an index rebuild window.",
    timeline: [
      {
        at: "2026-07-12T08:12:00Z",
        kind: "drift",
        label: "Latency drift detected",
        detail: "p95 631ms vs 142ms baseline",
      },
      {
        at: "2026-07-12T08:14:00Z",
        kind: "analyzing",
        label: "Correlation in progress",
      },
    ],
  },
  {
    id: "inc-229",
    code: "INV-229",
    title: "Twilio error-rate spike on POST /Messages",
    api: "Twilio Messaging",
    severity: "medium",
    status: "identified",
    openedAt: "2026-07-12T07:05:00Z",
    updatedAt: "2026-07-12T07:40:00Z",
    assignee: "Priya Nair",
    affectedServices: 1,
    affectedEndpoints: 2,
    rootCause: "Vendor-side throttling change reduced burst allowance.",
    summary:
      "Error rate rose to 3.1% (+3.2σ). Identified as a vendor throttling policy change; retry backoff adjustment recommended.",
    timeline: [
      {
        at: "2026-07-12T07:05:00Z",
        kind: "drift",
        label: "Error-rate drift detected",
      },
      {
        at: "2026-07-12T07:40:00Z",
        kind: "analyzing",
        label: "Root cause identified",
        detail: "Vendor throttling change",
      },
    ],
  },
  {
    id: "inc-224",
    code: "INV-224",
    title: "Billing Core webhook signature rotation",
    api: "Billing Core",
    severity: "low",
    status: "resolved",
    openedAt: "2026-07-09T14:00:00Z",
    updatedAt: "2026-07-09T15:10:00Z",
    assignee: "Maya Chen",
    affectedServices: 1,
    affectedEndpoints: 1,
    rootCause: "Planned secret rotation not propagated to one consumer.",
    summary:
      "Signature verification failures after a planned rotation. Resolved by redeploying the receipts worker with the new secret.",
    timeline: [
      {
        at: "2026-07-09T14:00:00Z",
        kind: "breaking",
        label: "Auth drift detected",
      },
      {
        at: "2026-07-09T14:30:00Z",
        kind: "analyzing",
        label: "Root cause identified",
      },
      {
        at: "2026-07-09T15:10:00Z",
        kind: "stable",
        label: "Resolved",
        detail: "Receipts worker redeployed",
      },
    ],
  },
  {
    id: "inc-221",
    code: "INV-221",
    title: "Shipping API rate enum expansion",
    api: "Shipping API",
    severity: "low",
    status: "resolved",
    openedAt: "2026-07-06T11:20:00Z",
    updatedAt: "2026-07-06T12:00:00Z",
    assignee: "Diego Ruiz",
    affectedServices: 1,
    affectedEndpoints: 1,
    rootCause: "New currency enum value added by vendor — non-breaking.",
    summary:
      "A new enum value appeared on GET /rates. Classified safe after Copilot confirmed no consumer relied on exhaustive matching.",
    timeline: [
      {
        at: "2026-07-06T11:20:00Z",
        kind: "analyzing",
        label: "Change detected",
      },
      {
        at: "2026-07-06T12:00:00Z",
        kind: "stable",
        label: "Resolved — classified safe",
      },
    ],
  },
];

export const getIncident = (id: string) =>
  incidents.find((i) => i.id === id || i.code.toLowerCase() === id.toLowerCase());
