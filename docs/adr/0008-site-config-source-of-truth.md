# ADR-008: Single `site.config` source of truth

## Status

Proposed

## Context

Brand name and final domain were undecided for most of the project
(D1/D9). SEO/AEO correctness requires NAP (name/address/phone)
consistency across every title, meta tag, canonical URL, JSON-LD block,
sitemap, `robots.txt`, and `llms.txt`.

## Decision

All site identity — name, domain, logo, NAP, socials, and the `indexable`
flag — lives in exactly one file, `src/site.config.ts`. Every SEO artifact
derives from it; no other file hard-codes the brand name or domain.

## Consequences

Changing the name or domain is a one-file edit (see `CHANGELOG.md`'s
"▶ RESUME HERE" block). This is enforced by discipline plus, as of this
pass, an ESLint `no-restricted-syntax` rule banning the brand/domain
literals outside `site.config.ts` (`eslint.config.mjs`,
`PENDING-FIXES.md` P1-6) — verified to actually fail on a violation, not
just present in config.
