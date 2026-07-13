# Invariant. — Elite Polish Pass + Cinematic Motion (whole-app sweep)

Goal: close the gap to Linear / Warp / Sentry / Cinetica quality. Fix what reads as "AI-built" (weak hero visual, washed-out text, loose dead space, half-empty dashboard screens) AND add two signature cinematic moments inspired by the references: a **cinematic intro reveal** and a **rotating scan-dial visual**. Density target ~4/5.

Frontend/presentation + motion only — no backend, no new routes, no data-model changes. All animation respects `prefers-reduced-motion`. R3F/canvas stays only where it carries product meaning; performance kept high.

---

## A. NEW — Cinematic intro reveal (from the video)
A one-time landing intro (session-scoped; skippable; reduced-motion jumps straight to hero):
1. Black screen → the Invariant mark fades/scales in center.
2. A glowing **"reliability eclipse" ring** forms behind it — a circular arc bloom in **signal-green** (not orange), representing the continuous watch loop. Subtle rotation + bloom.
3. The hero headline resolves with a **light-sweep flare** passing across the letters, then the ring settles up behind the hero and the nav + content fade in.
- Built with Motion (+ a CSS/canvas glow); no heavy video. Sits above the hero, auto-dismisses (~1.8–2.4s), and won't replay within a session.

## B. NEW — Rotating scan-dial section (from Cinetica)
A dedicated band between sections that turns Cinetica's rotating segmented wheel into a **product-meaningful "always scanning" motif**:
- A radial ring of segmented tick marks slowly rotating (like a radar/scanner sweep), with a live core in the center (a small animated topology / pulse) framed by technical corner brackets and mono labels (e.g. `CONTINUOUS DIFF · RUNTIME DRIFT · BLAST RADIUS`).
- A rotating sweep highlight passes the ticks; ticks near the sweep light up in status colors. Bold condensed section label alongside (Cinetica-style typographic weight, in Inter tight display).
- Placed as an "Always watching" band (near How-it-works). Canvas/SVG + Motion, reduced-motion = static composed state.

## C. Design-system tightening (`src/styles.css`)
- **Contrast fix:** raise muted body/second-headline grays (add readable `--foreground-dim`) so the hero's second line stops looking broken.
- **Depth system:** elevation shadow + top-edge highlight utilities so cards read raised, not flat outlines.
- **Signal glow** utility for hero ring, dial sweep, and primary CTAs (reserve signal-green for live/primary only).
- **Grain + vignette** overlay so large dark areas feel designed, not empty.
- Tighter display-type tracking tokens for headline sizes.

## D. Landing page — the "wow" pass
1. **Signature hero visual:** rebuild `topology-field.tsx` into a real animated dependency topology — labeled nodes, animated edges with traveling request packets, periodic **blast-radius pulse**, health-colored nodes, mouse parallax. Combined with the intro ring, this is the memorable centerpiece.
2. **Hero copy/layout:** fix low-contrast line, tighten tracking, mono eyebrow with live dot, refined CTA pair with signal glow.
3. **Kill dead space:** consistent section rhythm, eyebrow labels + hairline dividers → composed bands (Stripe-style), not floating blocks.
4. **Chaos section:** real terminal panels with window chrome, scan-line reveal on scroll, severity coloring, bold 65 min → 0 min delta.
5. **Feature grid:** each card gets a real mini-visual (diff, sparkline, graph node, PR comment) + restrained hover elevation.
6. **How-it-works, architecture panel, graph teaser, pricing, footer:** consistent motion, syntax-colored code, one emphasized tier, "all systems operational" footer dot.

## E. Dashboard shell + every screen — fill and compose
- **Overview:** larger sparkline KPIs, full-width reliability/activity strip, secondary row so the page composes top-to-bottom.
- **Reliability Graph (signature #2):** center + spread the force layout to fill the canvas, depth glow by health, edge gradients, animated dependency tracing, node-detail side panel, smooth blast-radius transitions on select.
- **Incident Center:** Linear/Sentry-grade dense rows (severity rail, assignee avatars, error-rate sparkline, keyboard nav) + right-side stats rail.
- **Incident detail / Copilot / Contract / Drift / APIs / API detail / GitHub / Settings:** consistent page-fill (two-column where sparse), custom empty + skeleton loading states, contextual header actions, richer microvisuals; Copilot gets a more finished chat surface + streaming-style render.
- **Tables (`data-table.tsx`):** sticky headers, refined row hover/active, keyboard nav, better empty/loading states.

## F. Motion & interaction polish
- Consistent easing via `src/lib/motion.ts`; staggered enters, route transitions, hover microinteractions; all reduced-motion safe; performant (2D canvas/SVG + Motion).

## G. QA
- Re-screenshot landing (incl. intro + dial) + all dashboard screens headless at desktop widths; inspect for dead space / contrast / overflow / jank; iterate until each screen reads elite and fills its canvas. Typecheck clean.

---

## On pushing to GitHub
I can't run git or connect GitHub from here — that's Lovable's built-in integration, not the agent. To push to `github.com/lakshysingh156/Invariant.`: **+ menu (bottom-left of chat) → GitHub → Connect project → authorize.** It then two-way syncs on every change. Note: Lovable creates/uses its own repo on connect; syncing into that exact pre-existing repo isn't directly supported — easiest is to let it create the repo (or empty the existing one first).

---

### Technical notes
- Files: `src/styles.css`, `src/components/marketing/*` (incl. new `intro-reveal.tsx`, `scan-dial.tsx`), `src/components/dashboard/*`, `src/components/ui-kit/*`, `src/components/graph/force-graph.tsx`, `src/routes/index.tsx`, `src/routes/_dashboard.*`, `src/lib/motion.ts`. Mock data may gain fields for richer visuals; no backend.
- The reference images/video are inspiration only — not embedded as assets.
- No new dependencies expected (motion, gsap, d3-force, r3f already installed).
