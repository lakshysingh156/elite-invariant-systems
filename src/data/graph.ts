import type { GraphNode, GraphEdge } from "@/types";

export const graphNodes: GraphNode[] = [
  { id: "checkout-web", label: "checkout-web", type: "service", status: "breaking", health: 58 },
  { id: "payments-service", label: "payments-service", type: "service", status: "breaking", health: 61 },
  { id: "receipts-worker", label: "receipts-worker", type: "service", status: "drifting", health: 74 },
  { id: "orders-api", label: "orders-api", type: "service", status: "stable", health: 92 },
  { id: "notifications", label: "notifications", type: "service", status: "stable", health: 95 },
  { id: "search-web", label: "search-web", type: "service", status: "drifting", health: 80 },
  { id: "stripe", label: "Stripe /charges", type: "external", status: "breaking", health: 62 },
  { id: "twilio", label: "Twilio /Messages", type: "external", status: "drifting", health: 81 },
  { id: "auth-gw", label: "auth-gateway", type: "api", status: "stable", health: 97 },
  { id: "billing", label: "billing-core", type: "api", status: "stable", health: 94 },
  { id: "search-svc", label: "search-service", type: "api", status: "drifting", health: 88 },
  { id: "shipping", label: "Shippo /rates", type: "external", status: "analyzing", health: 90 },
];

export const graphEdges: GraphEdge[] = [
  { source: "checkout-web", target: "payments-service", weight: 3 },
  { source: "payments-service", target: "stripe", weight: 5 },
  { source: "payments-service", target: "billing", weight: 2 },
  { source: "receipts-worker", target: "billing", weight: 2 },
  { source: "receipts-worker", target: "stripe", weight: 1 },
  { source: "orders-api", target: "payments-service", weight: 2 },
  { source: "orders-api", target: "shipping", weight: 1 },
  { source: "notifications", target: "twilio", weight: 3 },
  { source: "checkout-web", target: "auth-gw", weight: 1 },
  { source: "orders-api", target: "auth-gw", weight: 1 },
  { source: "search-web", target: "search-svc", weight: 3 },
  { source: "search-svc", target: "auth-gw", weight: 1 },
  { source: "checkout-web", target: "orders-api", weight: 2 },
];

// which nodes light up when tracing blast radius from the Stripe breaking change
export const blastRadiusFrom: Record<string, string[]> = {
  stripe: ["stripe", "payments-service", "checkout-web", "receipts-worker", "orders-api"],
  twilio: ["twilio", "notifications"],
  "search-svc": ["search-svc", "search-web"],
};
