import type { ChatTurn } from "@/types";

export const suggestedQuestions = [
  "Why did payment capture start failing this morning?",
  "What's the blast radius of the Stripe /charges change?",
  "Which APIs are drifting right now?",
  "Has this incident happened before?",
];

export const copilotHistory = [
  { id: "h1", title: "Stripe /charges root cause", when: "12m ago", turns: 6 },
  { id: "h2", title: "Search latency correlation", when: "2h ago", turns: 4 },
  { id: "h3", title: "Twilio throttling pattern", when: "Yesterday", turns: 8 },
  { id: "h4", title: "Q2 reliability review", when: "3d ago", turns: 12 },
];

export const seedConversation: ChatTurn[] = [
  {
    id: "t1",
    role: "user",
    content: "Why did payment capture start failing this morning?",
  },
  {
    id: "t2",
    role: "copilot",
    content:
      "Payment capture began failing at 03:42 UTC because the Stripe Payments contract changed on POST /charges. Three breaking changes were detected: `outcome.seller_message` was removed, `amount` changed from integer to string, and a new required `Stripe-Version` header was introduced. Your payments-service parses `amount` as an integer, so every capture now throws a deserialization error.\n\nBlast radius analysis links this to 3 services and 12 endpoints. This is tracked as incident INV-231.",
    citations: [
      { id: "cit1", kind: "change", label: "Change · amount type", ref: "INV-C231" },
      { id: "cit2", kind: "incident", label: "Incident INV-231", ref: "inc-231" },
      { id: "cit3", kind: "drift", label: "Drift dr1 · schema", ref: "dr1" },
    ],
    suggestions: [
      "Show me the exact before/after diff",
      "What's the recommended fix?",
      "Has this happened before?",
    ],
  },
];

export const relatedIncidents = [
  { id: "inc-224", code: "INV-224", title: "Billing Core webhook signature rotation", similarity: 0.72 },
  { id: "inc-221", code: "INV-221", title: "Shipping API rate enum expansion", similarity: 0.61 },
];

export const suggestedActions = [
  { id: "a1", label: "Open patch PR on payments-service", tone: "signal" as const },
  { id: "a2", label: "Notify #payments on Slack", tone: "muted" as const },
  { id: "a3", label: "Pin Stripe-Version header", tone: "muted" as const },
];
