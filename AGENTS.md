<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes - APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
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
