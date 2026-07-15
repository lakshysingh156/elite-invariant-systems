# Invariant v2.0 — Elite Product Experience Pass

Moving Invariant from "polished AI prototype" to "YC-backed infrastructure startup." Every change earns its place by communicating reliability engineering. No decorative fluff.

Reference bar: Linear, Vercel, Stripe, Sentry, Datadog, Grafana, GitHub.

---

## Scope (single sweep)

### 1. Landing — Interactive Reliability Universe

- Rebuild hero background: live force-directed API topology reacting to cursor (nearby nodes highlight, dependency paths trace, subtle parallax). Replace the current static-ish topology field.
- Insert scroll-driven narrative section **"From Change to Confidence"** between chaos and features: 5 pinned steps — contract diff → dependency expansion → risk propagation (amber/red) → Copilot investigation → healthy resolution. GSAP/Motion scroll-linked, single canvas that morphs across steps.
- Tighten copy density. Kill any remaining generic AI-SaaS phrasing.
- Keep intro reveal, scan dial, pricing, CTA. Refine, don't replace.

### 2. Dashboard — Reliability Command Center (biggest lift)

Full redesign of `/dashboard`. Kill the generic KPI grid.

**Top command bar** (in `_dashboard.tsx`):

- Org selector · env selector (Production/Staging/Dev) · live system status pill · deployment status · global ⌘K (already exists, elevate).

**Overview layout** (`_dashboard.dashboard.tsx`):

- **Left column (2/3):**
  - Hero reliability score: large numeric `98.4`, circular ring viz, 30d sparkline, delta, confidence.
  - **Live Reliability Timeline** — streaming event log (contract detected → blast radius calc → Copilot analysis → mitigation). Monospace, timestamped, color-coded severity rail.
  - API Fleet table (see below).
- **Right column (1/3):**
  - Active incidents rail (Sentry-style dense list).
  - Mini dependency health map (embedded force graph teaser, click → `/graph`).
  - Fleet stats: 127 APIs · 3.8M req today · 42 deps · 326 changes.

**API Fleet table** — enterprise inventory: API · Health dot · Genome score · Requests (mini bar) · p95 latency (sparkline) · Last change · Risk badge · Deps count. Sticky header, row hover reveals expand affordance, keyboard nav.

### 3. Incident Center — Sentry-grade

`_dashboard.incidents.$incidentId.tsx`:

- Header: code · title · severity chip · env · affected count · assignee · SLA.
- Tab bar: Overview · Timeline · Blast Radius · Root Cause · Fix · Similar Incidents.
- Each tab is real content (Blast Radius embeds mini graph, Similar uses cosine-similarity mock list, Fix shows diff-style patch card).

Incidents index `_dashboard.incidents.index.tsx`: dense table (severity rail, code, title, api, status, opened, updated, assignee), filter chips, keyboard row nav.

### 4. Reliability Graph — the WOW page

`_dashboard.graph.tsx` full-screen:

- Strengthen existing force graph: service clusters (color by domain), animated packet dots along edges, health-tinted nodes, hover trace, click → right-side detail drawer (health · consumers · recent changes · risk).
- Left rail: search + filters (env, status, cluster, risk).
- Top toolbar: Blast Radius mode toggle, layout presets, zoom.
- Bottom status bar: node count · edge count · unhealthy count.
- Detail drawer replaces current inline panels.

### 5. AI Copilot — Investigation Workspace

`_dashboard.copilot.tsx` three-pane:

- **Left:** incident context (which incident, affected services, timeline snippet).
- **Center:** AI analysis stream — root cause, confidence %, structured reasoning, suggested actions.
- **Right:** evidence rail — citations, logs, previous incidents, dependency snapshot.
- Not a chat clone. Feels like an AI SRE pairing with a senior engineer.

### 6. Visual system tightening (`src/styles.css`)

- Refine spacing scale, denser table rows, sharper hairlines, tighter mono labels.
- Add elevation tokens for panel depth without glassmorphism.
- Ensure blue accent (period + CTAs + emphasis) and signal-green (live-status only) stay disciplined.

### 7. Realistic data

Rewrite `src/data/*` with believable scale: 127 APIs, real vendor names (Stripe, Shopify, Twilio, Auth0, GitHub, Snowflake, Segment, Datadog), 3.8M req/day, plausible latency/error distributions, richer incident history.

### 8. Motion discipline

Audit every animation. Keep only ones that explain a system concept (dependency trace, blast pulse, timeline stream, health transition). Remove decorative floaters.

---

## Out of scope

- No backend. No auth wiring. No new routes beyond what exists.
- README/screenshots/GitHub already handled — not re-touching yes just edit a little bit as per newest updates .
- No new heavy deps (reuse motion, d3-force, existing shadcn).

## Deliverable check

After the sweep I'll re-screenshot landing + dashboard + graph + incident detail + copilot at desktop width and eyeball against Linear/Sentry/Datadog for parity.

Approve and I'll execute in one sweep.