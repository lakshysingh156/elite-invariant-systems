import type { DriftEvent } from "@/types";

export const driftEvents: DriftEvent[] = [
  {
    id: "dr1",
    apiId: "stripe-payments",
    apiName: "Stripe Payments",
    endpoint: "POST /charges",
    type: "schema",
    confidence: 0.98,
    detectedAt: "2026-07-12T03:42:11Z",
    baseline: "amount: integer",
    observed: "amount: string",
    deviation: "type mismatch on required field",
    status: "breaking",
  },
  {
    id: "dr2",
    apiId: "search-service",
    apiName: "Search Service",
    endpoint: "GET /search",
    type: "latency",
    confidence: 0.91,
    detectedAt: "2026-07-12T08:12:00Z",
    baseline: "p95 142ms (7d)",
    observed: "p95 631ms",
    deviation: "+4.4σ from rolling baseline",
    status: "drift",
  },
  {
    id: "dr3",
    apiId: "twilio-messaging",
    apiName: "Twilio Messaging",
    endpoint: "POST /Messages",
    type: "error-rate",
    confidence: 0.86,
    detectedAt: "2026-07-12T07:05:00Z",
    baseline: "0.4% (7d)",
    observed: "3.1%",
    deviation: "+3.2σ error-rate spike",
    status: "drift",
  },
  {
    id: "dr4",
    apiId: "shipping-api",
    apiName: "Shipping API",
    endpoint: "GET /rates",
    type: "schema",
    confidence: 0.74,
    detectedAt: "2026-07-12T06:40:00Z",
    baseline: "currency: enum[3]",
    observed: "currency: enum[4]",
    deviation: "new enum value observed",
    status: "analyzing",
  },
  {
    id: "dr5",
    apiId: "twilio-messaging",
    apiName: "Twilio Messaging",
    endpoint: "GET /Messages/{id}",
    type: "auth",
    confidence: 0.69,
    detectedAt: "2026-07-11T22:14:00Z",
    baseline: "bearer only",
    observed: "bearer + signature",
    deviation: "additional auth requirement",
    status: "analyzing",
  },
];

// latency baseline series for the drift chart
export const latencySeries = Array.from({ length: 48 }, (_, i) => {
  const t = i;
  const baseline = 140 + Math.sin(i / 4) * 12;
  const breach = i > 34 ? (i - 34) * 55 : 0;
  return {
    t: `${String(Math.floor(t / 2)).padStart(2, "0")}:00`,
    observed: Math.round(baseline + breach + (Math.random() - 0.5) * 14),
    baseline: Math.round(baseline),
    upper: Math.round(baseline + 60),
  };
});
