<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Codebase exploration: use codegraph, not raw grep/find

This repo has a `codegraph` index (`codegraph init` was run at this repo root). If your
tooling exposes codegraph's MCP tools, **prefer them over `grep`/`find`/`ls`/manual file
reads** for exploring the codebase - finding where a symbol/component/config value is
defined or used, tracing call sites, or getting an overview of a directory. Codegraph
gives structured, symbol-aware answers instead of text-matching guesses, which is faster
and less likely to miss references (e.g. re-exports, dynamic imports).

Fall back to plain Unix search only if codegraph's tools are unavailable in your session
(e.g. the index is stale/missing, or your harness hasn't loaded the MCP tools) or for
things codegraph doesn't cover, like searching prose in `TECHNICAL_SPEC.md`/`CHANGELOG.md`.

If codegraph's tools aren't showing up, that's a sign the index needs
`codegraph init` re-run at this repo root, followed by a new session - don't try to
work around it by reindexing or reconfiguring codegraph yourself.

**Session root must match this directory.** `.codegraph/` lives at
`aijwerkingen.github.io/.codegraph` (this repo's root). If your session was opened at a
*parent* workspace directory instead (e.g. a folder containing this repo as a subfolder),
codegraph will report no index even though one exists, because it's looking in the wrong
place. Open this repo directly as its own project root for codegraph to attach
(`PENDING-FIXES.md` P3-3).

## Surveys: where the sources and the live link live

Two different things, and mixing them up has already caused a production incident once:

- **Survey content versions** are checked in under `survey-doc/<YYYY-MM-DD>/` - the Qualtrics
  `.qsf` export plus a readable markdown export (`AIImpactRegistry-survey-content.md`). The
  markdown's `Source:` line names the Qualtrics survey it was exported from. Helper scripts
  (`qsf_to_text.py`, `merge_text_edits.py`) live in `survey-doc/`.
- **The live survey link is NOT in this repo.** It lives only in the Cloudflare Pages project
  environment (`QUALTRICS_SURVEY_URL`), and it changes whenever the survey is re-created in
  Qualtrics - so a URL written into a doc, config or comment goes stale silently. Never take a
  survey URL from repo code or docs. Read the live value from the running site instead:
  `curl https://aiimpactregistry.org/api/report-access` (returns `{"url":"..."}`, or 401 while a
  gate is closed). A survey's page title also identifies it - the current form is titled
  "AI Impact Registry".

`/report` embeds that URL through `functions/api/report-access.js` + `src/app/report/ReportGate.tsx`.
The Level-2 password gate is bypassed on a project by the Pages variable `DISABLE_PRODUCTION_GATE`
(together with `QUALTRICS_SURVEY_URL`); it was used for the 2026-11-24 production pilot and is now
unset everywhere, so **staging is password-gated and production serves no survey at all**. See
`PENDING-FIXES.md` P0-1/P0-2.
