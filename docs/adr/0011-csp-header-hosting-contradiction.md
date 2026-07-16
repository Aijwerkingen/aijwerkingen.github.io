# ADR-011: CSP/security-header gap on GitHub Pages, and how it's scoped

## Status

Proposed

## Context

`TECHNICAL_SPEC.md` §12.1 requires a strict Content-Security-Policy
(including a Qualtrics-scoped `frame-src`), `X-Content-Type-Options`,
`Referrer-Policy`, `X-Frame-Options`/`frame-ancestors`, and
`Permissions-Policy`, targeting an A/A+ score on an external header
scanner. Phase 1 and Phase 2 acceptance criteria repeat this ("header
scanner A/A+", "CSP correct").

GitHub Pages (ADR-010) serves static files with fixed headers and no
configuration hook. Next's `headers()` config is inert under
`output: "export"`. This is an architectural limit, not an oversight, and
it was previously undocumented (`PENDING-FIXES.md` P2-1).

## Decision

1. **Interim (this pass):** a `<meta http-equiv="Content-Security-Policy">`
   tag is added in `src/app/layout.tsx`'s `<head>`, covering `default-src`,
   `script-src`, `style-src`, `img-src`, `frame-src` (scoped to
   `https://*.qualtrics.com` for the Mode A iframe), and `connect-src`.
2. **Explicitly out of reach on Pages, and left unset:** `frame-ancestors`,
   HSTS, and `X-Content-Type-Options` cannot be expressed via `<meta>` and
   will not be present on this hosting tier. An external header scanner
   will **not** return A/A+ while the site is on GitHub Pages.
3. **Scoping the acceptance criteria:** the Phase 1/2 "header scanner A/A+"
   / "CSP correct" criteria are amended to apply once the site moves to the
   Phase 3+ server host (ADR-009/010) that can set response headers
   directly, not to the GitHub Pages static tier. `TECHNICAL_SPEC.md` §20
   should be read with this scoping in mind until the spec text itself is
   updated to say so explicitly.

## Consequences

Phase 1/2 can be marked `done` on GitHub Pages without ever hitting A/A+ on
a header scanner, and that is expected, not a gap to keep chasing on this
hosting tier. The full header set becomes achievable — and required —
once Phase 3's server host is in place.
