# ADR-005: Anonymous-by-default, data minimisation

## Status

Proposed

## Context

Reports may contain special-category data under GDPR Art. 9 (perceived
psychological harm, health-adjacent disclosures — see `TECHNICAL_SPEC.md`
§13 and `PENDING-FIXES.md` P1-17). Minimising what's collected reduces both
regulatory burden and risk to reporters.

## Decision

Submissions are anonymous by default; no account or name is required.
Contact details are optional and clearly marked as such before submission.
Only data necessary to assess a report is collected.

## Consequences

The `/faq` copy ("Is my report anonymous? Yes, by default.") and
`/report` copy must stay accurate to this decision — see the accuracy
guardrail in `TECHNICAL_SPEC.md` §11. `survey.example.yaml` marks free-text
and contact fields `pii: true` accordingly.
