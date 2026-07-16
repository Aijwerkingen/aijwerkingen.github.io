# Security policy

## Reporting a vulnerability

If you believe you've found a security vulnerability in this project, please
email **contact@example.org** (placeholder — see `src/site.config.ts`,
D9/D11) with details. Please do not open a public GitHub issue for
undisclosed vulnerabilities.

A `/.well-known/security.txt` route is planned for Phase 4 (`TECHNICAL_SPEC.md`
§12.8) once the final domain and a real disclosure contact are settled.

## Prohibited actions during implementation

Per `TECHNICAL_SPEC.md` §12, any agent (human or AI) implementing this
project must **never**, on its own initiative:

- Enter real credentials, payment details, or government-ID data into any
  form, test fixture, or seed file.
- Modify access controls (repo permissions, hosting IAM, database roles,
  CMS user roles) without explicit human sign-off.
- Hard-delete production data.
- Bypass, auto-solve, or work around CAPTCHAs or other bot-detection.
- Push directly to `main` or flip `siteConfig.indexable` to `true` without
  the human-approved gates described in `CHANGELOG.md`'s "▶ RESUME HERE"
  block and ADR-010.

These are handed to a human operator. If a task appears to require one of
them, stop and ask rather than proceeding.

## Scope notes

This is a static-export, GitHub Pages–hosted site (`ADR-010`). It currently
has no server-side attack surface of its own; Mode A (Qualtrics-embedded
survey, spec §8.3) is the only third-party integration point. See
`qualtrics-integration.md` for the iframe/postMessage hardening notes and
`PENDING-FIXES.md` P2-1/P2-3 for open CSP and sandboxing items.
