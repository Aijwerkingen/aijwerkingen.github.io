# ADR-006: EU data residency

## Status

Proposed

## Context

Reporters and the reference organisation are EU/NL-based. Reports may
contain special-category (Art. 9) data. GDPR and institutional policy
require EU data residency for such data.

## Decision

Any self-hosted PII or health-adjacent data must reside in the EU. For Mode
A (Qualtrics), this means the survey must be provisioned on an EU-datacenter
Qualtrics org (`*.eu.qualtrics.com`), not the default US-brand host. For
Mode B (Phase 3), the Postgres instance must run in an EU region (see
ADR-009/010).

## Consequences

The current sample survey URL
(`https://qualtricsxmwdy4hl99w.qualtrics.com/...`) has no `.eu.` segment and
is therefore a US-datacenter host — flagged as P0-2 in `PENDING-FIXES.md`,
open, and requiring the Qualtrics account owner to confirm/resolve
(blocking input to decision D3). Harmless only as long as no real
submissions are collected, which is what the deploy gate (P0-1, resolved)
is meant to guarantee in the interim.
