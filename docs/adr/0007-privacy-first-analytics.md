# ADR-007: Privacy-first analytics, no critical-path trackers

## Status

Proposed

## Context

Third-party trackers raise GDPR/ePrivacy consent obligations and can block
crawler access or trigger consent banners that hurt both trust and AEO
(answer-engine optimisation) goals.

## Decision

No third-party trackers sit on the critical path (page render, form
submission). Any analytics adopted must be privacy-first (e.g. no
cross-site cookies, no fingerprinting, EU-hosted where applicable).

## Consequences

No analytics integration exists yet in this repo. When one is added (e.g.
for the Phase 2 "analytics conversion event" on report completion,
`CHANGELOG.md` known gaps), it must be chosen and configured against this
constraint, not added ad hoc.
