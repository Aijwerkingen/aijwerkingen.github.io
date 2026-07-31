# ADR-002: Survey provider abstraction (qualtrics/native)

## Status

Proposed

## Context

The survey backend is not finalized. Mode A embeds a third-party Qualtrics
survey; Mode B (self-hosted, config-driven) is planned for Phase 3. The
site needs to ship before both are locked in.

## Decision

The survey layer sits behind a `SurveyProvider` interface with two
implementations, `qualtrics` and `native`, selected at build/deploy time by
a `SURVEY_PROVIDER` environment variable (see `.env.example`).

## Consequences

Switching providers is a config change (`SURVEY_PROVIDER` + redeploy), not a
rewrite of page code. `/report` (`src/app/report/page.tsx`) currently
implements Mode A directly (a bare iframe embed); the `SurveyProvider`
interface itself has not yet been built - that is outstanding Phase 2 work
(`CHANGELOG.md` "Known gaps").
