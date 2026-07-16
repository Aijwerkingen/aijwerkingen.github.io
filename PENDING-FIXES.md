# PENDING-FIXES — audit of 2026-07-16

Produced by following `REVIEW.md` against the repo state at commit `828673d` (branch `main`,
2 uncommitted doc edits). **Findings and instructions only — nothing in this list has been
applied.**

**Verification basis:** `npm ci` + `npm run build` from a deleted `node_modules`/`.next`/`out`
(clean-clone simulation) — **green**, static export confirmed (all 4 routes prerendered `○`).
`eslint` — clean. `tsc --noEmit` — clean. Exported HTML inspected directly under `out/`.

**Not verified this round (deliberately, at user direction):** the browser walkthrough of each
route, console-error check, and the mobile-responsiveness pass (`REVIEW.md` items 1 and 10).
The site is known to be pre-visual-identity (D11 open), so design-level review was deferred.
**Items 1 and 10 remain genuinely unverified — do not treat them as passed.** Re-run them once
D11 lands.

---

## ⚠ Scope change — read this first (added 2026-07-16, second pass)

**The product is not what this repo says it is.** Per the project owner:

> This is **not** a pharmacovigilance platform. This is for reporting **perceived adverse effects
> of Conversational AI tools and digital/social media**. And there must be **no references to the
> platforms we took inspiration from** (Lareb and others).

Every page, seed artifact, config, and document in this repo currently describes a
medicines-and-vaccines pharmacovigilance service, and cites Lareb/VAERS/MHRA/VigiAccess by name in
user-facing copy. **The audit below was written before this was known.** The technical findings
(P0-1…P0-3, P1-1…P1-12, P2, P3) all still stand exactly as written — they are about build,
hosting, SEO, and CI, and are domain-independent. But the corpus they operate on is about the
wrong subject, so items **P0-4, P0-5, P1-13…P1-17** have been added, and two earlier items are
amended (see *Amendments* below).

Do not treat this as a find-and-replace. It changes **who reports, what they disclose, which
regulator is relevant, and what duty of care the site owes** — the compliance analysis has to be
redone, not translated. It does **not** reduce the compliance burden (P1-17).

One thing gets *better*: the name. **AIjwerkingen** reads as *AI* + *bijwerkingen* (Dutch for
"side effects") — it fits the actual product precisely, whereas the working name **AMC-Larebish**
literally means "Lareb-like" (spec §0) and is now both wrong and a banned reference. See P1-16.

---

## Summary

The build, the static-export posture, the `noindex` posture, and the `site.config.ts`
single-source-of-truth rule all hold up under direct verification. The changelog's self-reported
"known gaps" list is accurate as far as it goes, but **it is materially incomplete**: the entire
SEO baseline that Phase 1 claims to be delivering (sitemap, canonicals, Open Graph) is absent and
unmentioned, `robots.txt` silently defeats the `indexable` flag, and two Phase 0 acceptance
artifacts (`SECURITY.md`, `.env.example`) are claimed created in an earlier entry but have never
existed. On top of all of that, the entire corpus describes the wrong product (scope change above).

| Priority | Count | Theme |
|---|---|---|
| P0 | 5 | Publishing a public form that misdescribes itself, before the Phase 4 gates |
| P1 | 17 | Phase 0/1 acceptance criteria not met (7 undisclosed) + the domain rewrite |
| P2 | 7 | Correctness, hardening, hygiene |
| P3 | 4 | Spec/changelog path drift, tooling |

### Amendments to items written before the scope change

- **P1-10** said to defer `MedicalWebPage` on `/report`. **Now: drop it permanently.** Emitting
  medical schema for an AI/social-media harm-reporting service would be an active
  misrepresentation to search and answer engines. Plain `WebPage` only.
- **P0-1**'s remediation gets *more* urgent, not less: the deployed copy doesn't just over-promise
  (anonymity, "reviewed"), it describes a **different service entirely** (P0-4).

### Confirmed accurate (no action)

- `output: "export"` present in `next.config.ts` with a correct rationale comment; build produces
  a pure static export. GitHub Pages hosting model intact.
- **No brand or domain literal anywhere outside `src/site.config.ts`** across `src/`, `public/`,
  `.github/` — ADR-008's core rule holds in app code today (though it is *unenforced*, see P1-6).
- `<meta name="robots" content="noindex, nofollow">` present on `/`, `/faq`, `/report`, driven by
  `siteConfig.indexable`. ADR-010 holds *in the meta tag* (but not in `robots.txt` — see P1-9).
- Sitewide `Organization` + `WebSite` JSON-LD on all routes; `FAQPage` JSON-LD on `/faq`.
- One `<h1>` per route; unique `<title>`/description on `/faq` and `/report`.
- **No secrets tracked or in git history.** `.qualtrics` is correctly gitignored and lives outside
  the repo dir. `git status` clean of staged secrets. (But see P2-7.)

---

## P0 — Resolve before `git push` or enabling GitHub Pages

### P0-1. The first push to `main` auto-publishes a public form soliciting real health data, before the Phase 4 compliance gate

**Files:** `.github/workflows/deploy.yml:4-6`, `src/app/report/page.tsx`, `src/app/faq/page.tsx`

`deploy.yml` triggers on `push: branches: [main]` with no environment protection or manual gate.
The moment this repo is pushed, `aijwerkingen.github.io` goes live. `noindex` keeps it out of
search results — **it does not make it private**. Anyone with the URL gets a working, inviting
"Report a side effect" form wired to a live Qualtrics survey.

That collides with the project's own blocking gates, all still open:
- **D3** — Qualtrics DPA / EU storage sufficiency for health data: unresolved.
- **D4** — DPIA + Art. 9 lawful basis: unresolved.
- Spec §13 states this is "**blocking for any launch that collects real submissions**".
- Phase 4 is `not_started` and is described as "**the gate for collecting real submissions**".

Made worse by the copy: `/faq` promises "Is my report anonymous? **Yes, by default.** We don't
require your name…" and "Your report is **logged and reviewed** as part of ongoing safety
monitoring, similar to how national pharmacovigilance centres such as Lareb operate." Neither is
true of the current deploy — submissions land in a **sample** Qualtrics survey nobody monitors.
A member of the public who found the URL could submit genuine adverse-event data about a real
medicine, under an explicit anonymity promise, into an unmanaged sample survey.

**Fix (do all four):**
1. In `.github/workflows/deploy.yml`, drop the `push` trigger and leave `workflow_dispatch:` only,
   until Phase 4 signs off:
   ```yaml
   on:
     workflow_dispatch:
   ```
   Optionally also add a GitHub Environment with a required reviewer on the `deploy` job — spec §19
   requires production deploys to be "a **gated, human-approved** step".
2. Replace the live survey embed on `/report` with a non-functional placeholder until Phase 4
   (Phase 1 in spec §20 explicitly calls for "a **placeholder** on `/report`" — the live embed is
   Phase 2 work that has run ahead of its compliance gate).
3. Add a persistent, visible banner on `/` and `/report` stating this is a non-operational preview
   and reports are not monitored — for as long as any form is reachable.
4. Soften the `/faq` anonymity and "logged and reviewed" answers to describe the *intended* service
   in the future tense, or gate the FAQ behind the same placeholder. Spec §11's guardrail:
   "accuracy and non-misleading phrasing **outrank any citation tactic**."

**Do not** push this repo until at least (1) is in place.

### P0-2. The embedded Qualtrics survey is hosted in a non-EU datacenter, contradicting ADR-006

**File:** `src/app/report/page.tsx:13-14`

```ts
const QUALTRICS_SURVEY_URL =
  "https://qualtricsxmwdy4hl99w.qualtrics.com/jfe/form/SV_aVpwAHDeyg456No";
```

The host has no `.eu.` segment. Qualtrics EU-datacenter surveys are served from
`*.eu.qualtrics.com`; a bare `*.qualtrics.com` brand host is a **US datacenter**. This contradicts:
- **ADR-006** (EU data residency),
- spec §13.5 ("For Mode A, confirm Qualtrics storage region and transfer mechanism"),
- the repo's own runbook, `qualtrics-integration.md:63` — "**Confirm the data-centre region** in
  the host (e.g. `*.eu.qualtrics.com` for EU). This matters for data residency."

Harmless *only* while nothing real is submitted — which is exactly what P0-1 fails to guarantee.

**Fix:** confirm the Qualtrics account's datacenter region. If it is US, this is a D3 input and
must be recorded as a go/no-go: either provision the survey in an EU-region Qualtrics org, or
record that Mode A cannot meet ADR-006 (spec §13.5 makes this "a **go/no-go** input for choosing
Mode B"). Until resolved, don't embed any survey that a real person could reach.

### P0-3. `.qualtrics` plaintext backup codes still sitting in the workspace

**File:** `../.qualtrics` (parent workspace, outside the repo — correctly gitignored, never committed)

Flagged to the user in two consecutive changelog entries and still unresolved. Not a code defect —
the gitignore handling is correct — but real credentials in plaintext on disk.

**Fix (user-owned, cannot be done by an agent):** move the codes into a password manager and
`rm ../.qualtrics`. Then remove the now-redundant duplicate `.qualtrics` line in `.gitignore`
(see P2-6).

### P0-4. Every user-facing page describes the wrong product

**Files:** `src/app/layout.tsx:13,90`, `src/app/page.tsx:9-16,42,46`, `src/app/faq/page.tsx`
(11 of 12 answers), `src/app/report/page.tsx:5-6`

The live copy tells visitors this is a service for reporting side effects of **medicines and
vaccines**. It is not. Verified instances in app code:

| File:line | Current copy | Problem |
|---|---|---|
| `layout.tsx:13` | "Report a suspected side effect from **a medicine or vaccine**." | Sitewide meta description — wrong product |
| `layout.tsx:90` | "This is not a **medical-advice** service." | Wrong disclaimer for the real domain (see P0-5) |
| `page.tsx:9` | "Noticed a side effect from **a medicine or vaccine**?" | The `<h1>` — wrong product |
| `page.tsx:14-15` | "whether you're **a patient or a healthcare professional**" | Wrong audience |
| `page.tsx:46` | "the same way pharmacovigilance centres **like Lareb** work" | Wrong domain **+ banned reference** |
| `faq/page.tsx:26` | "similar to how national pharmacovigilance centres **such as Lareb** operate" | Wrong domain **+ banned reference** |
| `faq/page.tsx:17-18` | "Do I need to know the exact **medicine name**… brand name, **dose, batch number**" | Wrong entity model |
| `faq/page.tsx:33-34` | "Will reporting affect **my treatment**?… isn't sent to **your doctor**" | Meaningless in the real domain |
| `faq/page.tsx:58` | "Reports are collected for **pharmacovigilance purposes**" | Wrong domain |
| `report/page.tsx:6` | "Report a suspected side effect from **a medicine or vaccine**." | Wrong product on the conversion page |

Combined with P0-1 (the workflow auto-publishes on push), the failure mode is concrete: a public
site invites people to report **medicine and vaccine** side effects, claims kinship with **Lareb**,
and pipes whatever they submit into an unmonitored sample survey. That is worse than an
over-promise — it misrepresents the service's identity and falsely implies an association with a
named national pharmacovigilance body.

**Fix:** rewrite all app copy to the real domain (P1-14) and purge the platform references
(P1-13) **before** P0-1's gate is lifted. Until then this is another independent reason not to
push.

### P0-5. The new domain changes who reports and what they disclose — the site has no answer for it

**Files:** `src/app/layout.tsx:90`, `src/app/report/page.tsx:22-26`, `src/app/faq/page.tsx:45-46`

This is the item the pivot *creates*, and nothing in the repo or spec anticipates it. Reporting
"perceived adverse effects of Conversational AI tools and digital/social media" changes the
population and the disclosures in two ways the current build handles badly:

**1. Crisis disclosures.** Someone reporting harm from a companion chatbot or a social feed may be
reporting exactly the harms this category is known for — distress, self-harm ideation, disordered
eating, compulsive use. A free-text "Describe what happened" box in this domain will receive
acute-distress disclosures. The site's entire safety net today is a medicines disclaimer:
"This is not a medical-advice service. In an emergency, contact your local emergency number."
That is the wrong signpost for a distressed person and offers nothing actionable.

**2. Minors.** Pharmacovigilance assumed patients, carers, and healthcare professionals — all
adults, per `survey.example.yaml`'s `who_is_reporting` options. Social media and AI companion
tools have a **large under-18 user base**. This site will attract child reporters. Nothing in the
spec, the survey config, or the DPIA framing contemplates that. Under GDPR Art. 8 (NL digital-age
of consent: **16**), processing a child's personal data on consent needs parental authorisation,
and a children's-data DPIA is a different exercise from the one Phase 4 scopes.

**Fix — needs the DPO/legal owner and the copy author, not an engineer alone:**
1. Replace the medicines disclaimer sitewide with domain-appropriate **crisis signposting**:
   a named, always-visible route to real help (in NL, e.g. 113 Zelfmoordpreventie; plus a local
   equivalent per locale), shown on `/report` **above** the form and inside the survey itself —
   not buried in a footer.
2. Decide the **minors policy** and record it as a new decision in spec §22: minimum age, whether
   under-16 reports are accepted at all, age assurance vs. self-declaration, parental consent, and
   what a child-specific DPIA requires. This is a launch gate of the same class as D3/D4.
3. Add a moderation/triage route for free-text disclosures that indicate risk. In Mode A, that
   is a **Qualtrics-side** responsibility — it interacts with D3 and the P0-2 region question.
4. Amend spec §7's disclaimer rule; it currently mandates the medical-advice/emergency framing
   sitewide, which is now the wrong instruction for whoever writes the copy.

Do not let this be absorbed as a copy tweak. Item 1 gates any deployment where a real person can
reach the form.

---

## P1 — Acceptance criteria not met

> Items marked **⚠ UNDISCLOSED** are not in the changelog's "Known gaps / not done in this pass"
> list. Per `REVIEW.md` item 9, the prior agent's self-report is optimistic here.

### P1-1. `SECURITY.md` missing — claimed as a Phase 0 deliverable ⚠ UNDISCLOSED

Spec §20 Phase 0: "`CHANGELOG.md`, `SECURITY.md`, `.env.example` created." Spec §12 references
"repo `SECURITY.md`" as the authority for prohibited implementation actions. **The file does not
exist and no changelog entry admits it.**

**Fix:** create `SECURITY.md` at repo root covering: the prohibited-actions list from spec §12
(no real credentials/payment/gov-ID into forms, no access-control changes, no hard-deleting prod
data, no CAPTCHA bypass — all handed to a human operator), plus a responsible-disclosure contact.
Spec §12.8 also wants `/.well-known/security.txt` — that's Phase 4, note it as such.

### P1-2. `.env.example` missing, **and `.gitignore` would silently swallow it** ⚠ UNDISCLOSED

**File:** `.gitignore:38`

Required by spec §20 Phase 0 and Appendix E ("`.env.example` (repo root, created in Phase 0)").
The 2026-07-12 changelog entry **claims it was authored** — it has never existed at any path.

Worse, this is a live trap. Verified:
```
$ git check-ignore -v .env.example
.gitignore:38:.env*    .env.example
```
The `.env*` rule means anyone who creates `.env.example` will have it **silently ignored** and will
believe they committed it.

**Fix:** add a negation to `.gitignore` immediately after the `.env*` line:
```gitignore
# env files (can opt-in for committing if needed)
.env*
!.env.example
```
Then create `.env.example` documenting (with placeholder values only, never real ones):
`NEXT_PUBLIC_SITE_URL`, `SURVEY_PROVIDER` (`qualtrics` | `native`), `QUALTRICS_SURVEY_URL`,
`QUALTRICS_ORIGIN` (names per `qualtrics-integration.md:74-78`), and a `DATABASE_URL` placeholder
marked Phase 3 / ADR-009. Verify with `git check-ignore -v .env.example` returning nothing.

### P1-3. All 10 ADR files missing (disclosed)

`docs/` does not exist. `CHANGELOG.md:54-63` indexes ADR-001…010 pointing at
`docs/adr/000N-*.md`; spec §20 Phase 0 acceptance requires "ADRs committed".

**Fix:** write `docs/adr/0001-…` through `docs/adr/0010-…` at exactly the paths the changelog
index already names (they're listed there — use them verbatim so the index stops lying). Content
for 001–008 is in spec §3's table; 009 and 010 must be taken from the **amended** changelog entry
of 2026-07-16 ("drop Supabase; Docker+Postgres everywhere"), **not** the superseded entry below it
that still says non-prod uses Supabase. Give each the standard ADR shape (Context / Decision /
Status / Consequences) and mark all `proposed`, matching the index.

### P1-4. No sitemap at all ⚠ UNDISCLOSED

Verified: no `sitemap*` anywhere in `out/`, and no `src/app/sitemap.ts`.

Required by spec §10.1 ("XML **sitemap** auto-generated at build, includes all public routes with
`lastmod`"), and named in Phase 1 acceptance: "**sitemap** & robots valid and derived from
`site.config`". Phase 1 is `in_progress` and claims the SEO baseline as its scope. Not mentioned
anywhere in the changelog.

**Fix:** add `src/app/sitemap.ts` using Next's metadata route, deriving the origin from
`siteConfig.canonicalUrl` (never a literal):
```ts
import type { MetadataRoute } from "next";
import { siteConfig } from "@/site.config";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/faq", "/report"];
  return routes.map((path) => ({
    url: `${siteConfig.canonicalUrl}${path}`,
    lastModified: new Date(),
  }));
}
```
Confirm `output: "export"` emits `out/sitemap.xml` after `npm run build`. Extend `routes` as Phase 1
pages land. Do not submit it anywhere until AC-DOMAIN is satisfied (Phase 5).

### P1-5. `robots.txt` is a static file that will **defeat the `indexable` flag** — ADR-008 violation ⚠ UNDISCLOSED

**File:** `public/robots.txt`

It's hand-written and hardcodes `Disallow: /`. It does not read `site.config.ts`. Spec §5.1 is
explicit that "the generated `sitemap.xml`, **`robots.txt`**, and `llms.txt` — **must derive from
this file**."

The consequence is a live footgun on the single most SEO-critical action in the whole project:
when someone follows the ▶ RESUME HERE block and flips `siteConfig.indexable = true`, the meta tag
flips to `index, follow` but **`robots.txt` still says `Disallow: /`** — the site stays uncrawlable,
and the failure is silent. This directly undermines AC-DOMAIN.

**Fix:** delete `public/robots.txt` and replace it with `src/app/robots.ts` so both signals come
from one source:
```ts
import type { MetadataRoute } from "next";
import { siteConfig } from "@/site.config";

export default function robots(): MetadataRoute.Robots {
  return siteConfig.indexable
    ? {
        rules: { userAgent: "*", allow: "/" },
        sitemap: `${siteConfig.canonicalUrl}/sitemap.xml`,
      }
    : { rules: { userAgent: "*", disallow: "/" } };
}
```
The AI-crawler policy (D5, spec §11.6) belongs in the `indexable: true` branch — leave a `TODO`
referencing D5 rather than inventing a policy. Verify by flipping `indexable` locally, rebuilding,
and confirming `out/robots.txt` **and** the meta tag change together. Then flip it back to `false`.

### P1-6. The "no hard-coded name/domain" check does not exist (disclosed)

Phase 0 acceptance: "the 'no hard-coded name/domain' check **is active**." `eslint.config.mjs` has
no such rule. The rule currently holds by discipline alone — I verified it by grep, which is
exactly what ADR-008 says shouldn't be necessary.

**Fix:** add an ESLint `no-restricted-syntax` rule matching string literals containing
`aijwerkingen` / `AIjwerkingen` / `AMC-Larebish` / `github.io`, with `src/site.config.ts` excluded
via an override block. **Then verify it fails**: temporarily paste the brand string into
`src/app/page.tsx`, confirm `npm run lint` errors, revert. `REVIEW.md` item 2 explicitly warns not
to just confirm the file exists. Wire `npm run lint` into CI (P1-7) or the check is decorative.

### P1-7. CI runs no typecheck or lint, and never runs on PRs (partially disclosed)

**File:** `.github/workflows/deploy.yml`

The changelog says "CI (typecheck/lint/build on PR) not yet wired up" — true, but it undersells
things: a workflow **does** exist and **does** auto-deploy on push to `main` (P0-1), while running
`npm ci` + `npm run build` only. Phase 0 acceptance requires "CI runs typecheck/lint". Spec §19
requires a per-PR pipeline: "install → typecheck → lint → … All green required to merge."

**Fix:** add `.github/workflows/ci.yml` triggered on `pull_request` and `push` to `main`, running
`npm ci`, `npx tsc --noEmit`, `npm run lint`, `npm run build`. Both currently pass locally, so this
lands green. Keep it a separate workflow from deploy — deploy should stay gated per P0-1. Test/a11y/
Lighthouse/security stages from spec §18 come with their phases; note them as `TODO` rather than
faking green jobs.

### P1-8. No canonical URL on any page ⚠ UNDISCLOSED

Verified: zero `rel="canonical"` in `out/`. `layout.tsx:7` sets `metadataBase` but never
`alternates.canonical`.

Required by spec §6 ("each with unique `<title>`, meta description, **canonical URL**, Open
Graph/Twitter tags"), §10.1 ("**Canonical URLs on every page**"), and §5.1 lists canonical among
the artifacts that must derive from `site.config`.

**Fix:** in `src/app/layout.tsx` metadata add `alternates: { canonical: "/" }`, and add
`alternates: { canonical: "/faq" }` / `{ canonical: "/report" }` to the respective page metadata
exports. With `metadataBase` already set from `siteConfig.canonicalUrl`, relative values resolve
correctly and stay config-derived. Verify `rel="canonical"` appears in all three `out/*.html`.

### P1-9. No Open Graph or Twitter tags anywhere ⚠ UNDISCLOSED

Verified: zero `og:` or `twitter:` tags in `out/index.html`. Required by spec §6 and §5.1.

**Fix:** add an `openGraph` block to the root metadata in `layout.tsx` (`type: "website"`,
`siteName: siteConfig.name`, `url: siteConfig.canonicalUrl`, `locale: siteConfig.defaultLocale`)
plus `twitter: { card: "summary_large_image" }`. Per-page `openGraph.title`/`description` inherit
from the title template. An OG image needs D11 (visual identity) — leave a `TODO` rather than
shipping a broken image reference.

### P1-10. `/report` has no `WebPage` schema ⚠ UNDISCLOSED

Spec §6 assigns `/report` the `WebPage` type ("optionally `MedicalWebPage`"). Only the inherited
sitewide `Organization` + `WebSite` are present. Phase 1 acceptance requires "per-page schema".

**Fix:** add a `WebPage` JSON-LD block to `src/app/report/page.tsx` following the `/faq` pattern,
with `name`, `description`, `url` derived from `siteConfig`. Defer `MedicalWebPage` — it carries
medical-claim implications that need the D11/compliance copy owner.

### P1-11. 404 page is the raw Next.js default ⚠ UNDISCLOSED

Verified: `out/404.html` renders "This page could not be found", with **no site header/footer and
no links back** (zero `<a href>` in the document).

Spec §6 requires error pages be "Helpful, on-brand, link back to key pages."

**Fix:** add `src/app/not-found.tsx` rendering inside the app shell, with an apology line and links
to `/`, `/faq`, `/report`. Rebuild and confirm `out/404.html` contains those links.

### P1-12. `siteConfig.logo` points at a file that doesn't exist ⚠ UNDISCLOSED

**File:** `src/site.config.ts:16` — `logo: "/logo.svg"`, but `public/logo.svg` does not exist.

Currently latent (the `Organization` JSON-LD in `layout.tsx:33-40` doesn't emit `logo`), but it will
produce a broken schema reference the moment someone wires it up per spec §5.1.

**Fix:** blocked on D11. Either add a placeholder `public/logo.svg`, or set `logo: ""` with a
`TODO: D11` comment so the dangling path isn't mistaken for a working asset. Don't emit `logo` into
JSON-LD until the file exists.

### P1-13. Purge every reference to the inspiration platforms — complete inventory

Owner's instruction: no references to Lareb or the other platforms the project drew on. I grepped
for `lareb|vaers|faers|yellow ?card|vigiaccess|mothertobaby|otis|uppsala|mhra` across all tracked
source, docs, configs, and seeds. **Complete list — this is all of them:**

**User-facing (ships to the browser — highest priority, both also flagged in P0-4):**
| File:line | Reference |
|---|---|
| `src/app/page.tsx:46` | "pharmacovigilance centres **like Lareb**" — in a trust card on the home page |
| `src/app/faq/page.tsx:26` | "national pharmacovigilance centres **such as Lareb**" — in an FAQ answer **and therefore inside the `FAQPage` JSON-LD**, i.e. fed to answer engines as a factual claim |

**Docs, seeds, and identifiers:**
| File:line | Reference |
|---|---|
| `README.md:3` | "modelled on sites like **lareb.nl** (NL), **VAERS/FAERS** (US), **MHRA Yellow Card** (UK), **VigiAccess** (WHO), and **MotherToBaby** (US)" |
| `TECHNICAL_SPEC.md:17` | Terminology note: "**Larebish** = **Lareb-like**… reference site is **lareb.nl**… **VAERS**, **FAERS**, **MHRA Yellow Card**, **VigiAccess**/**Uppsala**, **MotherToBaby/OTIS**" |
| `TECHNICAL_SPEC.md:482` | D11 row: "the studied reference sites (**lareb.nl**, **VAERS**, **MHRA Yellow Card**, **VigiAccess**)" |
| `CHANGELOG.md:251` | Same list, in the D11 planning entry |
| `TECHNICAL_SPEC.md:1,3,150,151,472` | Project/working name **AMC-Larebish** (= "Lareb-like") |
| `survey.schema.json:3,4` | `$id: "https://amc-larebish.example/…"`, `title: "AMC-Larebish survey configuration"` |
| `survey.example.yaml:1` | Header comment |
| `schema-examples.jsonld:2,8,18` | `_note` + `Organization.name` + `WebSite.name` |
| `llms.example.txt:1,3,10` | Title, description, home-page entry |
| `robots.example.txt:1` | Header comment |
| `qualtrics-integration.md:3,15,71` | Prose; **`:45,:106`** also use the `postMessage` sender token `"amc-larebish-survey"` |
| `CHANGELOG.md:1,155,165` | Ledger title + the `AMC-Larebish/` workspace-directory path |

**Fix:**
1. Purge the user-facing two first (`page.tsx:46`, `faq/page.tsx:26`) — they are live claims of
   association with a named national body, and the FAQ one is emitted as structured data.
2. Rewrite `README.md:3` and `TECHNICAL_SPEC.md:17` from scratch rather than deleting clauses;
   both sentences are *built around* the analogy and won't survive excision (P1-16).
3. **`CHANGELOG.md` is append-only (spec §21 rule 2) — do not edit lines 1, 155, 165, 251.**
   Append a correcting entry recording the scope change and the rename instead.
4. The `"amc-larebish-survey"` `postMessage` token is a wire contract that must match the JS pasted
   into Qualtrics — change it in the runbook and in Qualtrics **together**, or completion detection
   silently breaks (it's not built yet, so now is the cheap moment).
5. **Verify with the same grep** afterwards; expect zero hits outside `CHANGELOG.md` history and
   this file:
   ```
   grep -rniE "lareb|vaers|faers|yellow ?card|vigiaccess|mothertobaby|otis|uppsala|mhra" \
     --include="*.ts" --include="*.tsx" --include="*.md" --include="*.yaml" \
     --include="*.json" --include="*.jsonld" --include="*.txt" . | grep -v node_modules
   ```
6. Consider adding these terms to the P1-6 lint rule so they can't come back in app code.

> **Note on the analogs' *methods*.** The instruction is about *references*, which I read as the
> named citations above. The underlying structural patterns (answer-first FAQ, one prominent
> report CTA, anonymous-by-default) are generic and carry no attribution — they can stay. If the
> intent is broader (avoid resembling those services at all), say so, because that reopens the
> §6 information architecture, not just the copy.

### P1-14. Rewrite the app copy to the real domain

**Files:** `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/faq/page.tsx`, `src/app/report/page.tsx`

Per P0-4's table. The good news: the *structure* transfers almost unchanged — "report a perceived
adverse effect, anonymously, in a few minutes" is the same shape. What changes is the entity
(medicine/vaccine → **AI tool or platform**), the audience (patient/HCP → **anyone affected**,
incl. parents/carers, educators, clinicians, researchers), and the disclaimer (P0-5).

**Fix — a copy pass, owned by the D11 copy author, not improvised by an engineer:**
- `layout.tsx:13` / `report/page.tsx:6` — meta descriptions → perceived effects of conversational
  AI tools and digital/social media.
- `layout.tsx:90` — replace the medical-advice disclaimer with P0-5's crisis signposting.
- `page.tsx:9` — `<h1>` → the AI/social-media framing. Keep it question-shaped (spec §11.2).
- `page.tsx:12-17` — drop "patient or healthcare professional"; describe the real audience.
- `page.tsx:42` — "no medical jargon" → no jargon / no technical knowledge needed.
- `page.tsx:46` — rewrite (banned reference + a claim the service can't currently keep, P0-1).
- `faq/page.tsx` — 11 of 12 answers need rework. Two are **deletions**, not rewrites: "Will
  reporting affect my treatment?" (`:33`) and "Do I need to know the exact medicine name?" (`:17`)
  have no analog. Their replacements are the questions this domain actually raises: *Which tools
  and platforms can I report?* / *What if I don't know which app caused it?* / *Can I report on
  behalf of my child?* (ties to P0-5) / *Will you contact the company I'm reporting?* (ties to
  P1-17).
- Keep answers at 40–60 words with `FAQPage` schema (spec §6/§11.2) — the existing ones are
  well-calibrated; reuse the rhythm.
- Spec §7's accuracy bar and §11's guardrail still bind: **do not** claim reports are reviewed,
  acted on, or shared with anyone until that's true (P0-1).

### P1-15. Rewrite the seed artifacts and configs

**Files:** `survey.example.yaml`, `llms.example.txt`, `schema-examples.jsonld`, `robots.example.txt`,
`survey.schema.json`

These are the "seeds" the spec's appendices point implementers at. Every one is
medicines-and-vaccines.

- **`survey.schema.json` — good news: it survives.** The schema is domain-agnostic (field *types*,
  `pii` flags, conditionals). Only `$id` (`:3`) and `title` (`:4`) carry the old name. No structural
  change needed.
- **`survey.example.yaml` — the structure maps cleanly; only the entity changes:**
  | Current | Becomes |
  |---|---|
  | `metadata.title/description` ("medicine and vaccine safety") | the AI/digital-media framing |
  | `who_is_reporting`: `patient` / `carer` / `healthcare_professional` | person affected / parent or carer / professional (clinician, educator, researcher) — **and see P0-5 on age** |
  | section `the_product` → "The medicine or vaccine" | "The tool or platform" |
  | `product_name` "Name of the medicine or vaccine" | name of the AI tool / platform |
  | `batch_number` "Batch / lot number" | **the closest true analog is version / model** (e.g. app version, model name) — optional, same "if known" framing |
  | `the_reaction` / `reaction_description` / `start_date` / `severity` / `ongoing` / `outcome` | **transfer as-is** — these are the genuinely reusable core |
  | `contact_email` (`pii: true`) | unchanged |
  New fields worth considering: usage context and duration (dose/duration analog), and whether the
  effect is ongoing use. Keep `pii: true` on all free text — **more** important here, since
  free text will name real companies and possibly real people (P1-17).
  Bump `version` (it becomes `survey_version` on every submission) and note D8 stays open.
- **`llms.example.txt`** — title, the description block (`:3-5`), the home entry (`:10`), and
  "Key facts" (`Purpose: collect suspected adverse drug/vaccine reaction reports`) all rewrite.
  Keep the `example.org` placeholders — they're correct until D9.
- **`schema-examples.jsonld`** — `_note`, `Organization.name`, `Organization.description`
  ("side effects of medicines and vaccines"), `WebSite.name`, and both `FAQPage` answers.
  **Do not introduce any medical schema.org type here** (see the P1-10 amendment).
- **`robots.example.txt`** — header comment only. Note this file is now *doubly* stale: P1-5
  replaces the real `robots.txt` with a generated `src/app/robots.ts`, so decide whether this seed
  should exist at all rather than rewriting it twice.

### P1-16. Restate the spec, and settle the name (D1)

**Files:** `TECHNICAL_SPEC.md` (§0 terminology, §1, §2.1/§2.2, §6, §7, §8.4, §13, §20, §22),
`README.md:3`

The spec is the document every future agent is told to read first, and it is wrong about what is
being built. This is the root cause of the whole class — the copy is wrong *because* the spec is.
Fix it before anyone builds Phase 1 pages from it.

- **§0 terminology note (`:17`)** — delete outright and rewrite. "'Larebish' = 'Lareb-like'" is
  simultaneously the wrong domain and a banned reference. It also carries the false claim that the
  platform "collects **suspected adverse drug/vaccine reaction reports**… from patients and
  healthcare professionals."
- **§1 Context** — "The reference domain is **pharmacovigilance**" and the four-bullet framing all
  go. Restate: perceived adverse effects of conversational AI and digital/social media.
- **§2.2 Non-goals (`:62`)** — "Clinical signal detection, coding (**MedDRA**), or regulatory
  transmission (**E2B(R3)**)" is pharmacovigilance-specific and meaningless now; same for §20
  Phase 6 (`:447`). Replace with the real out-of-scope items or delete.
- **§6 (`:185`)** — drop "optionally `MedicalWebPage`" (P1-10 amendment).
- **§7 / §13** — the disclaimer rule and the health-data framing both need P0-5 and P1-17's input.
- **§22** — D1 and D11 rows cite the analogs; D11's suggested "mood-board anchored to the studied
  reference sites" is now void guidance for the design pass.
- **`README.md:3`** — one sentence, entirely built on the banned analogy. Rewrite whole.

**On the name (D1):** `AIjwerkingen` (AI + *bijwerkingen*) already fits the real product exactly,
while `AMC-Larebish` means "Lareb-like". Recommend **resolving D1 in favour of AIjwerkingen** and
retitling the spec and ledger. Note the scope:
- `src/site.config.ts` already says `AIjwerkingen` — **no app code changes** (ADR-008 earning its
  keep; verified no brand literal leaks outside that file).
- The parent workspace directory is still `AMC-Larebish/` — renaming it is **user-owned** and
  would break `../.claude/launch.json`'s hardcoded path (see the reorg entry) and this session's
  paths. Flag it; don't let an agent do it unprompted.
- **D9 (domain) stays open** — `aijwerkingen.github.io` remains a placeholder, `indexable: false`
  stands, AC-DOMAIN is untouched. Resolving the name changes nothing about the SEO posture (spec
  §5.2: the name floats at zero cost; only the domain is gating).

### P1-17. Redo the regulatory analysis — the burden shifts, it does not drop

**Files:** `TECHNICAL_SPEC.md` §13, §22 (D3, D4); `CHANGELOG.md` "Blocking items to closure"

The most likely mistake this pivot invites is: *"it's not medicines anymore, so the Art. 9 health-
data burden goes away and the DPIA gets easier."* **That is wrong, and it should be written down
before someone acts on it.**

- **Art. 9 still applies.** Reports of perceived psychological harm — anxiety, depression, self-harm,
  disordered eating, compulsive use — are **health data**, special-category under GDPR Art. 9,
  exactly as before. D4 (DPIA, lawful basis, Art. 9 condition) remains blocking and unchanged in
  weight. The free-text "Describe what happened" field is *more* likely to contain
  special-category data here than in the medicines framing, not less.
- **New: children's data** (P0-5) — a dimension the spec never had.
- **New: third parties get named.** Reports will name real companies and products, and possibly
  real individuals (an influencer, a named account). That's two problems the spec has nothing on:
  personal data about a **non-reporting** data subject (which has its own Art. 14 / rights
  implications), and publishing/handling adverse claims about identifiable commercial actors.
  A moderation and retention policy for named third parties is new required work.
- **The regulator changes.** The spec's implicit frame is pharmacovigilance regulation. That is
  simply not the applicable regime. The adjacent EU regimes for this domain are the **Digital
  Services Act** and the **AI Act** — but I'm flagging that as a **question for legal, not a
  conclusion**; I'm not qualified to assert which apply or how. What matters here is that the
  spec's existing regulatory framing is void and must be re-derived, not edited.
- **D3 (Qualtrics DPA/EU storage) is unchanged and still blocking** — the data is still
  special-category, so the DPA and region questions (and P0-2) are exactly as live as before.

**Fix:** commission a fresh §13 from the DPO/legal owner against the real domain; update D3/D4;
add the minors decision (P0-5) and a named-third-party policy as new rows in §22 and as blocking
items in the changelog's "Blocking items to closure" list.

---

## P2 — Correctness & hardening

### P2-1. No CSP or security headers at all — and GitHub Pages **cannot** serve them (architectural)

Verified: no `headers()` in `next.config.ts`, no `<meta http-equiv>` in any exported HTML, nothing
in the workflow. So today the site has no CSP, no `X-Content-Type-Options`, no `Referrer-Policy`,
no `X-Frame-Options`/`frame-ancestors`, no `Permissions-Policy`.

This is not merely undone — it is **not achievable on the current hosting**. GitHub Pages serves
static files with fixed headers and no configuration hook, and Next's `async headers()` is inert
under `output: "export"`. Yet Phase 1 acceptance demands "header scanner **A/A+**", spec §12.1
demands a strict CSP including a Qualtrics-scoped `frame-src`, and Phase 2 acceptance demands
"CSP `frame-src` scoped to Qualtrics; **CSP correct**".

**This is a real contradiction between ADR-010 (Pages as the static tier) and the Phase 1/2
acceptance criteria, and nothing in the changelog acknowledges it.**

**Fix — decide and record as an ADR, don't quietly skip it:**
1. Interim: a `<meta http-equiv="Content-Security-Policy">` in `layout.tsx` `<head>` gets you
   `default-src`, `frame-src https://*.qualtrics.com`, `script-src`, etc. Note the limits honestly:
   `frame-ancestors`, HSTS, and `X-Content-Type-Options` **cannot** be set via meta and will remain
   absent on Pages — an external scanner will not return A/A+.
2. Therefore either (a) amend Phase 1/2 acceptance to scope the header criteria to the Phase 3+
   server host where they're actually enforceable, or (b) front Pages with a CDN/proxy that can
   inject headers, or (c) move the static tier to a host that supports them.
3. Whichever you pick, write it up as an ADR and amend spec §20 — leaving an unachievable
   criterion in place guarantees a phase gets marked `done` with the criterion quietly unmet.

### P2-2. Qualtrics survey URL hardcoded in the component

**File:** `src/app/report/page.tsx:13-14`

Spec §19: "`SURVEY_PROVIDER` and Qualtrics URL/API creds injected **per environment (never
committed)**." Spec §8.5: "No question text, field definitions, or **backend endpoints** are
hard-coded into components." The URL is currently committed source.

Not a secret leak (an anonymous survey link is public by design), but it hardcodes the environment
into the component and blocks the per-env config that Phase 2 requires.

**Fix:** move to `NEXT_PUBLIC_QUALTRICS_SURVEY_URL` + `NEXT_PUBLIC_QUALTRICS_ORIGIN` (needed for
`postMessage` origin validation anyway), document both in `.env.example` (P1-2), and read them via
the `SurveyProvider` abstraction when it's built. Under static export these inline at build time —
so per-environment means per-build, which is fine for Pages but should be stated in the ADR.

### P2-3. The `/report` iframe is not sandboxed

**File:** `src/app/report/page.tsx:29-35`

Spec §12.6: "sandbox the iframe **as tightly as functionality allows**." `referrerPolicy` and
`allowFullScreen={false}` are correctly set; `sandbox` is absent entirely.

**Fix:** add a `sandbox` attribute — start from `sandbox="allow-scripts allow-forms
allow-same-origin allow-popups"` and **test the real survey against it**, since Qualtrics needs
scripts, forms, and same-origin for its own storage. Land this together with the `frame-src` CSP
(P2-1) and the `postMessage` origin check (already a disclosed Phase 2 gap).

### P2-4. Two moderate dependency vulnerabilities

`npm audit`: `postcss <8.5.10` (XSS via unescaped `</style>`, GHSA-qx2v-qp2m-jg93), reached
transitively through `next@16.2.10`. 2 moderate; **no high/critical**, so the Phase 4 gate ("0
high/critical") is not currently breached.

**Fix:** do **not** run `npm audit fix --force` — it wants to downgrade to `next@9.3.3`, which
would destroy the app. Track the upstream fix and bump `next` when a patched release ships. Spec
§12.5 wants automated scanning: enable Dependabot (`.github/dependabot.yml`) and add `npm audit
--audit-level=high` to CI so this stays visible without failing the build on the current moderates.

### P2-5. Home page CTA labelled "How it works" links to `/faq`

**File:** `src/app/page.tsx:25-30`

`/how-it-works` is a real route in spec §6 (with `HowTo` schema) that isn't built yet. The button
says "How it works" and silently goes somewhere else. Spec §10.2 wants hub/spoke internal linking
(Home → How it works → FAQ → Report) — this quietly collapses two spokes into one.

**Fix:** relabel to "Common questions" until `/how-it-works` exists, then repoint it.

### P2-6. `.gitignore` has a duplicate `.qualtrics` rule

**File:** `.gitignore:2` and `.gitignore:29`

Harmless but confusing — line 2 sits above the "# dependencies" header, detached from the
"# secrets — never commit" block that already covers it.

**Fix:** delete line 2, keep the one under the secrets comment. (Also drop it entirely once P0-3
is resolved and the file is gone.)

### P2-7. Dead CSS variables; no `prefers-reduced-motion`

**File:** `src/app/globals.css:3-19`

`--background`/`--foreground` are defined and applied to `body`, then immediately overridden by
`bg-white text-slate-900` on the `<body>` in `layout.tsx:58`. Leftover create-next-app scaffolding
that now misleads. Spec §14 also requires `prefers-reduced-motion` be respected — no such rule
exists (currently no animations, so latent).

**Fix:** fold into the D11 visual-identity pass — either make the tokens real (drive them from
design tokens per spec §5) or delete them. Add a `prefers-reduced-motion` guard when motion is
introduced.

---

## P3 — Documentation & tooling drift

### P3-1. The spec's paths don't match the repo (~15 references)

The 2026-07-16 reorg moved everything flat to the repo root, but `TECHNICAL_SPEC.md` was never
updated. Verified stale:

| Spec reference | Reality |
|---|---|
| §5, §8.4, §9, §20, Appendix A/B/C/D — `config/survey.example.yaml`, `config/survey.schema.json`, `config/robots.example.txt`, `config/llms.example.txt`, `config/schema-examples.jsonld` | `config/` **does not exist**; all five are flat at repo root |
| §8.3, §20 Phase 2, Appendix G — `docs/qualtrics-integration.md` | at repo root as `qualtrics-integration.md` |
| §12, §20 Phase 0 — `SECURITY.md` | does not exist (P1-1) |
| Appendix E, §20 Phase 0 — `.env.example` | does not exist (P1-2) |

The README was already corrected for this (per the changelog); the spec was missed.

**Fix:** update the spec's paths to match disk. Note that `docs/adr/` **is** the correct future
home for P1-3 (it's just unbuilt) — don't "fix" those refs to root. `qualtrics-integration.md:74`
also references `.env.example`, which resolves once P1-2 lands.

### P3-2. The 2026-07-12 changelog entry claims files that never existed

`CHANGELOG.md:339-341` claims it authored `config/survey.example.yaml`, `config/survey.schema.json`,
`config/robots.example.txt`, `config/llms.example.txt`, `config/schema-examples.jsonld`, and
`.env.example`. The five artifacts exist (at root, not `config/`); **`.env.example` never existed
anywhere**.

Per spec §21 rule 2, history is append-only — **do not edit that entry**.

**Fix:** append a correcting entry noting the `config/` paths were never real and `.env.example`
was never created, pointing at P1-2.

### P3-3. Codegraph is silently inactive in this workspace

`AGENTS.md` and `REVIEW.md` both instruct agents to prefer codegraph's MCP tools over
`grep`/`find`. In this session the codegraph server reported: *"This workspace has no codegraph
index (no `.codegraph/` directory), so no codegraph tools are available."*

Root cause: `.codegraph/` lives at `aijwerkingen.github.io/.codegraph`, but the session root is the
**parent** workspace (`AMC-Larebish/`) — the same root-mismatch that already forced a duplicated
`.claude/launch.json` during the reorg. This review therefore fell back to Unix search (explicitly
permitted by both files).

**Fix:** either run `codegraph init` at the session root, or document in `AGENTS.md` that the repo
must be opened directly as its own project root for codegraph to attach. Right now the instruction
reads as active but silently isn't. Note `.gitignore:3` ignores `.codegraph` — correct, keep.

### P3-4. Phase status board overstates Phase 2

`CHANGELOG.md:37` marks Phase 2 `in_progress` — defensible, but of its acceptance criteria
(`SurveyProvider` interface, `postMessage` completion + origin validation, thank-you state,
analytics conversion event, CSP `frame-src`, a11y fallback, integration test) only the **a11y
fallback link** is actually done. What exists is a bare iframe. The board's own note says as much,
so this is a nuance, not a contradiction — but combined with P0-1, "Phase 2 in progress" reads as
more compliance-relevant progress than exists.

**Fix:** no board change needed. Consider a one-line note that the Phase 2 embed is running **ahead
of** the Phase 4 gate that governs real submissions, and is not deployable until P0-1 is resolved.

---

## Suggested order

Revised for the scope change. The rule of thumb: **stop the bleeding, then fix the premise, then
rebuild on it.** Doing SEO work before P1-16 means generating sitemaps, canonicals, and JSON-LD
for the wrong product.

1. **P0-1** (gate the workflow to `workflow_dispatch`) — before any push. One line. Everything
   else can safely wait behind it, and nothing else is safe until it's done.
2. **P1-2** (`.gitignore` `.env*` trap) — one line, and it silently wastes someone's afternoon otherwise.
3. **P1-16** (restate the spec + settle D1) — **the new critical path.** Every downstream copy,
   schema, and content task reads from the spec; fixing them first means doing them twice.
4. **P1-17** + **P0-5** (regulatory re-analysis; crisis signposting + minors) — start these *now*,
   in parallel: they're owned by legal/DPO and the copy author, so they have the longest lead time
   and they gate real deployment. Don't queue them behind engineering.
5. **P1-13** (purge the platform references) — do the two user-facing hits (`page.tsx:46`,
   `faq/page.tsx:26`) immediately; they're live claims of association with a named national body.
6. **P1-14** + **P1-15** (rewrite app copy + seeds) — needs 3 and 4 settled first.
7. **P1-5** + **P1-4** (`robots.ts` + `sitemap.ts`) — kills the AC-DOMAIN footgun, closes the
   biggest SEO gap. Domain-independent, so it *can* run in parallel with the rewrite.
8. **P1-8**, **P1-9**, **P1-10** (canonicals, OG, `WebPage` — **not** `MedicalWebPage`), **P1-11**
   (404) — the rest of the Phase 1 SEO baseline; all small. Content-dependent, so after 6.
9. **P1-7** + **P1-6** (CI, then the lint rule with a proven failure) — order matters; the rule is
   decorative without CI. Add the banned platform names to the rule while you're there (P1-13.6).
10. **P1-1**, **P1-3** (`SECURITY.md`, ADRs) — pure writing, no code risk. ADR content should
    reflect the restated domain, so after 3.
11. **P2-1** (the headers/hosting contradiction) — needs a decision, not a patch. Don't let it ride.
12. **P0-2** (Qualtrics EU region) — feeds D3; needs the account owner. Unchanged by the pivot:
    the data is still special-category (P1-17).
13. Everything else.

**Changelog:** per spec §21, append one entry recording the scope change itself (product
redefinition + reference purge + D1) before starting — a future cold agent reading the ledger will
otherwise inherit the pharmacovigilance premise from every entry above it. Do not rewrite history.
