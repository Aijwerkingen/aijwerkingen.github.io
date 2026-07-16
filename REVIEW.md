# AIjwerkingen — Review Protocol

**Purpose:** a self-contained prompt for a *cold* agent (no memory of prior sessions) to
independently audit whatever work has been completed **as of right now**, at any point in
the project. It is not tied to a phase — it derives what to check from the live state of
`CHANGELOG.md` and `TECHNICAL_SPEC.md`, so the same file works after Phase 0 or after
Phase 5.

**How to use this:** paste this whole file as the task for a fresh review agent, or point
it at this file and ask it to follow the protocol. The reviewing agent should **verify
claims by running things, not by trusting what `CHANGELOG.md` says.** The changelog is the
prior agent's own account of its work — treat it as a claim, not a fact.

---

## 1. Read first, in order

1. `README.md`
2. `TECHNICAL_SPEC.md` — the full spec. Section 20 is the phased plan; Section 2.3 is
   measurable success criteria; Section 22 is the open-decisions register (D1, D2, …).
3. `CHANGELOG.md` — the authoritative status ledger (protocol defined in spec §21). Read
   every entry, newest first.

Working directory note: the actual project/repo root is `aijwerkingen.github.io/` (the
parent workspace directory is not part of the repo). `cd` into it before doing anything.

## 2. Establish scope for *this* review

Don't hardcode an assumption about which phase is active — read it off the **Phase status
board** in `CHANGELOG.md`:

- Focus primarily on phases marked `in_progress` or `in_review`, and on the most recent
  changelog entries — that's "work since the last review."
- If you're told a specific date or a range of entries to review, treat only that range as
  in scope. Otherwise, default to auditing the full current state of the repo.
- Note anything marked `blocked` and confirm the blocker is still real (re-check the actual
  state — don't assume a blocker from three entries ago is still accurate).

## 3. Universal verification checklist (applies at any phase)

1. **Build & run it for real.** `npm install`, `npm run build`. Confirm the build stays a
   **static export** (`output: "export"` in `next.config.ts`) unless a later ADR explicitly
   changed the hosting model — GitHub Pages has no server runtime, so this is load-bearing,
   not incidental. Serve `out/` and exercise every route the changelog claims exists. Check
   the browser console for errors on each one.

2. **`site.config.ts` remains the single source of truth (ADR-008, spec §5.1).** Grep the
   repo for brand name / domain literals outside `src/site.config.ts`. There should be none
   in app code. If a no-hardcoded-literal lint/build check exists, confirm it actually runs
   and actually fails on a violation (don't just confirm the file exists).

3. **Indexability posture matches reality (ADR-010, spec §5.2, criterion AC-DOMAIN).** Until
   the final domain is chosen *and* verified in Search Console, everything publicly
   reachable must stay `noindex` — check `robots.txt`, the `<meta name="robots">` /
   `robots` metadata export, and any newly added environment (preview/staging/prod). If
   `site.config.indexable` has been flipped to `true`, confirm that was a deliberate,
   documented decision (changelog entry + domain finalized), not a default that slipped.

4. **No secrets staged or committed.** `git status`, `git diff --cached` if anything is
   staged, and confirm `.gitignore` coverage. Check whether anything sensitive (API keys,
   Qualtrics credentials, DB connection strings) shows up in tracked files or git history.

5. **Diff actual repo state against the acceptance criteria of every `in_progress` or
   `in_review` phase in spec §20.** Go criterion by criterion — don't skim. Mark each
   ✓ verified / ✗ missing / ⚠ partially done.

6. **Cross-check changelog claims vs. what's actually on disk.** Flag any mismatch: files
   claimed done that don't exist, features claimed working that error out, a "known gaps"
   list that's stale or incomplete relative to what you actually find.

7. **Re-check the safety-relevant spec sections that the most recent work touches**, e.g.:
   - Security headers / CSP (§12) if hosting or embedding changed.
   - Privacy / PII handling (§13) if the submission flow or data storage changed.
   - Accessibility (§14) if new UI shipped.
   - Survey provider behavior (§8) if `SURVEY_PROVIDER` or the Qualtrics/native integration
     changed.
   Skip sections nothing recent touches — don't pad the review.

8. **Sanity-check structural integrity.** No stale absolute paths, no orphaned/duplicate
   config left over from a prior reorg. Delete `node_modules`/`.next`/`out` and confirm a
   clean `npm install && npm run build` still succeeds — this simulates what a fresh
   `git clone` would face.

9. **Look beyond the changelog's own "known gaps."** The prior agent's self-report may be
   incomplete or optimistic. Actively look for anything wrong, insecure, or inconsistent
   with the spec that isn't mentioned at all.

## 4. Output format

For each checklist item: **confirmed-accurate**, or a **concrete discrepancy** (what was
claimed vs. what you actually found, with file paths), or **not applicable this round**
(briefly say why). Report findings only — do not fix anything unless explicitly asked to.
