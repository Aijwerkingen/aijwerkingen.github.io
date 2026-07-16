# ADR-009: Mode B backend: containerized Node + PostgreSQL everywhere

## Status

Proposed

## Context

Mode B (self-hosted, config-driven survey, Phase 3) needs a backend and
datastore. An early draft of this decision (superseded, see
`CHANGELOG.md`'s 2026-07-12 "backend & hosting decisions blocked" entry)
proposed Supabase for non-production environments and self-hosted Postgres
for production. That was amended in a later entry (2026-07-16, "drop
Supabase; Docker+Postgres everywhere") in favour of full dev/prod parity.

## Decision

Mode B uses a containerized Node service plus PostgreSQL, identically in
local, staging, and production — the same Docker image/stack everywhere
(`docker-compose` locally; the same containers on a server host for
staging/prod). Environments differ **only** by `DATABASE_URL` and other
per-environment secrets. No managed-database vendor (e.g. Supabase) is
used. Data access is ORM + versioned SQL migrations over a standard
connection string — no vendor-proprietary coupling (no `supabase-js`,
Supabase Auth/Storage/Edge Functions, no RLS-as-app-authz on the critical
path).

## Consequences

Identical Postgres version, extensions (e.g. `pgcrypto`), and migrations
across every environment removes an entire class of "works in staging,
breaks in prod" bugs and avoids vendor lock-in. Production's Postgres
container must run in an EU region (ADR-006); staging can use non-real
test data, so residency is non-blocking there. This is not yet built —
Phase 3 is `not_started` as of this writing.
