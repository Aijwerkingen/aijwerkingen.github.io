# ADR-003: Self-hosted questions from a config file

## Status

Proposed

## Context

Survey questions change over time and should be editable by non-engineers
without a code deploy.

## Decision

When Mode B (self-hosted, `native` provider) is built, its questions are
externalized to a versioned config file (`survey.example.yaml` /
`survey.schema.json` at the repo root are the seed artifacts for this),
never hard-coded into components.

## Consequences

Question changes become a config/content edit rather than an app-code
change. The config's schema (`survey.schema.json`) is domain-agnostic and
already survived the 2026-07-16 product redefinition unchanged in
structure — only `$id`/`title` needed updating (`CHANGELOG.md`, P1-15).
