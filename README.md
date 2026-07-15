<div align="center">

<img src="public/screenshots/landing.png" alt="Invariant landing" width="820" />

# Invariant<span>.</span>

**The reliability engineer for every API your team depends on.**

Detect contract &amp; runtime drift, map the exact blast radius, and
investigate with an AI copilot — before production does.

[Live demo](https://id-preview--9ae59306-b9cb-4dc7-93cd-6909ef876ca8.lovable.app) · [Features](#features) · [Screenshots](#screenshots) · [Stack](#stack)

</div>

---

## What it is

Invariant is a monitoring surface for the API contracts and runtime behavior
your product depends on — the ones you don't own but can't afford to have
break. It watches every registered API for **semantic** contract drift (not
string diff), traces the blast radius through your dependency graph, and
hands you an AI copilot to investigate incidents in seconds instead of
hours.

Think of it as Sentry &times; Linear &times; a senior SRE, focused on the
integration layer.

## Features

- **Contract Intelligence** — semantic OpenAPI diff, severity classified
  (breaking / risky / additive), timeline of every change.
- **Runtime Drift** — latency, error-rate, and shape drift detected on live
  traffic, not just on schedule.
- **Reliability Graph** — animated force-directed service topology with
  health-colored nodes and blast-radius highlighting on select.
- **Incident Center** — Linear-grade dense triage: severity rail, assignee,
  sparkline, keyboard nav.
- **AI Copilot** — investigate an incident in natural language; streams
  hypotheses grounded in your contract history + runtime signals.
- **GitHub Integration** — auto-open PRs with migration patches for the
  breaking changes it detects.
- **Cinematic marketing site** — intro reveal, live topology backdrop,
  rotating scan-dial section, all reduced-motion aware.

## Screenshots

### Landing — hero with live topology backdrop
<img src="public/screenshots/landing.png" alt="Landing hero" width="100%" />

### Reliability overview — KPIs, incidents, least-stable APIs
<img src="public/screenshots/dashboard.png" alt="Dashboard overview" width="100%" />

### Reliability graph — animated dependency topology
<img src="public/screenshots/graph.png" alt="Reliability graph" width="100%" />


## Stack

- **Framework** — [TanStack Start](https://tanstack.com/start) (React 19,
  file-based routing, SSR-ready)
- **Build** — Vite 7, Bun package manager
- **Styling** — Tailwind CSS v4, semantic OKLCH token system
- **Motion** — `motion` (Framer Motion successor), `d3-force`, hand-rolled
  canvas/SVG for the topology + scan dial
- **UI primitives** — shadcn/ui on top of Radix
- **Icons** — lucide-react
- **Types** — TypeScript strict

## Design system

All color, elevation, and glow values live in `src/styles.css` as OKLCH
semantic tokens — no hardcoded hex in components. Two accent colors:

- **`--signal`** — green, reserved for live/status ("8 APIs stable")
- **`--brand`** — blue, used for primary CTAs, the wordmark dot, and the
  emphasized pricing tier

Depth uses a shared `.elevate` utility (hairline + inset top highlight +
soft shadow). Signature moments use `.brand-glow` or `.signal-glow`.

## Getting started

```bash
bun install
bun dev
# → http://localhost:8080
```

Routes are auto-registered from `src/routes/`. Do not hand-edit
`src/routeTree.gen.ts`.

## Project structure

```
src/
├── components/
│   ├── brand/          # Wordmark + BrandMark (infinity loop)
│   ├── marketing/      # Landing sections + intro reveal + scan dial
│   ├── dashboard/      # Sidebar, page shell, command palette
│   ├── graph/          # d3-force reliability topology
│   └── ui-kit/         # Status badges, sparklines, data tables
├── data/               # Mock incidents / APIs / drift / copilot
├── lib/                # motion tokens, formatters, utils
├── routes/             # File-based routing (TanStack Start)
└── styles.css          # Design tokens + utilities
```

## Roadmap

- [x] Elite marketing site with cinematic intro
- [x] Full dashboard shell with 10 screens
- [x] Reliability graph (d3-force)
- [x] AI Copilot UI
- [ ] Backend: Postgres schema, ingest workers, contract diff engine
- [ ] Real GitHub App + PR bot
- [ ] Self-hosted deployment guide

---

<div align="center">
Built by <a href="https://github.com/lakshysingh156">@lakshysingh156</a> — no template kit, no boilerplate.
</div>
