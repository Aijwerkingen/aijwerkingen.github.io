# AMC-Larebish - Change Log & Phase Status Ledger

> **This file is the authoritative record of the project's current state.**
> Any agent (human or AI) resuming work **reads this file first**, then continues from the
> current phase. Append entries - never rewrite history. Protocol: `TECHNICAL_SPEC.md` §21.

---

## ▶ RESUME HERE (after you finalize the domain & product name)

You paused with the **name and domain undecided**. When you return having bought the domain
and picked the name, do this in order (full detail in `TECHNICAL_SPEC.md` §0.1):

1. **Read the "Phase status board" below** to see which phase is active and what's done.
2. **Edit `site.config.ts` only** - set `name`, `canonicalUrl` (final domain, no trailing slash),
   `logo`, and NAP. This one file feeds every title, meta tag, canonical, JSON-LD, sitemap,
   `robots.txt`, and `llms.txt`. (See §5.1 - nothing else hard-codes name/domain.)
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
| 2 | Survey abstraction + Mode A (Qualtrics) | in_progress | Bare iframe embed only (of its acceptance criteria - `SurveyProvider` interface, postMessage completion, CSP `frame-src`, analytics event, integration test - only the a11y fallback link is done). Running ahead of the Phase 4 gate that governs real submissions; not deployable for real data until D3/D4/D-minors/D-third-party close |
| 3 | Mode B (self-hosted, config-driven) | not_started | - |
| 4 | Compliance, privacy & security (launch gate) | not_started | Blocked-by: D3, D4 (see spec §22) |
| 5 | AEO/GEO + Search Console + launch | not_started | - |
| 6 | Future scope | not_started | Out of initial scope |

## Blocking items to closure (must be `done` before real-data launch)

- [ ] **D3** - Qualtrics DPA / EU storage sufficiency for special-category data (owner: DPO/legal)
- [ ] **D4** - DPIA completed; lawful basis + GDPR Art. 9 condition documented (owner: DPO/legal)
- [ ] **D-minors** - minors policy: minimum age, age-assurance, parental consent (owner: DPO/legal; new 2026-07-16, spec §13.1)
- [ ] **D-third-party** - moderation/retention policy for reports naming companies or individuals (owner: DPO/legal; new 2026-07-16, spec §13.1/§13.10)
- [ ] **Legal sign-off** on privacy notice, terms, accessibility statement
- [ ] **Security review** - 0 high/critical findings (DAST + SCA + header/CSP audit)

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
| 011 | CSP/security-header gap on GitHub Pages: interim `<meta>` CSP now; `frame-ancestors`/HSTS/`X-Content-Type-Options` deferred to the Phase 3+ server host; Phase 1/2 header-scanner acceptance criteria scoped accordingly | proposed | docs/adr/0011-csp-header-hosting-contradiction.md |

---

## Entry format (copy this block for every new entry)

```
### YYYY-MM-DD - Phase N - <author/agent>
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

### 2026-08-20 - Phase 2 - eng (Hermes) - internal auth gate for staging (docs/INTERNAL_AUTH_PLAN.md)

- `functions/_middleware.js` (new): Cloudflare Pages Function — HTTP Basic Auth, password-only (username ignored), constant-time SHA-256 compare. Active only when the `INTERNAL_PASSWORD` secret is set, so it is inert on main/prod.
- `eslint.config.mjs` + `tsconfig.json`: `functions/**` ignored by lint and excluded from type-check (repo guardrails from the plan).
- `.github/workflows/deploy.yml`: GitHub Pages deploy replaced with wrangler direct-upload to new CF Pages project `aisafetywatch-internal` (production branch `staging`).
- Net effect: staging moves from `aijwerkingen.github.io` (ungated) to `internal.aisafetywatch.com` behind one shared password; GitHub Pages to be retired once the internal deploy is verified.

### 2026-08-20 - Phase 2 - eng (Hermes) - staging survey embed pointed at a new Qualtrics form (owner direction)

- `src/app/report/page.tsx` fallback updated: `SV_eA4y9ucLih6un8a` (host `qualtricsxmwdy4hl99w`) → `SV_ddoaHNEsGsbDnwi` (host `qualtricsxm6gyvfq8rn.qualtrics.com`). No `.env` override exists in CI, so this fallback is the effective URL on Pages.
- CSP `frame-src https://*.qualtrics.com` already covers the new host; no `layout.tsx` change needed.
- **P0 gates unchanged and still open:** D3 (Qualtrics DPA/EU storage) and D4 (DPIA / Art. 9 basis) unresolved; new host is still a bare brand host with no `.eu.` segment (US datacenter), so P0-2 (ADR-006 EU residency) still applies. Not deployable for real submissions until Phase 4 closes.

### 2026-07-16 - Phase 1 - build (Claude Code) - remaining page set scaffolded: /about, /how-it-works, /contact + draft /privacy, /terms, /accessibility
- **Status change:** none to the board. Phase 1's page table (spec §5) is now complete
  except `/news`; every route in that table exists, is linked, and emits its specified
  JSON-LD type. Phase 1 stays `in_progress` (blocked-by D11's copy half).
- **What changed:**
  - **New routes** (13 total build, all static): `/about` (`AboutPage`),
    `/how-it-works` (`HowTo`), `/contact` (`ContactPage`), `/privacy`, `/terms`,
    `/accessibility` (all `WebPage`) - the JSON-LD types the spec's §5 table specifies.
    Footer reorganised into **Site** and **Legal** columns; header nav is now
    About / FAQ / CTA.
  - **Institutional provenance (`siteConfig.research`)** - institution, department,
    principal investigator, ethics approval, DPO email, institution URL. **All empty,
    and empty means omitted, never a rendered placeholder** (same rule as `legalName`).
    Verified both ways: filling the six fields makes the Governance block appear on
    `/about`, the attribution line appear in the footer, and the DPO address flow into
    `/privacy`, `/contact` and `/accessibility`; clearing them removes every trace. This
    is the credibility surface the site was missing - it is a research instrument and
    nothing on it said so.
  - **Legal drafts**, written at the owner's explicit direction ("full draft for the DPO
    to redline"). They deliberately assert specifics nobody has approved; each is marked
    `TODO(D4)` / `TODO(D3)` / `TODO(D-minors)` / `TODO(D-third-party)` at its exact site,
    so the DPO's redline maps 1:1 onto a code change. **The retention period (five years)
    is an invented placeholder and must be replaced, not merely reviewed.**
- **Decisions:** added **`siteConfig.legal.approved`** (default `false`) as the sign-off
  gate - Claude Code's addition, flagged to the owner rather than silently included.
  While false: each legal page renders a visible "Draft for review - not yet in force"
  notice, and is **forced `noindex` independently of `siteConfig.indexable`**, so an
  unapproved notice cannot be indexed even after the site is flipped indexable at Phase
  5. The sitemap excludes the three drafts off the same flag, so the two cannot drift.
  Verified by building with `indexable: true`: public pages became `index, follow` while
  the drafts held at `noindex, follow` and the sitemap stayed at 6 entries. Sign-off is
  then a one-line edit that removes the banner, restores indexing, and adds them to the
  sitemap together.
- **Acceptance criteria progress:** `/accessibility` deliberately makes **no conformance
  claim** - Phase 1's WCAG AA gate has not been run, and "partially conforms" is a
  defined, legally meaningful term for a public/health body. It states the AA target, the
  absence of an audit, and one real known limitation (the third-party Qualtrics iframe is
  unaudited and outside our control). Replace when the audit exists.
- **Blockers / risks:** unchanged, and the previous entry's warning still stands. The
  drafts do **not** close D3/D4/D-minors/D-third-party - they are inputs for the DPO, and
  each open decision is now visible as a TODO in the page that depends on it. Note
  `/privacy` and `/terms` still say the minors and named-third-party policies are "being
  finalised": those are true statements about open decisions, not preview framing.
- **Next actions:** (1) DPO/legal to redline the three drafts, resolve every TODO, then
  set `legal.approved: true` + `legal.lastReviewed`. (2) Fill `siteConfig.research` when
  the formal details and authorisations land - one file, no component changes. (3) Run
  the a11y audit and replace the status section in `/accessibility`.

### 2026-07-16 - Phase 1 - copy + positioning (Claude Code, at product owner's direction) - reframed from "side effects" to distress; preview/placeholder framing removed from the UI
- **Status change:** none to the phase board. **⚠️ This entry records a deliberate
  discrepancy - read the blockers section before acting on it.**
- **What changed:**
  1. **Terminology: the pharmacovigilance framing is gone.** The product owner's
     reasoning: *this is not a drug, it is digital use* - what we collect is **feelings
     of distress during or after use**, not "side effects" or "adverse effects". Every
     user-facing string changed accordingly: the CTA is now **"Report your experience"**
     (was "Report a side effect"); H1 is **"Feeling worse after using an AI tool or
     social media?"**; the FAQ's lead question is "What should I report?" and now names
     distress, anxiety, low mood, sleep trouble rather than "unexpected or unwanted
     effects". `siteConfig.tagline`, both page `<title>`s and both meta descriptions
     follow. No brand literals were added (ADR-008 lint still clean).
  2. **Home section heading** is now *"For you alone, it may be a feeling. Together
     they are a signal."* (was "A single report is a data point…") - owner's wording.
  3. **Preview framing removed from the UI:** the site-wide "Preview site - reports
     are not yet monitored" strip, the `role="alert"` "non-operational preview" block on
     `/report` (which was **pre-existing repo code**, not added by the design pass), the
     "once this preview is fully operational" hedges on the home cards and in the FAQ,
     and the footer's "Placeholder deployment" line are all gone. The platform is
     presented as operational.
  4. **`organization.legalName` is now `""`** in `site.config.ts` instead of
     `"… (placeholder legal name - TODO)"`. That string was being published in the
     **Organization JSON-LD on every page** - it survived removal from the footer.
     JSON-LD now falls back to the brand name (`legalName || name`), matching the
     `email || undefined` idiom already in that file. Nothing is fabricated; the field
     is simply empty until an entity is registered.
- **Decisions:** The **crisis notice stays** in the footer and on `/report` - it was not
  in scope of the "remove the preview notion" instruction and is a safety net, not a
  readiness disclaimer. The FAQ's crisis answer now also states that **reports are not
  read in real time**, which is an operational fact about asynchronous reporting rather
  than a preview caveat, and it is what routes an at-risk person to 113 instead of here.
  Minors (D-minors) and third-party-naming (D-third-party) policy answers were left as
  "still being finalized" - those are open policy decisions, not preview framing.
- **Acceptance criteria progress:** unchanged. `indexable: false` / `noindex` is
  **untouched** - AC-DOMAIN gates indexing on the final domain (D9), which is unrelated
  to the readiness framing and still open.
- **Blockers / risks - READ THIS:** the UI now presents a fully operational service,
  while **this ledger still records Phase 4 (compliance/privacy/security - the launch
  gate) as `not_started`, blocked on D3 (Qualtrics DPA / EU storage) and D4 (DPIA +
  lawful basis)**, and the board note on Phase 2 still says "not deployable for real data
  until D3/D4/D-minors/D-third-party close". The owner has asserted the platform is
  ready; that assertion has **not** been reconciled with these records. Either the phase
  board and §22 are stale and should be updated, or the UI is now ahead of the
  compliance gate - inviting distressed people to submit special-category data. This is
  a product/legal call, not an engineering one. Also note `/report` still embeds the
  **sample** Qualtrics survey unless `NEXT_PUBLIC_QUALTRICS_SURVEY_URL` is set.
- **Next actions:** (1) Owner/DPO to reconcile the phase board + D3/D4 with the
  now-operational framing. (2) Point `NEXT_PUBLIC_QUALTRICS_SURVEY_URL` at the real
  anonymous link. (3) Set `organization.legalName` + NAP. (4) Note the supplied
  `opengraph-*.png` artwork still reads "Report perceived adverse effects of
  conversational AI tools" - the OG image now contradicts the site copy and needs
  re-exporting.

### 2026-07-16 - Phase 1 - design + eng (Claude Code) - visual identity applied (D11 partial); icon set bundled; temporary brand-preview drawer
- **Status change:** none. Phase 1 stays `in_progress`. **D11 is partially resolved**
  (visual identity: logo, palette, typography, component styling - now implemented);
  the **content-authoring half of D11 remains open**, so Phase 1 is still blocked-by D11
  and the board note is unchanged.
- **What changed:**
  - **Icon set relocated** from `icon-set/` (repo root, unreferenced) to
    `public/brand/<brand>/<theme>/` - a 2×2 matrix of (name × colour-way). Under
    `output: "export"` everything in `public/` is copied verbatim into `out/`, so the
    assets need no bundler step and are addressable by a derived path. Moved with
    `git mv` (history preserved); all 4×12 files verified present in `out/`.
  - **Design tokens** (`src/app/globals.css`): every colour is *sampled from the
    supplied artwork* rather than invented - ink `#121E18`, muted `#596760`, line
    `#D8E0DC`, dark `#0D1914`, warm accent `#BB5752`, teal accent `#008760`. The two
    colour-ways share all neutrals and differ only in a four-property accent ramp.
  - **Typography:** Nunito (wordmark/headings) + Nunito Sans (body) via `next/font`,
    matching the lockup artwork and self-hosted at build time - no runtime third-party
    request, so the CSP needs no `font-src` exception.
  - **Restyled** header, footer, home, FAQ (now a no-JS `<details>` accordion), report,
    and 404. Added a site-wide preview status strip and promoted the crisis notice from
    small print to its own bordered block (spec §7 voice).
  - **`site.config.ts` remains the single source of truth (ADR-008):** brand variants,
    the wordmark's two-tone split, favicon/OG assets and their *real* pixel dimensions
    now live there. The ESLint brand-literal ban still passes with no new exemptions.
  - **`src/app/favicon.ico` deleted** (Next's default placeholder); the tab icon now
    derives from the brand icon set via `metadata.icons`.
  - **JSON-LD `logo` is now emitted** - the D11 TODO in `site.config.ts` blocked it
    only because no logo asset existed. One now does.
- **Decisions:** No new ADR. Two worth recording:
  1. The **brand-preview drawer is explicitly temporary** and has exactly one entry
     point - `<AdminDrawer />` in `src/app/layout.tsx`. Deleting that line plus
     `src/admin/` removes it; `useBrand()` then falls back to the `site.config.ts`
     default, so nothing else breaks.
  2. The preview overrides **rendered brand only**. Titles, JSON-LD, canonical, sitemap,
     OG image and favicon are generated at build time and deliberately keep the default
     name, so crawler-visible identity stays single-sourced (ADR-008) and AC-DOMAIN is
     unaffected.
- **Acceptance criteria progress:** helps Phase 1's "modern-looking site" gate (spec
  §20) - visual identity now exists and is applied. Not yet measured: Lighthouse ≥95,
  WCAG AA automated pass, Rich Results. Accent text uses a darkened `--accent-strong`
  (~6.6:1) because the raw brand accents sit at ~4.5:1 on white - enough for fills and
  large text but with no headroom for body copy.
- **Blockers / risks:** D11's copy half is unresolved - page copy is still
  engineer-drafted and needs the assigned author. `legalName`, `email` and NAP in
  `site.config.ts` are still placeholders. D1 remains resolved in favour of
  AIjwerkingen; AdverseAI is kept only as a previewable alternative.
- **Next actions:** (1) Assign the copy author to close D11's content half. (2) Once the
  name is locked, delete `src/admin/` + its one line in `layout.tsx`. (3) Run Lighthouse
  and an automated a11y pass against the Phase 1 gate.

### 2026-07-16 - Phase 0/1 - eng (Claude Code) - Pure-engineering fixes bucket from PENDING-FIXES.md (P1-1…P1-12, P2-1…P2-7, P3-1…P3-4)
- **Status change:** none to phase numbers, but Phase 2's board note (above) was corrected in
  place to reflect that only the a11y fallback link of its acceptance criteria is actually
  done (see P3-4 below).
- **What changed:** Worked through the "pure engineering" bucket flagged as still-open in the
  prior entry, per `PENDING-FIXES.md`'s suggested order. All items verified with
  `npx tsc --noEmit`, `npm run lint`, and a clean `npm run build` (static export, all 6 routes
  prerendered `○`, confirmed by inspecting `out/*.html` directly) unless noted otherwise.
  - **P1-2:** `.gitignore`'s `.env*` rule was silently swallowing `.env.example`. Added
    `!.env.example` and created `.env.example` (`NEXT_PUBLIC_SITE_URL`, `SURVEY_PROVIDER`,
    `NEXT_PUBLIC_QUALTRICS_SURVEY_URL`, `NEXT_PUBLIC_QUALTRICS_ORIGIN`, `DATABASE_URL`
    placeholder). Verified with `git check-ignore -v .env.example` (no match).
  - **P1-4/P1-5:** Deleted the hand-written `public/robots.txt` (hardcoded `Disallow: /`,
    couldn't react to `siteConfig.indexable`) and added `src/app/robots.ts` +
    `src/app/sitemap.ts` as Next metadata routes deriving from `site.config`. Both need
    `export const dynamic = "force-static"` to build under `output: "export"` - added.
    Verified `out/robots.txt` and `out/sitemap.xml` are emitted correctly.
  - **P1-8/P1-9/P1-10:** Added `alternates.canonical` to all three routes; added `openGraph`
    (type/siteName/url/locale) and `twitter` (summary_large_image) metadata to the root
    layout - no OG image yet, deferred to D11 rather than shipping a broken reference. Added
    a `WebPage` (not `MedicalWebPage`, per the earlier P1-10 amendment) JSON-LD block to
    `/report`. All verified present in the exported HTML.
  - **P1-11:** Added `src/app/not-found.tsx` rendering inside the app shell with links back
    to `/`, `/faq`, `/report`. Verified `out/404.html` now contains those links (previously:
    the raw Next.js default, zero links).
  - **P1-12:** `site.config.ts`'s `logo: "/logo.svg"` pointed at a file that doesn't exist.
    Set to `logo: ""` with a `TODO: D11` comment rather than fabricating a placeholder asset;
    confirmed the `Organization` JSON-LD doesn't emit `logo` today, so this was latent, not
    yet visibly broken.
  - **P1-6/P1-7:** Added `.github/workflows/ci.yml` (typecheck, lint, build, `npm audit
    --audit-level=high`) on `pull_request` and `push: [main]`, kept separate from
    `deploy.yml`. Added an ESLint `no-restricted-syntax` rule banning the brand/domain
    literals plus the purged platform names, with `site.config.ts` (and the rule file itself)
    excluded. **Verified it actually fails**, not just exists: temporarily pasted `"lareb"`
    into `page.tsx`, confirmed `npm run lint` errored, reverted, confirmed clean and byte-
    identical to the original.
  - **P1-1:** Added `SECURITY.md` - the prohibited-actions list from spec §12 and a
    (placeholder) disclosure contact; noted `/.well-known/security.txt` is Phase 4.
  - **P1-3:** Wrote all 10 ADR files at `docs/adr/0001-*.md`…`0010-*.md`, matching the paths
    already indexed in this file. 001–008 from spec §3; 009/010 from the amended (Docker +
    Postgres, no Supabase) decision two entries below, not the superseded draft below that.
  - **P2-1:** Added an interim `<meta http-equiv="Content-Security-Policy">` to the root
    layout (`default-src`, `script-src`, `style-src`, `img-src`, `frame-src` scoped to
    `https://*.qualtrics.com`, `connect-src`). Wrote **ADR-011** (new row added to the index
    above) documenting that `frame-ancestors`, HSTS, and `X-Content-Type-Options` are
    unreachable on GitHub Pages regardless, and scoping the Phase 1/2 "header scanner A/A+"
    acceptance criteria to the Phase 3+ server host instead of quietly failing them here.
  - **P2-2/P2-3:** Moved the hardcoded Qualtrics survey URL to
    `NEXT_PUBLIC_QUALTRICS_SURVEY_URL` (env-first with the old literal as a fallback, so the
    sample survey still works with no env set). Added `sandbox="allow-scripts allow-forms
    allow-same-origin allow-popups"` to the `/report` iframe.
  - **P2-4:** Added `.github/dependabot.yml` (npm + github-actions, weekly) and `npm audit
    --audit-level=high` to CI. Confirmed it exits 0 today - the 2 known moderate `postcss`
    findings (transitive via `next@16.2.10`) don't trip the high-severity gate; did **not**
    run `npm audit fix --force` (would downgrade to `next@9.3.3`).
  - **P2-5:** Relabeled the home-page CTA linking to `/faq` from "How it works" to "Common
    questions", since `/how-it-works` isn't built yet and the old label silently pointed
    elsewhere.
  - **P2-6:** Removed the duplicate top-of-file `.qualtrics` line in `.gitignore` (the one
    under "# secrets - never commit" already covers it).
  - **P2-7:** Removed the dead `--background`/`--foreground` CSS vars in `globals.css`
    (defined, then immediately overridden by `bg-white text-slate-900` on `<body>` in
    `layout.tsx` - leftover `create-next-app` scaffolding). Added a `prefers-reduced-motion`
    guard (no animations exist yet, but the spec §14 requirement is now in place ahead of any
    being added).
  - **P3-1:** Fixed ~15 stale `config/*` and `docs/qualtrics-integration.md` path references
    in `TECHNICAL_SPEC.md` to match the flat repo-root layout from the 2026-07-16 reorg.
    Left the two `config/survey/*.yaml` references (§4, §8.4) alone - those describe a
    future Mode B production config *directory*, distinct from the root-level example seed
    file, same reasoning as leaving `docs/adr/` untouched.
  - **P3-2 (this entry also serves as the required correction):** the 2026-07-12 entry near
    the bottom of this file claims `config/survey.example.yaml`, `config/survey.schema.json`,
    `config/robots.example.txt`, `config/llms.example.txt`, `config/schema-examples.jsonld`,
    and `.env.example` were created. The five seed artifacts exist, but at the repo root, not
    under `config/` - that subdirectory has never existed. `.env.example` did not exist at
    all until this entry. Per spec §21 rule 2, that original entry is left unedited; this
    note is the append-only correction, and P1-2/P1-15 above are where the actual fixes
    landed.
  - **P3-3:** Added a note to `AGENTS.md` explaining the codegraph session-root mismatch
    (`.codegraph/` lives at this repo's root; a session opened at the parent workspace
    directory won't find it) so a future agent doesn't misread "no codegraph tools" as "no
    index exists".
  - **P3-4:** Corrected the Phase 2 board note (above) to state plainly that only the a11y
    fallback link is done of its acceptance criteria - the rest is a bare iframe - and that
    it's running ahead of the Phase 4 real-submissions gate.
- **Decisions:** ADR-011 added (CSP/header hosting contradiction, scoped to Phase 3+). No
  other decisions changed; D3, D4, D-minors, D-third-party remain open exactly as before —
  none of this pass touches the compliance gates.
- **Acceptance criteria progress:**
  - [x] Phase 0 acceptance: ADRs committed, CI runs typecheck/lint, no-hardcoded-brand check
        active and verified failing on a violation, `SECURITY.md`/`.env.example` created.
  - [x] Phase 1 SEO baseline: sitemap, robots (derived from `site.config`), canonicals, OG/
        Twitter tags, per-page schema on `/report`, on-brand 404 page.
  - [ ] Phase 1/2 header-scanner A/A+ criterion - now explicitly scoped to Phase 3+ per
        ADR-011, not achievable on GitHub Pages; not a regression, a documented limit.
  - [ ] Everything already listed as open in the prior entry (crisis-line list beyond NL,
        minors/third-party policy, DPO/legal review, P0-2/P0-3) is unchanged - none of it is
        engineering work and none of it was in scope for this pass.
- **Blockers / risks:** Unchanged - D3, D4, D-minors, D-third-party still block real-data
  launch; P0-2 (Qualtrics EU region) and P0-3 (rotate `.qualtrics` codes) still need the
  account owner. This pass touched none of them.
- **Next actions:** Remaining engineering-adjacent items not covered here: extracting page
  copy into a real content layer (ADR-004, currently still inline in components) and
  building the actual `SurveyProvider` interface / postMessage completion handling (Phase 2).
  Otherwise, the next real unblock is the DPO/legal review flagged in the prior entry.

### 2026-07-16 - Phase 0/1 - process + eng (Claude Code) - Scope change: product redefinition, reference purge, D1 rename, P0-1 deploy gate
- **Status change:** none to phase numbers. Board's "Blocking items to closure" gained two new
  rows: **D-minors**, **D-third-party** (both DPO/legal-owned, blocking).
- **What changed:** Per `PENDING-FIXES.md` (an audit produced against commit `828673d`), the
  project owner clarified this is **not** a pharmacovigilance platform - it is a service for
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
  - Rewrote the seed artifacts (`survey.example.yaml` - entity model, `who_is_reporting`
    options, new `product_version`/`usage_context`/`usage_duration` fields, `pii` emphasis;
    `llms.example.txt`; `schema-examples.jsonld` - no medical schema.org type introduced;
    `robots.example.txt`; `survey.schema.json` `$id`/`title`) to the real domain (P1-15).
  - Restated `TECHNICAL_SPEC.md` §0 terminology note, §1 Context, §2.2 Non-goals, §6 (dropped
    `MedicalWebPage` from `/report`'s schema list per the P1-10 amendment - plain `WebPage`
    only), §7 Content requirements, the AEO guardrail in §11, and §13 Privacy & regulatory
    compliance (added minors and named-third-party analysis, flagged DSA/AI Act as an open
    legal question, kept Art. 9/D3/D4 unchanged and blocking) (P1-16, P1-17).
  - **Resolved D1**: brand name is **AIjwerkingen** (already the value in `site.config.ts`,
    so no app-code change was needed there - ADR-008 held). Updated the D1/D11 rows in §22 and
    `README.md`'s stale "temporary working name" note accordingly.
- **Decisions:** D1 resolved (AIjwerkingen). Added **D-minors** and **D-third-party** to §22 as
  new open, blocking decisions owned by DPO/legal - not resolved here, only identified and
  scoped, per `PENDING-FIXES.md` P0-5/P1-17.
- **Acceptance criteria progress:**
  - [x] Repo is safe to push without auto-publishing (P0-1).
  - [x] User-facing copy matches the real product (P0-4).
  - [x] Platform references purged from app code, docs, and seeds outside this ledger's history
        (verified via the audit's grep command; `CHANGELOG.md`'s own historical entries at the
        original lines 1/155/165/251 were deliberately left untouched - append-only, spec §21).
  - [ ] Crisis-line selection beyond the one NL default, and the full minors/third-party
        policies, still need DPO/legal/copy-owner sign-off - see Blockers below.
  - [ ] Engineering SEO baseline (sitemap, robots.ts, canonicals, OG tags, WebPage schema, 404
        page, CI, lint rule, SECURITY.md, ADR files) from `PENDING-FIXES.md` P1-1…P1-12 was
        **out of scope for this pass** and remains open.
- **Blockers / risks:** D3, D4 unchanged and still blocking real-data launch - the pivot does
  **not** reduce the Art. 9 burden (P1-17). New: **D-minors** and **D-third-party**, both
  blocking, both DPO/legal-owned. P0-2 (Qualtrics EU-region confirmation) and P0-3 (rotate the
  `.qualtrics` plaintext codes) remain open and are user/account-owner actions, not agent-doable.
- **Next actions:** Commission the DPO/legal review of the restated §13 (D3, D4, D-minors,
  D-third-party) and decide the actual crisis-line list per locale beyond the NL placeholder
  already in the footer/`/report`. Separately, work through the remaining P1 engineering items
  (sitemap/robots.ts/canonicals/OG/404/CI/lint/SECURITY.md/ADRs) whenever that pass is picked up.

### 2026-07-16 - Phase 0 - process (Claude Code) - REVIEW.md: added mobile-responsiveness + codegraph checks
- **Status change:** none.
- **What changed:** User caught two gaps in the freshly-added `REVIEW.md` by directly
  asking whether it covered them - it didn't:
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

### 2026-07-16 - Phase 0 - process (Claude Code) - added REVIEW.md; fixed a README regression
- **Status change:** none.
- **What changed:**
  - Added **`REVIEW.md`** - a reusable, phase-agnostic protocol for a cold agent (no prior
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
    under a `config/` subfolder as the original text assumed - a pre-existing inaccuracy,
    also now fixed), and folded in a short "Local development" section (`npm run dev`,
    static-export build check) that's genuinely useful and wasn't in the original.
  - Confirmed via the original file list that **no other file was affected** by that same
    `rsync` - `README.md` was the only path that collided between the scaffold output and
    the pre-existing project files.
- **Decisions:** none new.
- **Blockers / risks:** unchanged. Worth noting as a general lesson: a directory-merge step
  (rsync/cp over an existing tree) can silently clobber files sharing a name with generated
  scaffolding - worth an explicit diff/conflict check next time this pattern is used.
- **Next actions:** unchanged.

### 2026-07-16 - Phase 0 - tooling note (Claude Code) - agents should prefer codegraph over grep/find
- **Status change:** none.
- **What changed:** Added a section to `AGENTS.md` (also picked up via `CLAUDE.md`, which
  imports it) instructing agents to prefer **codegraph's MCP tools** over raw `grep`/`find`/
  manual reads when exploring this codebase, with a fallback to Unix search only if
  codegraph's tools aren't available in a given session. This assumes `codegraph init` has
  been run at this repo root (user-run, per this agent's operating rules - not run by the
  agent itself) and a fresh session started so the tools attach.
- **Decisions:** none new.
- **Blockers / risks:** unchanged.
- **Next actions:** unchanged.

### 2026-07-16 - Phase 0 - reorg (Claude Code) - repo root moved to match the GitHub repo name
- **Status change:** none.
- **What changed:** Everything git-worthy (app code, config, `.github/workflows`,
  `.claude/`, `CLAUDE.md`/`AGENTS.md`, this file, `TECHNICAL_SPEC.md`, `README.md`, and the
  starter/reference artifacts - `survey.example.yaml`, `survey.schema.json`,
  `robots.example.txt`, `llms.example.txt`, `schema-examples.jsonld`,
  `qualtrics-integration.md`) moved from the parent working directory into a new subfolder
  **`aijwerkingen.github.io/`**, named to match the actual GitHub repo
  (`aijwerkingen.github.io`) so a future `git clone` lands in a directory with the same name
  as what's here now. **This file (`CHANGELOG.md`) is now at
  `aijwerkingen.github.io/CHANGELOG.md`.**
  - The parent directory (`AMC-Larebish/`) is now a **workspace, not part of the repo** - for
    reference material, exploration assets, anything that shouldn't be checked in. It is not
    (and is not intended to become) a git repository itself.
  - `node_modules/`, `.next/`, and `out/` were **not** moved - deleted and regenerated fresh
    inside the new location (`npm install` + `npm run build`, both verified green) rather than
    risking a stale/broken move.
  - The **`.qualtrics` secrets file was deliberately left in the parent workspace**, not moved
    into the repo folder - even git-ignored, it shouldn't sit inside a git repo directory.
    Still unresolved: move it to a password manager and delete it (flagged in the prior entry).
  - `.claude/launch.json` (used by this agent's browser-preview tooling) had to be recreated
    at the **fixed session root** (`AMC-Larebish/.claude/launch.json`) with its `serve` command
    updated to point at `aijwerkingen.github.io/out` - the preview harness resolves that file
    relative to the session root, not the moved subfolder. The copy that moved with the repo
    (`aijwerkingen.github.io/.claude/launch.json`, pointing at plain `out`) is left as-is and
    is correct for when this folder is later opened directly as its own project root.
  - Verified post-move: `npm install` and `npm run build` both succeed from
    `aijwerkingen.github.io/`, and all three routes were re-checked in-browser with no
    regressions.
- **Decisions:** none new.
- **Blockers / risks:** unchanged (D3, D4). `.qualtrics` cleanup still outstanding (user-owned).
- **Next actions:** unchanged from the prior entry - confirm before `git init`/push; continue
  Phase 0 (ADRs, CI, lint rule) or Phase 1 pages per user priority.

### 2026-07-16 - Phase 0/1/2 - build (Claude Code) - first deployable slice: scaffold + Home/FAQ/Report
- **Status change:** Phase 0 `not_started → in_progress`; Phase 1 `not_started → in_progress`;
  Phase 2 `not_started → in_progress`.
- **What changed:**
  - Scaffolded the app in the repo root with `create-next-app` (Next.js 16, App Router,
    TypeScript, Tailwind v4, ESLint). `package.json` name `aijwerkingen`.
  - `next.config.ts`: `output: "export"` (static export - required, GitHub Pages has no
    server runtime) and `images.unoptimized: true` (no image-optimization server available
    under static export).
  - **Working name/domain applied as real placeholders**, not `example.org`:
    `src/site.config.ts` - `name: "AIjwerkingen"`, `canonicalUrl: "https://aijwerkingen.github.io"`,
    `indexable: false`. This is a **user/org GitHub Pages repo** (`aijwerkingen.github.io`),
    which deploys at the **root** - no `basePath` needed, unlike project-pages repos.
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
    survey loads and is interactive inside the iframe** - confirmed no console errors.
  - Caught and fixed a real bug during preview: a classic JSX whitespace-collapse issue
    (`{siteConfig.name} lets you…` wrapped across source lines lost its leading space,
    rendering "AIjwerkingenlets…") - fixed with an explicit `{" "}`. Root cause and fix
    pattern noted inline; the FAQ page already used this pattern defensively.
  - Added `.github/workflows/deploy.yml` (build + `actions/deploy-pages`) - **created but
    not pushed**; publishing to the public `aijwerkingen.github.io` repo requires explicit
    user go-ahead per this agent's operating rules.
  - **Found and excluded a secret:** a pre-existing `.qualtrics` file in the working
    directory contained plaintext Qualtrics account backup codes. Added `.qualtrics` to
    `.gitignore` before any `git add`. **User was told directly to move these codes to a
    password manager and delete the file** - it should not persist in a project folder at
    all, ignored or not.
  - Removed the unused `create-next-app` template assets (`next.svg`, `vercel.svg`, etc.)
    and the default Geist Google-Fonts wiring (kept the build free of a fonts.google.com
    fetch at build time; using a system-font stack instead).
- **Decisions:** None new. Applied D1 (name) and D9 (domain, temporary) as **explicit
  placeholders**, per spec §5.1/§5.2 - both remain open decisions in §22 until finalized;
  swapping either is still the one-file `site.config.ts` edit described in §0.1.
- **Known gaps / not done in this pass:**
  - ADR files under `docs/adr/*.md` (001–010) not yet written as standalone files - only
    the index rows in this changelog exist so far.
  - The no-hardcoded-brand/domain lint/build check (Phase 0 acceptance criterion) not yet added.
  - CI (typecheck/lint/build on PR) not yet wired up.
  - Only 3 of the ~10 routes in spec §6 exist (`/`, `/faq`, `/report`); About, How-it-works,
    Privacy, Terms, Contact, Accessibility, News are not started.
  - `/report` is a bare iframe: no `SurveyProvider` abstraction yet, no postMessage
    completion/thank-you state, no CSP `frame-src` hardening, no analytics conversion event —
    all real Phase 2 work per spec §8.3 and `qualtrics-integration.md`.
  - D11 (visual identity & copy) still open - current styling is plain Tailwind, not a
    designed identity.
- **Blockers / risks:** unchanged (D3, D4). New minor risk noted: real secrets (`.qualtrics`
  backup codes) were found sitting unencrypted in the project directory - flagged to the user,
  not a code issue but worth a habit fix.
- **Next actions:** Confirm with the user before pushing `main` / enabling GitHub Pages
  (publishing to a public URL needs explicit go-ahead). Then continue Phase 0 (ADRs, CI,
  lint rule) and/or keep building out Phase 1 pages, per user priority.

### 2026-07-16 - Phase - planning (Claude Code) - visual identity & content authoring flagged as open (D11)
- **Status change:** none. Phase 1 board note updated to flag it as blocked-by D11 (soft
  block - Phase 1 can start, but should not be marked `done` with D11 unresolved).
- **What changed:** Added **D11** to the open-decisions register (spec §22): visual identity
  (logo, palette, typography, imagery/illustration style) and actual page copy authorship.
  Added a callout in Phase 1 scope (spec §20) noting that Lighthouse/a11y/SEO scores do not
  certify a "modern-looking" site - the spec fixes toolchain (Tailwind + headless components,
  §5) and copy *voice* (answer-first, disclaimers, §7), but never assigns a copy author or a
  visual design pass. Without resolving D11, Phase 1 will ship architecturally correct but
  visually unstyled pages (default component styling, no imagery, no brand identity).
- **Decisions:** none yet - D11 is logged as open, not resolved. Suggested resolution path:
  assign a copy author, and pick a design pass or a mood-board decision anchored to the
  studied reference sites (lareb.nl, VAERS, MHRA Yellow Card, VigiAccess, §0).
- **Blockers / risks:** D11 added as a **soft block on calling Phase 1 `done`** (not a hard
  gate like D3/D4). Existing blockers unchanged.
- **Next actions:** Resolve D11 before or during Phase 1 execution - do not let it fall through
  silently just because CI (Lighthouse/a11y/SEO) is green.

### 2026-07-16 - Phase - planning (Claude Code) - drop Supabase; Docker+Postgres everywhere
- **Status change:** none (still `not_started`). **Supersedes the Supabase portion** of the
  entry below; ADR-009/010 index rows updated to current state.
- **Decisions:**
  - **ADR-009 (amended) - no managed-DB vendor.** **Supabase is dropped entirely.** Mode B uses
    a **containerized Node service + PostgreSQL for local, staging, and production** - the same
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

### 2026-07-16 - Phase - planning (Claude Code) - backend & hosting decisions blocked
- **Status change:** none (still `not_started`). No code yet; decisions recorded in the ADR
  index above. Full ADR files (009, 010) to be written in Phase 0 alongside 001–008.
- **Decisions:**
  - **ADR-009 - Mode B backend & datastore.** Mode B runs as a **containerized Node service
    + PostgreSQL**. Data access is **vanilla Postgres via an ORM + versioned SQL migrations
    over a standard `DATABASE_URL`** - **no Supabase-proprietary coupling** (no `supabase-js`,
    Supabase Auth, Storage, Edge Functions, or RLS-as-app-authz on the critical path).
    **Non-prod (staging/test) uses Supabase (EU region); production uses self-hosted/managed
    EU Postgres (Docker).** Because Supabase *is* Postgres, moving between them is a
    **`DATABASE_URL` + redeploy**, not a rewrite. Keeps ADR-006 (EU residency) intact and
    makes the env swap config-only.
  - **ADR-010 - Hosting topology / staging.** **GitHub Pages hosts the static informational
    build (Phases 0–2) as a permanently-`noindex` preview/staging tier.** GitHub Pages cannot
    run a server, so **full-stack staging (Phase 3+, Mode B) runs on a server host with
    Supabase**, and production on an EU server host. "GitHub Pages = staging" applies to the
    **static tier only**; a second, full-stack staging env appears at Phase 3.
- **Clarification (answer to "how hard is switching to Mode B?"):** Two distinct switches —
  (1) **`SURVEY_PROVIDER=qualtrics→native`** is one env var + redeploy, but only *after* Mode B
  is built in **Phase 3** (native form renderer from config, `POST /api/submissions`,
  validation, migrations, anti-abuse, encryption, audit log - real code, one-time).
  (2) **Supabase↔self-hosted Postgres** is `DATABASE_URL` + redeploy given ADR-009's no-lock-in
  rule. **Neither switch is a rewrite;** *building* Mode B (Phase 3) is the real work.
- **Blockers / risks:** unchanged (D3, D4). Note: if Supabase were ever used for **prod real
  data** it would need EU region + DPA review (§13, ADR-006) - avoided by self-hosting prod.
- **Next actions:** Begin **Phase 0**; write ADR-009/010 files with 001–008. In Phase 3, keep
  the data layer ORM + migrations over `DATABASE_URL` so the Supabase→prod swap stays config-only.

### 2026-07-12 - Phase - spec author (Claude) - Qualtrics runbook added
- **Status change:** none (still `not_started`).
- **What changed:** Added **`docs/qualtrics-integration.md`** - a step-by-step Mode A
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
- **Next actions:** unchanged - begin Phase 0. Part B of the runbook is built in Phase 2;
  the real survey + launch checklist land with Phase 4/5.

### 2026-07-12 - Phase - spec author (Claude) - spec update
- **Status change:** none (still `not_started`; specification refined).
- **What changed:** Added the **`site.config` single-source-of-truth** design (ADR-008,
  spec §5.1) so brand name + domain are a one-file change; added **domain policy** (§5.2)
  and the **AC-DOMAIN** acceptance criterion (§2.3) requiring the final domain before any
  indexing. Wired these into Phase 0 (create `site.config` + no-hard-coded-literals check),
  Phase 1 (non-prod `noindex`), and Phase 5 (finalize name/domain, then flip indexable).
  Added the **"START HERE when you resume after finalizing the domain & name"** callout
  (spec §0.1) and the **▶ RESUME HERE** block at the top of this file. Updated D1 (name —
  configurable, zero SEO cost) and D9 (final domain - must precede indexing).
- **Decisions:** ADR-008 added as *proposed*.
- **Blockers / risks:** unchanged - D3, D4 remain the real-data launch gates.
- **Next actions:** Begin **Phase 0**. When the domain/name are chosen later, follow
  **▶ RESUME HERE** above (executed within Phase 5).

### 2026-07-12 - Phase - spec author (Claude)
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
  blocking gates for real-data launch - see spec §22. Final brand name (D1) and survey
  questions (D8) are open but do **not** block the informational site.
- **Next actions:** Begin **Phase 0** - stand up the repo/SSR scaffold and CI, write
  ADR files, initialise environments. Update the phase board and append an entry when done.
