# Invariant. — Full Front-End Foundation

Build the complete product surface with mock data only (no backend). Two zones: an elite marketing site and a production-grade dashboard shell. Target quality: Linear / Stripe / Sentry / Vercel / Datadog / Warp — "people are surprised a student built this."

## Stack (adapted to this project)

- **TanStack Start + React 19 + Vite** (the supported stack — replaces the spec's Next.js 15; same capabilities: file routing, SSR, code-splitting).
- **TypeScript**, **Tailwind CSS v4** (tokens in `src/styles.css`), **shadcn/ui**.
- **Motion (Framer Motion for React)** for component/scroll motion; **GSAP** only for scroll-timeline storytelling; **React Three Fiber** for the one hero-grade dependency-graph visual. Every animation communicates a product concept — no decorative 3D.
- Mock data lives in `src/data/*` typed against `src/types/*` (mirrors the spec's entities: apis, versions, endpoints, changes, drift_events, incidents, graph nodes/edges).

## Design system (committed, not generic)

Infra-company aesthetic. Explicitly avoiding: gradient blobs, blanket glassmorphism, neon cyberpunk, fake dashboards, generic hero.

- **Color**: near-black canvas (`#08090A` base, `#0E0F11`/`#141517` raised surfaces), off-white primary text, layered muted grays, hairline borders (`rgba(255,255,255,0.06-0.1)`). Restrained **signal-green** accent used sparingly for primary action/live state. Semantic status system (color + always a text label): green=stable/resolved, amber=drifting/risky, red=breaking, violet=analyzing/in-progress.
- **Type**: Inter (UI/headings, tight tracking on display sizes) + JetBrains Mono (all data, status, code, timestamps, logs) — loaded via `<link>` in `__root.tsx`.
- **Grid/space**: 8px base (4px in dense tables). Sharp-ish radii, subtle depth via borders + soft shadows, not glass.
- All values are semantic tokens in `src/styles.css` `@theme` — no hardcoded colors in components.
- Reusable primitives in `src/components/ui-kit/`: StatusBadge, DataTable (sortable/filterable, monospace numeric cols), TerminalLog/Timeline, ChatBubble+CitationChip, KpiCard, SeverityPill, GraphCanvas wrapper, GlowButton.

## Routes

**Marketing** (`src/routes/`)

- `/` — landing. Own `head()` metadata (real title/description/og/twitter). Name rendered exactly as `Invariant.` (with the period).

**Auth** (UI-only, mock — no real auth backend)

- `/login`, `/signup` — split-screen: form left, live product motif right. Submit just routes to `/dashboard`.

**Dashboard** (`_dashboard` layout route with persistent sidebar + header + Cmd+K palette; mock "signed-in", no gate since no backend)

- `/dashboard` — Overview: KPI cards (open incidents, APIs monitored, avg genome score), recent incidents feed, recent changes feed, empty/loading/error states.
- `/apis` — API Inventory: dense sortable/filterable table, genome-score column, status badges, tag filter.
- `/apis/$apiId` — API Detail: genome header + trend sparkline, tabs (Endpoints / Versions / Drift Timeline / Dependents), "Upload New Version" affordance.
- `/contract` — Contract Intelligence / Diff Report: side-by-side version compare, severity-grouped change list, expandable before/after.
- `/drift` — Drift Reports: timeline of drift events with confidence scores + latency/error baseline charts.
- `/incidents` — Incident Center: filterable list + detail with live status pipeline, similar-past-incidents panel, "Ask Copilot" shortcut.
- `/graph` — Reliability Graph: interactive force-directed dependency canvas (R3F/`d3-force`), node detail sidebar, click-to-highlight blast radius.
- `/copilot` — AI Copilot: chat panel, suggested-question chips, streaming-style answer render, clickable citation chips (mocked responses).
- `/github` — GitHub Integration: repo selector, permission summary, connection status card, sample PR risk comment.
- `/settings` — tabbed (Profile / Members / Integrations / API Keys); typed-confirmation for destructive actions.

## Landing page composition (scroll-storytelling)

Keeps the current build's proven skeleton but pushes each section to elite quality:

1. **Nav** — minimal: `Invariant.` wordmark (placeholder logo, to be replaced later — no logo emphasis), Features / How it works / Pricing / Docs, Sign in + Get Started. Removes the "Made with Emergent" badge.
2. **Hero** — sharp headline, mono eyebrow tag, one primary CTA + one quiet secondary. Mouse-reactive **live API topology** motif (subtle, not a fake dashboard) instead of a flat grid background.
3. **"One API change. 65 minutes of chaos."** — the without/with comparison, upgraded: scroll-synced reveal, mono incident timeline, real severity coloring.
4. **Product / "Every layer, continuously watched"** — feature blocks (OpenAPI Diff, Runtime Drift, API Genome, AI Copilot, GitHub PR Bot, Knowledge Memory) with restrained hover microinteractions, real mini-visuals per card (not icon-only).
5. **How it works** — animated pipeline: collector → analyzer → diff → copilot, revealed on scroll (GSAP timeline).
6. **Architecture** — `architecture.yml` code panel with syntax coloring + the unified-graph checklist.
7. **Reliability Graph teaser** — interactive R3F dependency-graph preview (the signature 3D moment).
8. **Pricing** — Free / Pro / Team tiers from the PDF, clean cards, one emphasized plan.
9. **Footer** — Product / Company / Legal columns + "all systems operational" status dot.

Responsive across breakpoints; motion respects `prefers-reduced-motion`.

## Build order

1. Design tokens in `styles.css` + fonts in `__root.tsx` + real metadata; install `motion`, `gsap`, `@react-three/fiber`, `three`, `d3-force`.
2. UI-kit primitives + mock data/types.
3. Landing page (all 9 sections) — first visible win.
4. Auth pages.
5. Dashboard layout shell (sidebar, header, Cmd+K).
6. Dashboard screens in order: Overview → APIs/Detail → Contract → Drift → Incidents → Graph → Copilot → GitHub → Settings.
7. Motion/interaction polish pass + reduced-motion + responsive QA.

## Notes / decisions

- Logo is a temporary text wordmark; a proper elite mark comes in a later pass as you said.
- Backend intentionally deferred: all data mocked, auth is UI-only. When you're ready for real detection/auth/AI, that's a follow-up using Lovable Cloud.
- R3F is used only for the dependency graph (hero + `/graph`) where it carries product meaning; everything else uses lightweight 2D SVG/canvas + Motion to stay fast.

This is a large multi-part build; I'll implement it in the order above so you see the landing page early, then each dashboard screen lands incrementally.  
Looks good.

A few final requirements before implementation:

1. The Reliability Graph must be one of the strongest visual experiences in the product.

- Interactive dependency graph

- Blast radius highlighting

- Animated dependency tracing

- Node health indicators

- Smooth transitions

2. Dashboard pages must not feel like templates.

Every page should have:

- unique visual identity

- custom empty states

- custom loading states

- contextual actions

- rich interactions

3. The AI Copilot page should feel like a real investigation workspace.

Include:

- citations

- related incidents

- suggested actions

- timeline references

- investigation history

4. The Incident Center should feel similar to a level of:

- Linear

- Sentry

- Datadog

5. Tables should be elite quality:

- column visibility

- sorting

- filtering

- search

- keyboard navigation

- sticky headers

6. Add a Command Palette (Cmd+K / Ctrl+K) that can navigate to every major route.

7. Add tasteful page transitions and route transitions throughout the dashboard.

8. Do not use generic SaaS illustrations or stock graphics.

Every visual should represent an actual Invariant product concept.

9. Build all screens with production-quality mock data so screenshots already look real.

10. Keep performance high.

Use Three.js only where it adds product value.  
