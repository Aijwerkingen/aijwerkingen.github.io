# ADR-004: Content in a versioned CMS/content layer

## Status

Proposed

## Context

Marketing and legal copy (FAQ answers, disclaimers, privacy notice, terms)
changes independently of application code, and changes shouldn't require an
engineering deploy to ship. The site will also need i18n eventually.

## Decision

Page and marketing content is intended to live in a git-versioned content
layer (MDX or a headless CMS), not hard-coded in components.

## Consequences

Currently, all copy (home, FAQ, report) is inline in the page components
(`src/app/page.tsx`, `src/app/faq/page.tsx`, `src/app/report/page.tsx`).
Extracting it into a content layer is outstanding work, not yet started;
this ADR records the intended target architecture so future content
changes move toward it rather than deepening the hard-coded pattern.
