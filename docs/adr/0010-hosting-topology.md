# ADR-010: Hosting topology

## Status

Proposed

## Context

The site needs a static, permanently-`noindex` staging tier before the
domain and compliance gates (Phase 4) are settled, and a full-stack tier
once Mode B (Phase 3) exists.

## Decision

GitHub Pages hosts the static informational build (Phases 0–2) as a
permanently-`noindex` preview/staging tier — see `siteConfig.indexable`
(`src/site.config.ts`) and the `robots`/`sitemap` metadata routes
(`src/app/robots.ts`, `src/app/sitemap.ts`) that derive from it. GitHub
Pages cannot run a server, so full-stack staging (Phase 3+, Mode B) runs on
a server host running the same Node+Postgres containers as production
(ADR-009), and production runs on an EU server host. "GitHub Pages =
staging" applies to the static tier only.

## Consequences

GitHub Pages' fixed-header static serving means response headers (CSP,
`X-Frame-Options`, HSTS, etc.) cannot be set server-side under
`output: "export"` — a real contradiction with the Phase 1/2 header-scanner
acceptance criteria, tracked separately (see ADR-011,
`PENDING-FIXES.md` P2-1). Deploys to Pages are additionally gated to
`workflow_dispatch` only (no auto-deploy on push) until Phase 4 sign-off
(`.github/workflows/deploy.yml`, P0-1).
