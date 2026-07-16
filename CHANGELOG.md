# AMC-Larebish — Change Log & Phase Status Ledger

> **This file is the authoritative record of the project's current state.**
> Any agent (human or AI) resuming work **reads this file first**, then continues from the
> current phase. Append entries — never rewrite history. Protocol: `TECHNICAL_SPEC.md` §21.

---

## ▶ RESUME HERE (after you finalize the domain & product name)

You paused with the **name and domain undecided**. When you return having bought the domain
and picked the name, do this in order (full detail in `TECHNICAL_SPEC.md` §0.1):

1. **Read the "Phase status board" below** to see which phase is active and what's done.
2. **Edit `site.config.ts` only** — set `name`, `canonicalUrl` (final domain, no trailing slash),
   `logo`, and NAP. This one file feeds every title, meta tag, canonical, JSON-LD, sitemap,
   `robots.txt`, and `llms.txt`. (See §5.1 — nothing else hard-codes name/domain.)
3. **Set `NEXT_PUBLIC_SITE_URL`** to the same origin in each environment's secrets.
4. **Verify the final domain in Search Console** (human does this once) and submit the sitemap.
5. **Only then flip production to indexable** (criterion AC-DOMAIN). Non-prod stays `noindex`.
6. If you had gone live on a temporary domain, use the **migration checklist** in §5.2 instead.

**One-line rule:** the *name* can stay open at zero SEO cost; the *domain* must be final before
anything is indexed. This work is scheduled in **Phase 5**.

---

## Status vocabulary
`not_started → in_progress → blocked → in_review → done`

## Phase status board (keep this table current)

| Phase | Name | Status | Notes |
|-------|------|--------|-------|
| 0 | Foundations & scaffolding | in_progress | App scaffolded + builds; ADR files, CI, and the no-hardcoded-brand lint rule still pending |
| 1 | Informational site + SEO baseline | in_progress | Home + FAQ live; About/How-it-works/Privacy/Terms/Contact/Accessibility not started. Blocked-by: D11 (visual identity & copy, see spec §22) |
| 2 | Survey abstraction + Mode A (Qualtrics) | in_progress | Iframe embed working end-to-end with a sample survey; `SurveyProvider` interface, postMessage completion, CSP hardening, analytics event not yet built |
| 3 | Mode B (self-hosted, config-driven) | not_started | — |
| 4 | Compliance, privacy & security (launch gate) | not_started | Blocked-by: D3, D4 (see spec §22) |
| 5 | AEO/GEO + Search Console + launch | not_started | — |
| 6 | Future scope | not_started | Out of initial scope |

## Blocking items to closure (must be `done` before real-data launch)

- [ ] **D3** — Qualtrics DPA / EU storage sufficiency for special-category data (owner: DPO/legal)
- [ ] **D4** — DPIA completed; lawful basis + GDPR Art. 9 condition documented (owner: DPO/legal)
- [ ] **D-minors** — minors policy: minimum age, age-assurance, parental consent (owner: DPO/legal; new 2026-07-16, spec §13.1)
- [ ] **D-third-party** — moderation/retention policy for reports naming companies or individuals (owner: DPO/legal; new 2026-07-16, spec §13.1/§13.10)
- [ ] **Legal sign-off** on privacy notice, terms, accessibility statement
- [ ] **Security review** — 0 high/critical findings (DAST + SCA + header/CSP audit)

## Decisions of record (ADR index)

| ADR | Title | Status | File |
|-----|-------|--------|------|
| 001 | SSR/SSG mandatory for indexable content | proposed | docs/adr/0001-ssr-mandatory.md |
| 002 | Survey provider abstraction (qualtrics/native) | proposed | docs/adr/0002-survey-provider.md |
| 003 | Self-hosted questions from config file | proposed | docs/adr/0003-config-driven-questions.md |
| 004 | Content in versioned CMS/content layer | proposed | docs/adr/0004-content-layer.md |
| 005 | Anonymous-by-default, data minimisation | proposed | docs/adr/0005-anonymous-default.md |
| 006 | EU data residency | proposed | docs/adr/0006-eu-residency.md |
| 007 | Privacy-first analytics, no critical-path trackers | proposed | docs/adr/0007-privacy-first-analytics.md |
| 008 | Single `site.config` source of truth (name, domain, NAP) | proposed | docs/adr/0008-site-config-source-of-truth.md |
| 009 | Mode B backend: containerized Node + Postgres everywhere (local/staging/prod) via Docker; standard `DATABASE_URL`; no managed-DB vendor | proposed | docs/adr/0009-modeb-backend-datastore.md |
| 010 | Hosting topology: GitHub Pages = static `noindex` staging (P0–2); server host running the same Node+Postgres containers for full-stack staging (P3+) | proposed | docs/adr/0010-hosting-topology.md |

---

## Entry format (copy this block for every new entry)

```
### YYYY-MM-DD — Phase N — <author/agent>
- **Status change:** <phase> <old_status> → <new_status>
- **What changed:** <concise summary of work done / files touched>
- **Decisions:** <ADRs or choices made, with pointers>
- **Acceptance criteria progress:**
  - [ ] criterion 1
  - [x] criterion 2 (evidence: link / test name)
- **Blockers / risks:** <blocking items, owners, and what unblocks them>
- **Next actions:** <the exact next step for whoever resumes>
```

---

## Entries (newest at top)

### 2026-07-16 — Phase 0/1 — process + eng (Claude Code) — Scope change: product redefinition, reference purge, D1 rename, P0-1 deploy gate
- **Status change:** none to phase numbers. Board's "Blocking items to closure" gained two new
  rows: **D-minors**, **D-third-party** (both DPO/legal-owned, blocking).
- **What changed:** Per `PENDING-FIXES.md` (an audit produced against commit `828673d`), the
  project owner clarified this is **not** a pharmacovigilance platform — it is a service for
  reporting perceived adverse effects of **conversational AI tools and digital/social media**,
  and must carry **no references to Lareb/VAERS/FAERS/MHRA/VigiAccess/MotherToBaby-OTIS/Uppsala**
  or any other pre-existing reporting platform used as inspiration. Every prior entry in this
  ledger above this one describes the old (wrong) product; do not treat them as current framing,
  only as a historical record of what was actually built (the underlying code/architecture work
  they describe is still accurate).
  - Gated `.github/workflows/deploy.yml` to `workflow_dispatch` only (dropped the `push` trigger)
    so the repo can be pushed without auto-publishing a live public form before the Phase 4
    compliance gate (`PENDING-FIXES.md` P0-1).
  - Rewrote all user-facing copy in `layout.tsx`, `page.tsx`, `faq/page.tsx`, `report/page.tsx`
    to the real domain; replaced the medical-advice disclaimer with crisis signposting (113
    Zelfmoordpreventie for NL) shown in the footer and, more prominently, above the form on
    `/report`; added a non-operational-preview banner on `/report` (P0-4, P0-5, P1-14).
  - Purged every "Lareb"/analog-platform reference found by the audit's grep across app code,
    `README.md`, `TECHNICAL_SPEC.md`, `qualtrics-integration.md`, and the seed artifacts;
    renamed the Qualtrics `postMessage` sender token from `"amc-larebish-survey"` to
    `"aijwerkingen-survey"` (cheap now since Mode A isn't wired up yet) (P1-13).
  - Rewrote the seed artifacts (`survey.example.yaml` — entity model, `who_is_reporting`
    options, new `product_version`/`usage_context`/`usage_duration` fields, `pii` emphasis;
    `llms.example.txt`; `schema-examples.jsonld` — no medical schema.org type introduced;
    `robots.example.txt`; `survey.schema.json` `$id`/`title`) to the real domain (P1-15).
  - Restated `TECHNICAL_SPEC.md` §0 terminology note, §1 Context, §2.2 Non-goals, §6 (dropped
    `MedicalWebPage` from `/report`'s schema list per the P1-10 amendment — plain `WebPage`
    only), §7 Content requirements, the AEO guardrail in §11, and §13 Privacy & regulatory
    compliance (added minors and named-third-party analysis, flagged DSA/AI Act as an open
    legal question, kept Art. 9/D3/D4 unchanged and blocking) (P1-16, P1-17).
  - **Resolved D1**: brand name is **AIjwerkingen** (already the value in `site.config.ts`,
    so no app-code change was needed there — ADR-008 held). Updated the D1/D11 rows in §22 and
    `README.md`'s stale "temporary working name" note accordingly.
- **Decisions:** D1 resolved (AIjwerkingen). Added **D-minors** and **D-third-party** to §22 as
  new open, blocking decisions owned by DPO/legal — not resolved here, only identified and
  scoped, per `PENDING-FIXES.md` P0-5/P1-17.
- **Acceptance criteria progress:**
  - [x] Repo is safe to push without auto-publishing (P0-1).
  - [x] User-facing copy matches the real product (P0-4).
  - [x] Platform references purged from app code, docs, and seeds outside this ledger's history
        (verified via the audit's grep command; `CHANGELOG.md`'s own historical entries at the
        original lines 1/155/165/251 were deliberately left untouched — append-only, spec §21).
  - [ ] Crisis-line selection beyond the one NL default, and the full minors/third-party
        policies, still need DPO/legal/copy-owner sign-off — see Blockers below.
  - [ ] Engineering SEO baseline (sitemap, robots.ts, canonicals, OG tags, WebPage schema, 404
        page, CI, lint rule, SECURITY.md, ADR files) from `PENDING-FIXES.md` P1-1…P1-12 was
        **out of scope for this pass** and remains open.
- **Blockers / risks:** D3, D4 unchanged and still blocking real-data launch — the pivot does
  **not** reduce the Art. 9 burden (P1-17). New: **D-minors** and **D-third-party**, both
  blocking, both DPO/legal-owned. P0-2 (Qualtrics EU-region confirmation) and P0-3 (rotate the
  `.qualtrics` plaintext codes) remain open and are user/account-owner actions, not agent-doable.
- **Next actions:** Commission the DPO/legal review of the restated §13 (D3, D4, D-minors,
  D-third-party) and decide the actual crisis-line list per locale beyond the NL placeholder
  already in the footer/`/report`. Separately, work through the remaining P1 engineering items
  (sitemap/robots.ts/canonicals/OG/404/CI/lint/SECURITY.md/ADRs) whenever that pass is picked up.

### 2026-07-16 — Phase 0 — process (Claude Code) — REVIEW.md: added mobile-responsiveness + codegraph checks
- **Status change:** none.
- **What changed:** User caught two gaps in the freshly-added `REVIEW.md` by directly
  asking whether it covered them — it didn't:
  - **Mobile responsiveness** was entirely absent from the checklist, despite the spec's
    own success criteria (§2.3, §16) being measured on a mobile Lighthouse profile. Added
    item 10: resize to a mobile viewport (~375–414px) for every route under review, confirm
    layout/nav/CTAs don't break and there's no horizontal scroll, and specifically confirm
    the `/report` survey embed is usable at that width, not just present. Screenshot both
    desktop and mobile as evidence.
  - **Codegraph usage** wasn't referenced at all, even though `AGENTS.md` already tells
    agents working in this repo to prefer codegraph's MCP tools over raw `grep`/`find`.
    Added a tooling note in section 1 pointing the reviewing agent at that same convention,
    with the same Unix-search fallback if codegraph's tools aren't attached in-session.
- **Decisions:** none new.
- **Blockers / risks:** unchanged.
- **Next actions:** unchanged. Worth remembering when adding future checklist-style docs:
  cross-check them against both the spec's stated success criteria and this repo's own
  standing tooling conventions before considering them complete.

### 2026-07-16 — Phase 0 — process (Claude Code) — added REVIEW.md; fixed a README regression
- **Status change:** none.
- **What changed:**
  - Added **`REVIEW.md`** — a reusable, phase-agnostic protocol for a cold agent (no prior
    session context) to independently audit whatever's been completed at any point in the
    project. Unlike a one-off review prompt, it derives scope from the live Phase status
    board in this file rather than hardcoding a phase, so the same file is valid after
    Phase 0 or after Phase 5. Pointed to it from `README.md`'s "Read these in order" list.
  - **Found and fixed a regression from the Phase 0 scaffold step** (the entry two below,
    "first deployable slice"): the `rsync` used to merge the freshly `create-next-app`'d
    project into the repo root **silently overwrote the original `README.md`**
    (the one with "Read these in order," the `SurveyProvider` explainer, the starter-artifact
    list) with `create-next-app`'s generic Next.js boilerplate. This went unnoticed until
    now. Restored the original content from the conversation record, corrected its
    starter-artifact paths to match where those files actually live (flat at repo root, not
    under a `config/` subfolder as the original text assumed — a pre-existing inaccuracy,
    also now fixed), and folded in a short "Local development" section (`npm run dev`,
    static-export build check) that's genuinely useful and wasn't in the original.
  - Confirmed via the original file list that **no other file was affected** by that same
    `rsync` — `README.md` was the only path that collided between the scaffold output and
    the pre-existing project files.
- **Decisions:** none new.
- **Blockers / risks:** unchanged. Worth noting as a general lesson: a directory-merge step
  (rsync/cp over an existing tree) can silently clobber files sharing a name with generated
  scaffolding — worth an explicit diff/conflict check next time this pattern is used.
- **Next actions:** unchanged.

### 2026-07-16 — Phase 0 — tooling note (Claude Code) — agents should prefer codegraph over grep/find
- **Status change:** none.
- **What changed:** Added a section to `AGENTS.md` (also picked up via `CLAUDE.md`, which
  imports it) instructing agents to prefer **codegraph's MCP tools** over raw `grep`/`find`/
  manual reads when exploring this codebase, with a fallback to Unix search only if
  codegraph's tools aren't available in a given session. This assumes `codegraph init` has
  been run at this repo root (user-run, per this agent's operating rules — not run by the
  agent itself) and a fresh session started so the tools attach.
- **Decisions:** none new.
- **Blockers / risks:** unchanged.
- **Next actions:** unchanged.

### 2026-07-16 — Phase 0 — reorg (Claude Code) — repo root moved to match the GitHub repo name
- **Status change:** none.
- **What changed:** Everything git-worthy (app code, config, `.github/workflows`,
  `.claude/`, `CLAUDE.md`/`AGENTS.md`, this file, `TECHNICAL_SPEC.md`, `README.md`, and the
  starter/reference artifacts — `survey.example.yaml`, `survey.schema.json`,
  `robots.example.txt`, `llms.example.txt`, `schema-examples.jsonld`,
  `qualtrics-integration.md`) moved from the parent working directory into a new subfolder
  **`aijwerkingen.github.io/`**, named to match the actual GitHub repo
  (`aijwerkingen.github.io`) so a future `git clone` lands in a directory with the same name
  as what's here now. **This file (`CHANGELOG.md`) is now at
  `aijwerkingen.github.io/CHANGELOG.md`.**
  - The parent directory (`AMC-Larebish/`) is now a **workspace, not part of the repo** — for
    reference material, exploration assets, anything that shouldn't be checked in. It is not
    (and is not intended to become) a git repository itself.
  - `node_modules/`, `.next/`, and `out/` were **not** moved — deleted and regenerated fresh
    inside the new location (`npm install` + `npm run build`, both verified green) rather than
    risking a stale/broken move.
  - The **`.qualtrics` secrets file was deliberately left in the parent workspace**, not moved
    into the repo folder — even git-ignored, it shouldn't sit inside a git repo directory.
    Still unresolved: move it to a password manager and delete it (flagged in the prior entry).
  - `.claude/launch.json` (used by this agent's browser-preview tooling) had to be recreated
    at the **fixed session root** (`AMC-Larebish/.claude/launch.json`) with its `serve` command
    updated to point at `aijwerkingen.github.io/out` — the preview harness resolves that file
    relative to the session root, not the moved subfolder. The copy that moved with the repo
    (`aijwerkingen.github.io/.claude/launch.json`, pointing at plain `out`) is left as-is and
    is correct for when this folder is later opened directly as its own project root.
  - Verified post-move: `npm install` and `npm run build` both succeed from
    `aijwerkingen.github.io/`, and all three routes were re-checked in-browser with no
    regressions.
- **Decisions:** none new.
- **Blockers / risks:** unchanged (D3, D4). `.qualtrics` cleanup still outstanding (user-owned).
- **Next actions:** unchanged from the prior entry — confirm before `git init`/push; continue
  Phase 0 (ADRs, CI, lint rule) or Phase 1 pages per user priority.

### 2026-07-16 — Phase 0/1/2 — build (Claude Code) — first deployable slice: scaffold + Home/FAQ/Report
- **Status change:** Phase 0 `not_started → in_progress`; Phase 1 `not_started → in_progress`;
  Phase 2 `not_started → in_progress`.
- **What changed:**
  - Scaffolded the app in the repo root with `create-next-app` (Next.js 16, App Router,
    TypeScript, Tailwind v4, ESLint). `package.json` name `aijwerkingen`.
  - `next.config.ts`: `output: "export"` (static export — required, GitHub Pages has no
    server runtime) and `images.unoptimized: true` (no image-optimization server available
    under static export).
  - **Working name/domain applied as real placeholders**, not `example.org`:
    `src/site.config.ts` — `name: "AIjwerkingen"`, `canonicalUrl: "https://aijwerkingen.github.io"`,
    `indexable: false`. This is a **user/org GitHub Pages repo** (`aijwerkingen.github.io`),
    which deploys at the **root** — no `basePath` needed, unlike project-pages repos.
  - Built `/` (hero + CTA + trust signals), `/faq` (12 answer-first Q&A pairs +
    `FAQPage` JSON-LD, spec §7/§11), `/report` (Mode A: responsive iframe embedding the
    **sample** Qualtrics survey at `SV_aVpwAHDeyg456No`, `referrerpolicy="no-referrer"`,
    accessible `title`, fallback "open in new tab" link per spec §8.3). Sitewide
    `Organization`+`WebSite` JSON-LD in the root layout, derived from `site.config`.
  - Root layout sets `robots: { index: false, follow: false }` from `site.config.indexable`;
    added `public/robots.txt` (disallow-all) and `public/.nojekyll`. Enforces ADR-010 (this
    deploy stays out of the index).
  - Verified with a real `npm run build` (static export succeeded) and a local static-server
    preview in-browser: all three routes render correctly, and **the live sample Qualtrics
    survey loads and is interactive inside the iframe** — confirmed no console errors.
  - Caught and fixed a real bug during preview: a classic JSX whitespace-collapse issue
    (`{siteConfig.name} lets you…` wrapped across source lines lost its leading space,
    rendering "AIjwerkingenlets…") — fixed with an explicit `{" "}`. Root cause and fix
    pattern noted inline; the FAQ page already used this pattern defensively.
  - Added `.github/workflows/deploy.yml` (build + `actions/deploy-pages`) — **created but
    not pushed**; publishing to the public `aijwerkingen.github.io` repo requires explicit
    user go-ahead per this agent's operating rules.
  - **Found and excluded a secret:** a pre-existing `.qualtrics` file in the working
    directory contained plaintext Qualtrics account backup codes. Added `.qualtrics` to
    `.gitignore` before any `git add`. **User was told directly to move these codes to a
    password manager and delete the file** — it should not persist in a project folder at
    all, ignored or not.
  - Removed the unused `create-next-app` template assets (`next.svg`, `vercel.svg`, etc.)
    and the default Geist Google-Fonts wiring (kept the build free of a fonts.google.com
    fetch at build time; using a system-font stack instead).
- **Decisions:** None new. Applied D1 (name) and D9 (domain, temporary) as **explicit
  placeholders**, per spec §5.1/§5.2 — both remain open decisions in §22 until finalized;
  swapping either is still the one-file `site.config.ts` edit described in §0.1.
- **Known gaps / not done in this pass:**
  - ADR files under `docs/adr/*.md` (001–010) not yet written as standalone files — only
    the index rows in this changelog exist so far.
  - The no-hardcoded-brand/domain lint/build check (Phase 0 acceptance criterion) not yet added.
  - CI (typecheck/lint/build on PR) not yet wired up.
  - Only 3 of the ~10 routes in spec §6 exist (`/`, `/faq`, `/report`); About, How-it-works,
    Privacy, Terms, Contact, Accessibility, News are not started.
  - `/report` is a bare iframe: no `SurveyProvider` abstraction yet, no postMessage
    completion/thank-you state, no CSP `frame-src` hardening, no analytics conversion event —
    all real Phase 2 work per spec §8.3 and `qualtrics-integration.md`.
  - D11 (visual identity & copy) still open — current styling is plain Tailwind, not a
    designed identity.
- **Blockers / risks:** unchanged (D3, D4). New minor risk noted: real secrets (`.qualtrics`
  backup codes) were found sitting unencrypted in the project directory — flagged to the user,
  not a code issue but worth a habit fix.
- **Next actions:** Confirm with the user before pushing `main` / enabling GitHub Pages
  (publishing to a public URL needs explicit go-ahead). Then continue Phase 0 (ADRs, CI,
  lint rule) and/or keep building out Phase 1 pages, per user priority.

### 2026-07-16 — Phase — planning (Claude Code) — visual identity & content authoring flagged as open (D11)
- **Status change:** none. Phase 1 board note updated to flag it as blocked-by D11 (soft
  block — Phase 1 can start, but should not be marked `done` with D11 unresolved).
- **What changed:** Added **D11** to the open-decisions register (spec §22): visual identity
  (logo, palette, typography, imagery/illustration style) and actual page copy authorship.
  Added a callout in Phase 1 scope (spec §20) noting that Lighthouse/a11y/SEO scores do not
  certify a "modern-looking" site — the spec fixes toolchain (Tailwind + headless components,
  §5) and copy *voice* (answer-first, disclaimers, §7), but never assigns a copy author or a
  visual design pass. Without resolving D11, Phase 1 will ship architecturally correct but
  visually unstyled pages (default component styling, no imagery, no brand identity).
- **Decisions:** none yet — D11 is logged as open, not resolved. Suggested resolution path:
  assign a copy author, and pick a design pass or a mood-board decision anchored to the
  studied reference sites (lareb.nl, VAERS, MHRA Yellow Card, VigiAccess, §0).
- **Blockers / risks:** D11 added as a **soft block on calling Phase 1 `done`** (not a hard
  gate like D3/D4). Existing blockers unchanged.
- **Next actions:** Resolve D11 before or during Phase 1 execution — do not let it fall through
  silently just because CI (Lighthouse/a11y/SEO) is green.

### 2026-07-16 — Phase — planning (Claude Code) — drop Supabase; Docker+Postgres everywhere
- **Status change:** none (still `not_started`). **Supersedes the Supabase portion** of the
  entry below; ADR-009/010 index rows updated to current state.
- **Decisions:**
  - **ADR-009 (amended) — no managed-DB vendor.** **Supabase is dropped entirely.** Mode B uses
    a **containerized Node service + PostgreSQL for local, staging, and production** — the same
    Docker image/stack in every environment (`docker-compose` locally; the same containers on a
    server host for staging/prod). Environments differ **only by `DATABASE_URL`** (and other
    per-env secrets). Data access stays ORM + versioned SQL migrations over a standard connection
    string. Rationale: **dev/prod parity** (identical Postgres version, `pgcrypto` encryption,
    migrations), no vendor lock-in, one mental model.
  - **ADR-010 (amended).** Full-stack staging (Phase 3+) runs **the same Node+Postgres
    containers** on a server host (not a managed DB). GitHub Pages remains the static `noindex`
    staging tier for Phases 0–2 only.
- **Compliance note:** prod Postgres container must run in an **EU region** (ADR-006). Staging
  uses **non-real/test data** (§19), so residency is non-blocking there.
- **Blockers / risks:** unchanged (D3, D4).
- **Next actions:** Begin **Phase 0**. In Phase 3, ship a `docker-compose.yml` (Node + Postgres)
  for local/staging and keep data access as ORM + migrations over `DATABASE_URL`.

### 2026-07-16 — Phase — planning (Claude Code) — backend & hosting decisions blocked
- **Status change:** none (still `not_started`). No code yet; decisions recorded in the ADR
  index above. Full ADR files (009, 010) to be written in Phase 0 alongside 001–008.
- **Decisions:**
  - **ADR-009 — Mode B backend & datastore.** Mode B runs as a **containerized Node service
    + PostgreSQL**. Data access is **vanilla Postgres via an ORM + versioned SQL migrations
    over a standard `DATABASE_URL`** — **no Supabase-proprietary coupling** (no `supabase-js`,
    Supabase Auth, Storage, Edge Functions, or RLS-as-app-authz on the critical path).
    **Non-prod (staging/test) uses Supabase (EU region); production uses self-hosted/managed
    EU Postgres (Docker).** Because Supabase *is* Postgres, moving between them is a
    **`DATABASE_URL` + redeploy**, not a rewrite. Keeps ADR-006 (EU residency) intact and
    makes the env swap config-only.
  - **ADR-010 — Hosting topology / staging.** **GitHub Pages hosts the static informational
    build (Phases 0–2) as a permanently-`noindex` preview/staging tier.** GitHub Pages cannot
    run a server, so **full-stack staging (Phase 3+, Mode B) runs on a server host with
    Supabase**, and production on an EU server host. "GitHub Pages = staging" applies to the
    **static tier only**; a second, full-stack staging env appears at Phase 3.
- **Clarification (answer to "how hard is switching to Mode B?"):** Two distinct switches —
  (1) **`SURVEY_PROVIDER=qualtrics→native`** is one env var + redeploy, but only *after* Mode B
  is built in **Phase 3** (native form renderer from config, `POST /api/submissions`,
  validation, migrations, anti-abuse, encryption, audit log — real code, one-time).
  (2) **Supabase↔self-hosted Postgres** is `DATABASE_URL` + redeploy given ADR-009's no-lock-in
  rule. **Neither switch is a rewrite;** *building* Mode B (Phase 3) is the real work.
- **Blockers / risks:** unchanged (D3, D4). Note: if Supabase were ever used for **prod real
  data** it would need EU region + DPA review (§13, ADR-006) — avoided by self-hosting prod.
- **Next actions:** Begin **Phase 0**; write ADR-009/010 files with 001–008. In Phase 3, keep
  the data layer ORM + migrations over `DATABASE_URL` so the Supabase→prod swap stays config-only.

### 2026-07-12 — Phase — spec author (Claude) — Qualtrics runbook added
- **Status change:** none (still `not_started`).
- **What changed:** Added **`docs/qualtrics-integration.md`** — a step-by-step Mode A
  runbook covering (Part A) creating & configuring the survey in Qualtrics
  (anonymize responses, invitation-off, publish/activate, get the anonymous link,
  optional embedded-data correlation, completion-detection JS), (Part B) app
  integration (env config, CSP `frame-src`, responsive iframe, origin-checked
  `postMessage` completion → thank-you + analytics, a11y fallback), and (Part C)
  testing + a launch checklist, plus a troubleshooting table. Referenced it from
  spec §8.3, Phase 2, and Appendix G, and from the README.
- **Decisions:** none new. Reiterates that in Mode A data lives in Qualtrics, so the
  DPA/EU-data-centre review (D3) is the blocking go-live check.
- **Blockers / risks:** unchanged (D3, D4).
- **Next actions:** unchanged — begin Phase 0. Part B of the runbook is built in Phase 2;
  the real survey + launch checklist land with Phase 4/5.

### 2026-07-12 — Phase — spec author (Claude) — spec update
- **Status change:** none (still `not_started`; specification refined).
- **What changed:** Added the **`site.config` single-source-of-truth** design (ADR-008,
  spec §5.1) so brand name + domain are a one-file change; added **domain policy** (§5.2)
  and the **AC-DOMAIN** acceptance criterion (§2.3) requiring the final domain before any
  indexing. Wired these into Phase 0 (create `site.config` + no-hard-coded-literals check),
  Phase 1 (non-prod `noindex`), and Phase 5 (finalize name/domain, then flip indexable).
  Added the **"START HERE when you resume after finalizing the domain & name"** callout
  (spec §0.1) and the **▶ RESUME HERE** block at the top of this file. Updated D1 (name —
  configurable, zero SEO cost) and D9 (final domain — must precede indexing).
- **Decisions:** ADR-008 added as *proposed*.
- **Blockers / risks:** unchanged — D3, D4 remain the real-data launch gates.
- **Next actions:** Begin **Phase 0**. When the domain/name are chosen later, follow
  **▶ RESUME HERE** above (executed within Phase 5).

### 2026-07-12 — Phase — spec author (Claude)
- **Status change:** project created; all phases `not_started`.
- **What changed:** Authored `TECHNICAL_SPEC.md` and supporting artifacts
  (`README.md`, `config/survey.example.yaml`, `config/survey.schema.json`,
  `config/robots.example.txt`, `config/llms.example.txt`,
  `config/schema-examples.jsonld`, `.env.example`).
- **Decisions:** Drafted ADR-001…007 as *proposed* (to be committed as files in Phase 0).
  Core architecture = SSR + `SurveyProvider` abstraction switchable via `SURVEY_PROVIDER`;
  self-hosted questions externalised to `config/survey/*.yaml`.
- **Acceptance criteria progress:** n/a (specification only; no phase started).
- **Blockers / risks:** D3 (Qualtrics DPA/EU storage) and D4 (DPIA/lawful basis) are
  blocking gates for real-data launch — see spec §22. Final brand name (D1) and survey
  questions (D8) are open but do **not** block the informational site.
- **Next actions:** Begin **Phase 0** — stand up the repo/SSR scaffold and CI, write
  ADR files, initialise environments. Update the phase board and append an entry when done.
