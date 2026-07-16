# AIjwerkingen — Technical Specification

**Project:** AIjwerkingen — a public-facing survey & data-collection website for reporting perceived adverse effects of conversational AI tools and digital/social media
**Status:** Draft v1.2 (specification, pre-implementation) — restated 2026-07-16 for the scope change; see `CHANGELOG.md` and `PENDING-FIXES.md`
**Owner:** _(fill in)_
**Last updated:** 2026-07-16

---

## 0. How to use this document

This spec is written so that **any competent engineering agent (human or AI) can pick it up and implement it in phases without prior context**. Two rules make that possible:

1. **Read the whole spec once, then work phase-by-phase.** Section 20 (Phased Implementation Plan) is the execution order. Do not start a later phase until the acceptance criteria of the current phase are met.
2. **Persist status in the change log.** `CHANGELOG.md` (sibling file) is the single source of truth for *what has been done and what the current state is*. **Every phase, and every meaningful task within a phase, must be recorded there before the agent hands off or stops.** An agent resuming work reads `CHANGELOG.md` first to learn the exact current state, then continues. The change-log protocol is defined in Section 21.

> **Terminology note.** "AIjwerkingen" = *AI* + *bijwerkingen* (Dutch for "side effects"). This platform collects **perceived adverse-effect reports about conversational AI tools and digital/social media platforms**, submitted by anyone affected and by parents, carers, and professionals supporting someone else. Decision D1 (Section 22) is resolved in favour of this name — `site.config.ts` already reflects it. This document does **not** name, and must not name, any specific pre-existing reporting platform or regulatory body as a model or analog (see `PENDING-FIXES.md` P1-13 for why).

### 0.1 ▶ START HERE when you resume after finalizing the domain & name

You paused this project with the **product name and domain undecided** (decisions D1/D9). When you come back having bought the domain and picked the name, do exactly this, in order:

1. **Read `CHANGELOG.md` first.** It tells you which phase is active and what's already done. It has a mirror of these steps at the top.
2. **Fill in `site.config.ts`** (the single source of truth — Section 5.1). Set `name`, `canonicalUrl` (the real domain, no trailing slash), `logo`, and the NAP (name/address/phone). This one edit propagates the name and domain into every title, meta tag, Open Graph tag, JSON-LD `@id`, canonical URL, sitemap, `robots.txt`, and `llms.txt`. **Do not hunt through the codebase — everything reads from this file.**
3. **Set `NEXT_PUBLIC_SITE_URL`** to the same canonical origin in each environment's secrets (it must match `site.config`).
4. **Verify the domain in Search Console** (a person does this once — Section 15) and submit the sitemap.
5. **Only now flip production to indexable.** Until this point, all non-production environments stay `noindex` (Section 15, and acceptance criterion AC-DOMAIN in Section 2.3). This is what protects your SEO: nothing gets crawled on a placeholder/preview URL, so there is no old domain to migrate away from later.
6. If you had already gone live on a *temporary* domain, follow the **domain-migration checklist** in Section 5.2 (301s + Search Console Change of Address) instead of a clean cutover.

> **The rule in one line:** the *name* can stay undecided as long as you like at zero SEO cost; the *domain* must be final before anything is indexed. See Section 5.2 for why.

---

## 1. Context & background

The domain is **perceived adverse effects of conversational AI tools and digital/social media**: collecting, storing, and analysing reports of harm — psychological, behavioural, or otherwise — that people perceive as linked to using an AI chatbot/companion, an AI-powered app, or a social media platform. Reporters may be the affected person, a parent or carer, or a professional (clinician, educator, researcher). This is a new domain with no single established model to follow; the site's shape is nonetheless informed by general good practice for public harm-reporting services:

- A **trustworthy, informative public website** (who we are, what we do, why reporting matters, privacy assurances).
- A prominent **"Report a side effect" / submission flow** — the core conversion.
- **Aggregated information** about tools/platforms and reported effects (later-phase, out of initial scope).
- Strong **privacy, security, and regulatory** expectations, because free-text reports are likely to contain special-category (health) data under GDPR Art. 9, may involve minors, and may name identifiable third parties (see Section 13 and `PENDING-FIXES.md` P1-17).

**This spec's near-term goal is deliberately scoped:** build a *proper, modern, informative, discoverable, secure* website whose central action is a data-collection/survey flow — **without yet committing to the final survey questions or the final data backend.** The survey layer is therefore designed as a **swappable module** with two supported implementations (see Section 8), selected by configuration.

---

## 2. Goals, non-goals, success criteria

### 2.1 Goals
1. A modern, responsive, accessible, public-facing marketing + information website (landing page, About, How it works, FAQ, Privacy, Contact, and a dedicated **Submission** page).
2. A **survey/data-collection layer** that can operate in either of two modes, switchable by config with **no code rewrite**:
   - **Mode A — Qualtrics-embedded:** all questions/answers live in Qualtrics; the app embeds the Qualtrics survey.
   - **Mode B — Self-hosted:** questions are rendered by our own frontend from a **config file** (not hard-coded) and submitted to **our own backend**.
3. First-class **SEO** (crawlable, indexable, fast, structured).
4. First-class **AEO/GEO** (citable and answerable by AI answer engines: ChatGPT, Perplexity, Gemini, Claude, Google AI Overviews).
5. Strong **security** and **privacy/regulatory compliance** appropriate for health data (GDPR special-category data).
6. **Google Search Console** verified, sitemap submitted, indexing monitored.
7. Content authored so questions are **externalised into config** — the site can ship and be optimised before final questions are decided.

### 2.2 Non-goals (for the initial build)
- Public searchable database of reported effects / analytics dashboards (future phase).
- Automated harm classification, moderation, or regulatory transmission pipelines.
- Authenticated user accounts / reporter portals (future phase; anonymous submission is the default).
- Native mobile apps.

### 2.3 Success criteria (measurable)
- Lighthouse ≥ 95 for Performance, Accessibility, Best Practices, SEO on the landing and submission pages (mobile profile).
- Core Web Vitals in "good" range (LCP < 2.5s, INP < 200ms, CLS < 0.1) at p75.
- 100% of primary pages server-rendered with valid, testable JSON-LD (Google Rich Results Test passes).
- WCAG 2.2 AA conformance on all public pages (automated + manual audit).
- Switching survey mode = **one config value + one redeploy**, verified by an automated test that boots both modes.
- Search Console: property verified, sitemap accepted, 0 critical coverage errors after first crawl.
- Security headers score A/A+ on an external header scanner; no high/critical findings in dependency and DAST scans.
- **AC-DOMAIN:** production is made indexable **only after** `site.config.canonicalUrl` is set to the final purchased domain and that domain is verified in Search Console; all non-production environments are `noindex`. No brand string or domain literal appears anywhere outside `site.config` (enforced by a build/lint check).

---

## 3. Key architectural decisions (ADR summary)

Record these as ADRs (`docs/adr/NNNN-*.md`) during Phase 0. Rationale in brackets.

| ID | Decision | Rationale |
|----|----------|-----------|
| ADR-001 | **Server-side rendering (SSR) / static generation is mandatory** for all indexable content. | AI crawlers and answer engines often do not execute JS; client-only content is invisible to them. Health-info seekers need fast first paint. |
| ADR-002 | **Survey layer behind a `SurveyProvider` interface** with `qualtrics` and `native` implementations; selected by `SURVEY_PROVIDER` config. | Requirement 2.2; lets the site ship before questions/backend are final. |
| ADR-003 | **Self-hosted questions come from a versioned config file**, never hard-coded. | Explicit user requirement; enables non-engineers to iterate on questions. |
| ADR-004 | **Content in a git-versioned CMS/content layer** (MDX or headless CMS), not in code. | Marketing/legal content changes without deploys blocking; supports i18n. |
| ADR-005 | **Anonymous-by-default submission; minimise personal data.** | GDPR data-minimisation; health data is special-category (Art. 9). |
| ADR-006 | **EU data residency** for any self-hosted PII/health data. | Reporters and reference org are EU/NL; GDPR + institutional policy. |
| ADR-007 | **No third-party trackers on the critical path; privacy-first analytics.** | Trust, GDPR/ePrivacy, and avoids consent banners blocking crawlers. |
| ADR-008 | **All site identity (name, domain, logo, NAP, socials) lives in one `site.config` file**; every SEO artifact derives from it. | Lets brand name and domain be decided late and changed with a one-file edit; guarantees NAP consistency (an AEO requirement). |

---

## 4. System architecture

```
                     ┌──────────────────────────────────────────┐
                     │  CDN / Edge (TLS, WAF, caching, headers)   │
                     └──────────────────────────────────────────┘
                                        │
                      ┌─────────────────┴─────────────────┐
                      │      Web app (SSR/SSG frontend)     │
                      │  - Marketing & info pages (CMS)     │
                      │  - /report submission page          │
                      │  - SurveyProvider abstraction       │
                      │  - SEO/AEO artifacts (schema,        │
                      │    sitemap, robots, llms.txt)        │
                      └───────┬───────────────────┬─────────┘
                              │                   │
              Mode A (config) │                   │ Mode B (config)
                              ▼                   ▼
                  ┌────────────────────┐   ┌─────────────────────────┐
                  │ Qualtrics (iframe/ │   │ Own API (submission svc) │
                  │ postMessage)       │   │  - validation            │
                  │ data lives in QX   │   │  - rate limit / anti-spam│
                  └────────────────────┘   │  - encrypted store (EU)  │
                                           │  - audit log             │
                                           └─────────────────────────┘
```

The frontend is identical in both modes. Only the **submission page's rendered component** and the **data destination** differ, chosen at build/run time by config.

---

## 5. Technology stack (recommended, swappable)

The spec is stack-agnostic in principle, but to keep an implementing agent unblocked, this is the **recommended default**. An agent may substitute equivalents but must record the substitution as an ADR.

- **Framework:** Next.js (App Router) with SSR/SSG + React Server Components — mature SSR, first-class SEO/metadata APIs, i18n, image optimisation. _(Equivalent: Nuxt, Astro, SvelteKit — all must keep SSR.)_
- **Language:** TypeScript (strict).
- **Styling/UI:** Tailwind CSS + a headless component library (e.g. Radix/shadcn). Design tokens for theming.
- **Content layer:** MDX or a headless CMS (e.g. Sanity/Strapi/Payload) for marketing + legal copy and FAQ. Content is git-versioned or CMS-versioned.
- **Survey config:** YAML or JSON file(s) in `config/survey/*.yaml` (schema in Section 9), validated with Zod/JSON-Schema at build and runtime.
- **Backend (Mode B):** a small API service (Next.js Route Handlers / Node + Fastify, or serverless functions) with a validated `POST /api/submissions` endpoint.
- **Datastore (Mode B):** PostgreSQL (EU region), encrypted at rest; column-level encryption for any free-text/PII fields.
- **Hosting:** EU-region hosting/CDN with WAF (e.g. Vercel EU / Cloudflare / a compliant institutional host). Data residency = EU.
- **Analytics:** privacy-first, cookieless (e.g. Plausible/Umami/Matomo self-hosted, EU). No Google Analytics unless consented and DPIA-approved.
- **CI/CD:** GitHub Actions (build, typecheck, lint, unit/e2e tests, Lighthouse CI, schema validation, security scans).

### 5.1 Site identity config — the single source of truth (ADR-008)

The **product name and domain are deliberately deferred decisions** (D1, D9). To make them a one-file change rather than a codebase-wide search-and-replace, **all site identity lives in one file, `site.config.ts`** (create it in Phase 0). Every SEO/AEO artifact — page `<title>`s, meta descriptions, canonical URLs, Open Graph/Twitter tags, JSON-LD `@id`/`name`/`url`, the generated `sitemap.xml`, `robots.txt`, and `llms.txt` — **must derive from this file. Nothing may hard-code the name or URL.** A lint/test rule should fail the build if a literal domain or brand string appears outside `site.config`.

Illustrative shape:

```ts
// site.config.ts — the ONLY place brand name, domain, and NAP are defined.
export const siteConfig = {
  name: "AIjwerkingen",                 // D1 — resolved, see §22
  shortName: "AIjwerkingen",
  canonicalUrl: "https://example.org",  // D9 — final domain goes here (no trailing slash)
  defaultLocale: "en",
  locales: ["en", "nl"],
  logo: "/logo.svg",
  organization: {                        // NAP — must be IDENTICAL everywhere (AEO §11)
    legalName: "…",
    email: "…",
    phone: "…",
    address: { street: "…", locality: "…", region: "…", postalCode: "…", country: "NL" },
    sameAs: []                           // official social/profile URLs, if any
  }
} as const;
```

When you finalize the name and domain, you edit **this file only** (plus the matching `NEXT_PUBLIC_SITE_URL` secret per environment), and the whole site — including all SEO metadata — updates consistently. This is what makes the answer to *"is the name configurable later?"* a clean **yes**.

### 5.2 Domain policy — decide the domain before anything is indexed (SEO-critical)

The name can float at **zero SEO cost**; the domain cannot, because search/AI engines crawl and attribute authority to a *domain*. Rules:

- **Preferred path:** finalize and buy the domain **before go-live / before any indexing**. Keep all non-production environments `noindex` (Section 15) so nothing is ever crawled on a placeholder URL. With no old domain crawled, there is nothing to migrate — a clean start.
- **Acceptance gate:** production must not be made indexable until `site.config.canonicalUrl` is the final domain and Search Console is verified for it. This is criterion **AC-DOMAIN** (Section 2.3), enforced in Phase 5.
- **If you must launch on a temporary domain first** (not recommended), the later move requires a **domain-migration checklist**: (1) stand up the final domain, (2) `301` redirect every old URL to its new equivalent, (3) update `site.config.canonicalUrl` + `NEXT_PUBLIC_SITE_URL`, (4) regenerate sitemap/robots/llms, (5) submit **Change of Address** in Search Console and resubmit the sitemap, (6) monitor coverage and expect short-term ranking flux. Recoverable, but avoidable by deciding the domain first.

---

## 6. Information architecture (pages & routes)

All pages SSR/SSG, each with unique `<title>`, meta description, canonical URL, Open Graph/Twitter tags, and appropriate JSON-LD.

| Route | Page | Purpose | Key schema |
|-------|------|---------|-----------|
| `/` | **Home / landing** | Value proposition, primary CTA ("Report a side effect"), trust signals, secondary CTAs. | `Organization`, `WebSite` (+ `SearchAction` if search exists) |
| `/report` | **Submission page** | Hosts the survey (Mode A embed or Mode B native form). The core conversion. | `WebPage` (do not emit `MedicalWebPage` — see `PENDING-FIXES.md` P1-10) |
| `/about` | **About us** | Who we are, mission, governance, affiliations, credibility. | `Organization`, `AboutPage` |
| `/how-it-works` | **How reporting works** | Step-by-step of what happens to a report; reassurance. | `HowTo` |
| `/faq` | **FAQ** | 8–15 Q&A pairs (answer-first, 40–60 word answers). | `FAQPage` |
| `/privacy` | **Privacy statement** | GDPR-compliant privacy notice (see Section 13). | `WebPage` |
| `/terms` | **Terms / disclaimer** | Legal disclaimer (not a crisis/emergency service; emergencies → call local emergency number or a crisis line). | `WebPage` |
| `/contact` | **Contact** | Contact routes; not for emergencies or crises. | `ContactPage` |
| `/accessibility` | **Accessibility statement** | WCAG conformance statement (legally expected for public/health bodies). | `WebPage` |
| `/news` or `/updates` (optional) | **News/updates** | Freshness signal for SEO/AEO; announcements. | `Article`/`NewsArticle` |
| `/404`, `/500` | Error pages | Helpful, on-brand, link back to key pages. | — |

**Global UI:** header with clear nav + persistent primary CTA; footer with legal links, contact, accessibility, language switcher, and organisation identity (NAP — name/address/phone — kept **identical everywhere** for AEO consistency, Section 11).

**Calls to action:** one unmistakable primary CTA ("Report a side effect") repeated in header, hero, and footer; secondary CTAs ("How it works", "Is my data safe?"). CTAs must be real `<a href>`/buttons (crawlable, keyboard-focusable), not JS-only handlers.

---

## 7. Content requirements

- Copy is **authoritative, plain-language, and reassuring**; reading level appropriate for the general public, with a clear tone for anyone affected, for parents/carers, and for professionals.
- Every informational page opens with a **direct 40–60 word answer** to the question the page addresses (AEO "50-word rule", Section 11).
- Crisis/safety signposting is explicit and consistent, and appears **above the fold on `/report`, not only in the footer**: **this is not a crisis or emergency service; if you or someone else is in immediate danger, contact your local emergency number or a crisis line** (see `PENDING-FIXES.md` P0-5 for the open decision on which lines to name per locale).
- All copy externalised into the content layer (ADR-004), authored in the primary language with i18n-ready keys (Section 17).
- No claims of diagnosis, treatment, or moderation action against a named third party. Content reviewed by a domain/compliance owner before publish (record reviewer in change log).

---

## 8. Survey / data-collection layer (the core switchable module)

This is the heart of the spec. Implement a **`SurveyProvider` abstraction** so the `/report` page and the data path can switch between modes via configuration with no rewrite.

### 8.1 Selection
- Config key `SURVEY_PROVIDER` ∈ `{ "qualtrics", "native" }` (env var, default `qualtrics` for the initial informational launch, or as decided).
- The `/report` page reads the resolved provider and renders the matching component. A single integration test **boots the page in both modes** and asserts each renders and reaches a "submitted" state (Qualtrics via a stub, native via a test submit).

### 8.2 Provider interface (illustrative TypeScript)
```ts
interface SurveyProvider {
  id: 'qualtrics' | 'native';
  /** Server component/loader that returns everything /report needs to render. */
  getRenderModel(ctx: RequestContext): Promise<SurveyRenderModel>;
  /** Only meaningful for 'native'; 'qualtrics' returns a no-op handler. */
  handleSubmit?(payload: unknown, ctx: RequestContext): Promise<SubmitResult>;
  /** Optional: signal that a submission completed (analytics/thank-you). */
  onComplete?(evt: CompletionEvent): void;
}
```

### 8.3 Mode A — Qualtrics embedded

> **Step-by-step runbook:** `qualtrics-integration.md` walks the full flow — creating & configuring the survey in Qualtrics, getting the anonymous link, embedding it, origin-checked completion detection, CSP, testing, and the launch checklist. This section is the requirements summary; the runbook is the "how".

- The Qualtrics survey (all questions/answers authored in Qualtrics) is embedded on `/report` via a **responsive `<iframe>`** using the survey's anonymous link.
- **Submission/completion detection:** Qualtrics survey posts a message to the parent via `window.parent.postMessage(...)` on the final screen; the parent app listens with `window.addEventListener('message', ...)` and then shows a thank-you state / fires an analytics event. Validate `event.origin` against the Qualtrics domain before acting.
- **Correlation (optional):** pass a first-party opaque ID into the iframe via URL param and capture it as Qualtrics *Embedded Data*; store the mapping server-side only if there is a lawful basis and it is documented in the privacy notice. Prefer **not** to correlate unless required.
- **Security constraints for embedding (Section 12):**
  - The parent page's CSP `frame-src` / `child-src` must allow the specific Qualtrics origin (e.g. `*.qualtrics.com`) and **nothing broader**.
  - Never pass PII/health data in URL query strings (Privacy rule).
  - The iframe must `allowfullscreen` off unless needed; set `referrerpolicy="no-referrer"`; give it an accessible `title`.
  - Handle the "iframe navigates same-tab and loses data" pitfall: constrain navigation, test on mobile.
- **Data ownership note:** in Mode A the *response data lives in Qualtrics*. Confirm Qualtrics data-processing terms, storage region, and DPA cover GDPR health data before go-live (Section 13). This is a **blocking compliance check**.
- **Accessibility:** an embedded iframe cannot be assumed AA-conformant; provide a **fallback direct link** to open the survey in a new tab and document the accessibility statement caveat.

### 8.4 Mode B — Self-hosted (own frontend + own backend)
- **Questions come from a config file** (`config/survey/*.yaml`, schema in Section 9) — **no hard-coded questions.** The frontend renders the form dynamically from the config; the backend validates against the *same* config/schema.
- **Rendering:** progressive, accessible native form controls; supports the field types in Section 9; client + server validation; save-and-resume optional (future).
- **Submission:** `POST /api/submissions` → validate (schema + anti-abuse) → persist (encrypted, EU) → return a submission reference. No PII in logs.
- **Anti-abuse:** rate limiting, honeypot + optional privacy-friendly bot mitigation (e.g. hCaptcha/Turnstile — do **not** let the assistant/agent auto-solve CAPTCHAs; they exist for humans), server-side spam heuristics.
- **Storage schema (minimum):** `submission_id (uuid)`, `survey_version`, `created_at`, `locale`, `answers (jsonb, encrypted where free-text/PII)`, `source_meta (coarse, non-identifying)`. Avoid storing IP long-term; if needed for abuse, store truncated/hashed with short retention and document it.
- **Audit & retention:** append-only audit log of writes; documented retention & deletion policy (Section 13).

### 8.5 Switching between modes — acceptance
- Changing `SURVEY_PROVIDER` and redeploying is the **only** action required to switch.
- No question text, field definitions, or backend endpoints are hard-coded into components.
- Both modes share the same page chrome, SEO metadata, thank-you flow, and analytics events.

---

## 9. Survey configuration model (self-hosted questions)

A **versioned, validated config file** defines questions for Mode B. See `survey.example.yaml` for a working example and `survey.schema.json` for the machine-validatable schema. Key properties:

- **Top-level:** `version` (semver, bump on every change — used as `survey_version`), `locale_default`, `metadata` (title, description, estimated time), `consent` block, `sections[]`.
- **Section:** `id`, `title`, `description?`, `questions[]`.
- **Question:** `id` (stable, snake_case), `type`, `label`, `help?`, `required`, `validation?`, `options?` (for choice types), `conditional?` (show/hide logic referencing other answers), `pii` flag (marks fields as personal data → drives encryption/retention), `i18n` keys.
- **Supported `type` values (initial):** `short_text`, `long_text`, `single_choice`, `multi_choice`, `dropdown`, `number`, `date`, `boolean`, `scale` (Likert), `email` (only if lawful basis), `section_break`, `info` (static text).
- **Validation:** the same schema validates config at build time (CI fails on invalid config) and validates submissions at runtime.
- **No secrets in config;** Qualtrics URLs / API keys / DB creds come from environment/secret store, never the survey config file and never committed.

> The example config is intentionally generic (a plausible adverse-event report) because final questions are **not yet fixed**. Editing questions must not require code changes.

---

## 10. SEO requirements

**SSR/SSG is the foundation — non-negotiable (ADR-001).**

1. **Crawlability & indexing**
   - `robots.txt` allowing crawl of public pages, disallowing non-public/utility routes; reference the sitemap. Explicitly allow legitimate search **and** AI crawlers unless policy says otherwise (Section 11 covers AI-crawler policy).
   - XML **sitemap** auto-generated at build, includes all public routes with `lastmod`; submitted in Search Console.
   - Canonical URLs on every page; consistent trailing-slash and host (redirect `www`↔apex and `http`→`https` to one canonical origin).
   - Correct `<meta name="robots">` (index,follow public; noindex utility/error/thank-you as appropriate).
2. **On-page**
   - One `<h1>` per page; logical heading hierarchy; semantic HTML5 landmarks.
   - Unique, descriptive `<title>` (≤ ~60 chars) and meta description (≤ ~155 chars) per page; front-load the primary entity/keyword.
   - Descriptive, human-readable URLs.
   - Image `alt` text; explicit `width`/`height` (CLS); modern formats (AVIF/WebP) via the framework image pipeline.
   - Internal linking between related pages (hub/spoke: Home → How it works → FAQ → Report).
3. **Structured data (JSON-LD)** — see Section 11 (shared with AEO). At minimum sitewide `Organization` + `WebSite`, plus per-page types from Section 6.
4. **Performance = ranking + AEO** (Section 16). Fast TTFB, good Core Web Vitals.
5. **International SEO** (if multilingual): `hreflang` tags, localized URLs, per-locale sitemaps (Section 17).
6. **Search Console & Bing Webmaster** verified; monitor coverage, Core Web Vitals, and enhancements (Section 15).

## 11. AEO / GEO requirements (answer-engine & generative-engine optimisation)

Goal: the site is **findable, extractable, and citable** by AI answer engines (ChatGPT, Perplexity, Gemini, Claude, Google AI Overviews). Current best practice (mid-2026) prioritises, in order: **strong SEO → structured data → answer-first content → machine-readable discovery files.** SEO is a prerequisite (strong correlation between traditional top-10 ranking and AI-Overview citation), so Section 10 comes first.

1. **Structured data (highest leverage).** Ship valid JSON-LD, ideally as a single `@graph`, covering `Organization`, `WebSite`, and per-page `WebPage`/`FAQPage`/`HowTo`/`Article`. Validate every page with Google's Rich Results Test in CI. Add `speakable` where a concise spoken answer is appropriate.
2. **Answer-first content.** Open each page/major section with a **clean 40–60 word direct answer** to the question that section addresses. Use question-shaped `H2`/`H3`s that mirror how people actually ask ("What happens after I report a side effect?"). Pair every FAQ item with `FAQPage` schema.
3. **Entity clarity & consistency.** Front-load the primary entity (the organisation and "adverse event / side-effect reporting") in title, H1, and first paragraph. Keep **NAP and core facts identical across the site and any external profiles** — inconsistency makes engines drop the fact. Consider a fact-dense **Brand/About hub** page as the canonical source of truth.
4. **Machine-readable discovery files** (low cost, ship them; treat as finishing touches, not the main effort):
   - `/.well-known/` and root **`llms.txt`** — concise markdown map of the most important pages with short descriptions.
   - Optional `llms-full.txt` for deeper docs; optional `brand-facts.json` (`/.well-known/`) with machine-readable identity to reduce AI hallucination about the org.
5. **Keep important content in raw, server-rendered HTML** (not behind JS, tabs, accordions, modals, or logins) — AI crawlers frequently skip client-rendered or hidden content and use tight timeouts, so fast SSR content is essential.
6. **AI-crawler policy (explicit decision, record as ADR).** Decide and document whether GPTBot, ClaudeBot, PerplexityBot, Google-Extended, etc. are **allowed** in `robots.txt`. For a public-health information site, allowing them is usually desirable (you *want* to be the cited authority); if the org declines AI training use, reflect that precisely. Do not accidentally block them at the CDN/WAF layer.
7. **Freshness.** Maintain `dateModified` in schema; a lightweight news/updates section signals freshness that AEO rewards.
8. **Measurement.** Track AI-referral traffic in the privacy-first analytics (referrers from chat.openai.com, perplexity.ai, etc.) and, optionally, periodic manual "ask the top engines about us" audits, logging misses/wrong facts to fix.

> **Guardrail:** because free-text reports may contain special-category (health) data and may name real people or companies, **accuracy and non-misleading phrasing outrank any citation tactic.** Do not add persuasive "quotability" content that could be read as clinical/diagnostic advice or as an accusation against a named third party. Every answer block must remain factually careful and carry the crisis-signposting framing where relevant.

## 12. Security requirements

Public-facing site handling (potentially) health data. Baseline:

1. **Transport & headers:** HTTPS only, HSTS (preload once stable). Security headers: strict **Content-Security-Policy** (default-deny; allow only required origins — including the specific Qualtrics origin in `frame-src` for Mode A), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` (or stricter), `X-Frame-Options`/`frame-ancestors` to prevent *our* site being framed, `Permissions-Policy` locking down unused features. Target A/A+ on an external header scanner.
2. **Input handling:** validate and sanitise all inputs server-side (Mode B). Parameterised queries only (no string-built SQL). Output encoding to prevent XSS. Reject oversized payloads.
3. **Anti-abuse:** rate limiting, bot mitigation, honeypots (Section 8.4). CAPTCHAs are for humans — the platform must not, and agents must not, auto-solve them.
4. **Secrets:** in a secret manager / env, never in the repo or in survey config. Rotate. Separate secrets per environment.
5. **Dependencies & supply chain:** lockfiles, automated dependency scanning (e.g. Dependabot), SCA in CI; pin and review third-party scripts (ideally none on the critical path). Subresource Integrity for any external scripts.
6. **Iframe/embed hardening (Mode A):** validate `postMessage` `event.origin`; do not `eval` message contents; sandbox the iframe as tightly as functionality allows.
7. **Logging & monitoring:** structured logs **without PII/health data**; error monitoring; alerting. Audit log for data writes (Mode B).
8. **Testing:** SAST + dependency scan in CI; a DAST pass and a pre-launch security review; no high/critical findings at go-live. Consider a responsible-disclosure/security.txt (`/.well-known/security.txt`).
9. **Access control (infra):** least-privilege on hosting, DB, and CMS; MFA on all admin accounts; principle-of-least-privilege service credentials.

> **Prohibited actions during implementation** (see repo `SECURITY.md`): the implementing agent must never enter real credentials/payment/government-ID data into forms, modify access controls, hard-delete production data, or bypass CAPTCHAs. Such steps are handed to a human operator.

## 13. Privacy & regulatory compliance

> **Restated 2026-07-16 for the scope change (product is AI/social-media harm reporting, not pharmacovigilance).** The previous version of this section assumed the Art. 9 burden was specific to medicines/vaccines and would lighten under a pivot. **That assumption was wrong and has been removed.** The burden does not drop — it changes shape. Everything below is a **draft for the DPO/legal owner to commission and finalize, not a legal conclusion** (`PENDING-FIXES.md` P1-17).

Free-text reports of perceived psychological or behavioural harm (anxiety, distress, self-harm ideation, disordered eating, compulsive use) are **health data — special-category personal data under GDPR Art. 9, exactly as before.** This section is **blocking for any launch that collects real submissions** (Mode B, or Mode A where we control correlation).

1. **Lawful basis & DPIA:** a **Data Protection Impact Assessment** is required before collecting real data, covering Art. 9 as above. New relative to the prior draft: the DPIA must also separately address **(a) minors** — under GDPR Art. 8, processing a child's personal data on consent needs parental authorisation (NL digital age of consent: 16); this platform is expected to attract under-18 reporters given the domain, and a minors policy (minimum age, age-assurance approach, parental-consent flow) does not yet exist (open decision **D-minors**) — and **(b) named third parties** — reports will likely name real companies/products and possibly identifiable individuals, which raises Art. 14 (information to a non-reporting data subject) and moderation/retention questions with no policy yet (open decision **D-third-party**). _(Blocking task in Phase 4.)_
2. **Data minimisation & anonymity-by-default (ADR-005):** collect only what's necessary; default to anonymous reporting; mark PII fields explicitly in survey config (`pii: true`) — treat this as more load-bearing than before, since free text is more likely to contain special-category and third-party data here than in the prior domain.
3. **Consent:** clear, unbundled, specific consent for any personal/health data and for any non-essential cookies/analytics; consent must be as easy to withdraw as to give; must account for the minors question in (1). Privacy-first analytics chosen to minimise consent burden (ADR-007).
4. **Transparency:** a plain-language **privacy notice** at `/privacy` covering purposes, lawful basis, retention, recipients/processors (incl. **Qualtrics** in Mode A — confirm its DPA, sub-processors, and **storage region** cover EU special-category data), international transfer safeguards, and data-subject rights (access, rectification, erasure, objection).
5. **Data residency (ADR-006):** self-hosted PII/health data stored in the EU. For Mode A, confirm Qualtrics storage region and transfer mechanism; if it cannot meet residency/DPA requirements, that is a **go/no-go** input for choosing Mode B. Unchanged by the pivot — still blocking.
6. **Security of processing:** encryption at rest (column-level for free-text/PII), in transit; access controls; audit; retention & deletion schedule with automated purge. No PII in URLs, logs, or analytics.
7. **ePrivacy/cookies:** cookieless/first-party-only by default; a compliant cookie/consent mechanism only if any non-essential storage is introduced. The implementing agent should choose the **most privacy-preserving default** on any consent choice.
8. **Records & contacts:** publish DPO/contact route; maintain records of processing (RoPA); breach-response plan.
9. **Crisis disclosures (new):** a free-text harm description in this domain will receive acute-distress disclosures. Crisis signposting (a named, locale-specific route to real help) must appear on `/report` above the form and inside the survey itself, not only in a footer (Section 7). A moderation/triage route for reports indicating imminent risk is required before real submissions are collected; in Mode A this is a Qualtrics-side responsibility and interacts with (5).
10. **Regulator/regime (open question, not a conclusion):** the prior draft's implicit frame was pharmacovigilance regulation, which does not apply here. Adjacent EU regimes that may be relevant to a service in this domain include the **Digital Services Act** and the **AI Act** — this needs a legal opinion, not an engineering guess, before it's treated as settled.

> Legal/compliance sign-off (DPO/legal owner) is a named acceptance criterion in Phase 4. This spec does not substitute for legal advice. Add the minors policy (D-minors) and the named-third-party policy (D-third-party) as new rows in Section 22 and as blocking items in `CHANGELOG.md`'s "Blocking items to closure" list.

## 14. Accessibility

- **Target WCAG 2.2 AA** on all public pages (public-sector/health context makes this an expectation, often a legal one in the EU).
- Semantic HTML, keyboard operability, visible focus, sufficient contrast, form labels/`aria-describedby` for help/errors, error identification and suggestions, no keyboard traps, `prefers-reduced-motion` respected.
- The **native survey (Mode B) must be fully AA**. For **Mode A (Qualtrics iframe)**, provide a direct-link fallback and document the caveat in the accessibility statement, since the embedded content's conformance is outside our control.
- Publish an **Accessibility Statement** (`/accessibility`).
- CI: automated a11y checks (axe) on every page + a manual audit before launch.

## 15. Analytics, Search Console & indexing

1. **Google Search Console:** verify the property (DNS TXT or HTML-file/tag method — a **human operator performs verification**; the agent prepares the verification file/record and instructions but does not log into third-party accounts on the user's behalf). Submit the sitemap. Monitor Coverage/Indexing, Core Web Vitals, and Enhancements (Rich Results). Optionally verify **Bing Webmaster Tools**.
2. **Indexing:** ensure public pages are indexable (no accidental `noindex`/`robots` blocks, no CDN blocks). Use the URL Inspection tool to request indexing of key pages post-launch. Keep the sitemap `lastmod` accurate.
3. **Analytics:** privacy-first, cookieless (ADR-007). Track: landing→report funnel, CTA clicks, survey starts/completions (both modes), AI-referral sources (Section 11.8). No PII in analytics; document what's collected in the privacy notice.
4. **Conversion event:** define "submission completed" as the primary goal in both modes (Mode A via validated `postMessage`; Mode B via server confirmation).

## 16. Performance & Core Web Vitals

- Targets (p75, mobile): **LCP < 2.5s, INP < 200ms, CLS < 0.1**; TTFB minimised via edge/SSG.
- Ship minimal JS on content pages (RSC/SSG); defer non-critical scripts; no render-blocking third-party scripts on the critical path.
- Optimised images (AVIF/WebP, correct sizing, explicit dimensions), font loading strategy (`font-display: swap`, preload critical fonts), preconnect only to required origins.
- **Lighthouse CI** budget gates in the pipeline (fail build on regression below thresholds in Section 2.3).
- Fast pages are also an **AEO signal** (AI crawlers use tight timeouts).

## 17. Internationalization (i18n)

- Reference org context is NL/EN; assume at least **English + Dutch**, extensible.
- Locale-prefixed routes (e.g. `/en/...`, `/nl/...`) or subdomain strategy; `hreflang` + per-locale canonical + per-locale sitemap.
- All UI/content/survey strings via i18n keys (no hard-coded copy); survey config carries `i18n` keys per question.
- Language switcher in header/footer; `lang` attribute set correctly per page.

## 18. Testing & QA

| Layer | What | Gate |
|-------|------|------|
| Unit | Components, config validation, provider selection | CI required |
| Integration | **Both survey modes boot & reach "submitted"**; API validation (Mode B) | CI required |
| E2E | Landing→report funnel, nav, forms, error states (Playwright) | CI required |
| Accessibility | axe on all pages + manual audit | CI + pre-launch |
| SEO/Schema | Sitemap present; JSON-LD validates (Rich Results); meta/canonical present | CI |
| Performance | Lighthouse CI budgets (Section 2.3) | CI |
| Security | SAST, dependency/SCA scan; DAST + review pre-launch | CI + pre-launch |
| Content/Compliance | Copy reviewed; privacy notice + DPIA sign-off | Manual gate |

## 19. Infrastructure, deployment & CI/CD

- **Environments:** `preview` (per-PR), `staging`, `production`. Staging uses non-real data.
- **CI pipeline (per PR):** install → typecheck → lint → unit/integration/e2e → config-schema validation → a11y → Lighthouse CI → security scans → build. All green required to merge.
- **CD:** deploy previews on PR; promote to staging on merge to main; production deploy is a **gated, human-approved** step.
- **Config & secrets:** environment-scoped; secret manager; `SURVEY_PROVIDER` and Qualtrics URL/API creds injected per environment (never committed).
- **Observability:** uptime monitoring, error tracking, log aggregation (PII-free), alerting.
- **Backups (Mode B):** encrypted, EU-region, tested restore; documented retention aligned with the privacy policy.

---

## 20. Phased implementation plan

Each phase ends with **explicit acceptance criteria** and a **change-log entry** (Section 21). Do not advance until criteria are met and recorded. Phases are ordered so the site can go live as an informative, discoverable, secure website **before** questions/backend are finalised (per the project goal).

### Phase 0 — Foundations & scaffolding
- Repo, TypeScript/Next.js (SSR) scaffold, Tailwind + component lib, linting, CI skeleton, environments.
- ADRs 001–008 written. `CHANGELOG.md`, `SECURITY.md`, `.env.example` created.
- **Create `site.config.ts`** (Section 5.1) with placeholder name/domain; wire it as the source for metadata, sitemap, robots, llms. Add the lint/test rule that forbids brand/domain literals outside `site.config`.
- **Acceptance:** app builds & deploys a "hello" SSR page to preview; CI runs typecheck/lint; `site.config.ts` exists and feeds metadata; the "no hard-coded name/domain" check is active; ADRs committed; change log initialised.

### Phase 1 — Informational site (marketing/content) + SEO baseline
- Implement all pages in Section 6 **except** the live survey (a placeholder on `/report`).
- Content layer wired; copy authored (answer-first, Section 7); i18n scaffolding (Section 17).
- **Visual identity & real copy (D11, §22) resolved before this phase is called done** — Lighthouse/a11y/SEO scores alone do not certify a "modern-looking" site; the spec has no design-quality gate, so this must be checked deliberately.
- SEO baseline: titles/meta/canonical/OG, sitemap, robots.txt, sitewide `Organization`+`WebSite` JSON-LD, per-page schema, image optimisation.
- Security headers/CSP baseline; privacy-first analytics installed.
- **All non-production environments set `noindex`** (staging/preview must never be crawlable) so nothing is indexed on a placeholder domain before the real one is chosen (Section 5.2).
- **Acceptance:** all pages SSR & (production-)indexable while non-prod is `noindex`; Lighthouse ≥ 95 (Perf/A11y/BP/SEO) on `/` and `/report` placeholder; sitemap & robots valid and derived from `site.config`; JSON-LD passes Rich Results; header scanner A/A+; WCAG AA automated pass.

### Phase 2 — Survey abstraction + Mode A (Qualtrics embed)
- Implement `SurveyProvider` interface and `qualtrics` provider. **Follow `qualtrics-integration.md`** for the concrete steps.
- Responsive iframe embed on `/report`; `postMessage` completion handling with origin validation; thank-you state; analytics conversion event; accessibility fallback link.
- CSP `frame-src` scoped to Qualtrics; no PII in URLs.
- **Acceptance:** `/report` renders the Qualtrics survey in Mode A; completion event fires and is tracked; CSP correct; a11y fallback present; integration test for Mode A green. **(Real-data go-live still gated on Phase 4 compliance.)**

### Phase 3 — Mode B (self-hosted questions + backend), config-driven
- Survey config schema (`survey.schema.json`) + example config; build-time + runtime validation.
- `native` provider renders form from config (all field types in Section 9); client+server validation.
- `POST /api/submissions`: validation, anti-abuse, encrypted EU storage, audit log, submission reference, no PII in logs.
- Switching test: flipping `SURVEY_PROVIDER` boots either mode; both reach "submitted".
- **Acceptance:** questions driven entirely by config (zero hard-coded questions — verified by review); both modes pass integration tests; switching = one config value + redeploy; storage encrypted & EU; anti-abuse in place.

### Phase 4 — Compliance, privacy & security hardening (launch gate)
- DPIA completed; lawful basis & Art. 9 condition documented; privacy notice, terms, accessibility statement finalised & signed off.
- Qualtrics DPA / storage-region / sub-processor review (if Mode A used for real data) — go/no-go recorded.
- Full security review: DAST, dependency/SCA, header/CSP audit; retention/deletion automation; `security.txt`.
- Manual WCAG AA audit passed.
- **Acceptance:** DPO/legal sign-off recorded in change log; 0 high/critical security findings; retention automation verified; a11y audit passed. **This phase is the gate for collecting real submissions.**

### Phase 5 — AEO/GEO + Search Console + launch
- **Finalize brand name & domain (D1, D9):** set `site.config.ts` `name` + `canonicalUrl` to the real values and matching `NEXT_PUBLIC_SITE_URL`; regenerate sitemap/robots/llms. (This is the "resume here" step from Section 0.1.)
- `llms.txt` (+ optional `llms-full.txt`, `brand-facts.json`); AI-crawler policy ADR; answer-first content pass; freshness (`dateModified`, updates section).
- Search Console/Bing verification for the **final** domain (human-operated), sitemap submission, indexing requests; AI-referral tracking configured.
- **Flip production to indexable only now** (AC-DOMAIN). Production deploy (human-approved).
- **Acceptance:** all success criteria in Section 2.3 met **including AC-DOMAIN**; Search Console verified for the final domain & sitemap accepted with 0 critical errors; discovery files live & valid; production live and indexable.

### Phase 6 (future / out of initial scope)
- Public searchable info, reporter accounts/save-resume, MedDRA coding, regulatory transmission, dashboards. Not specified here.

---

## 21. Change-log / status persistence protocol

`CHANGELOG.md` is the **authoritative record of current state** so that work can persist exactly across phases and across different agents/sessions. It is not a git substitute — it is a human/agent-readable ledger of *decisions, phase status, and what's done vs pending.*

**Rules:**
1. **Read `CHANGELOG.md` first** when resuming. It tells you the exact current state, the active phase, and what's pending.
2. **Append an entry** whenever you: complete a phase or a meaningful task, make a decision, hit a blocker, or hand off. Never rewrite history — append.
3. Each entry uses the fixed format in `CHANGELOG.md` (date, phase, author/agent, status, what changed, decisions, blockers/risks, next actions).
4. **Phase status vocabulary:** `not_started → in_progress → blocked → in_review → done`. The change log always reflects the true status of every phase.
5. Acceptance-criteria checkboxes for the active phase are tracked in the change log entry (or a linked `STATUS.md`), so a resuming agent sees exactly which criteria remain.
6. **Decisions of record** (ADRs) get a one-line pointer in the change log and a full file under `docs/adr/`.
7. Blocking compliance items (DPIA, Qualtrics DPA, legal sign-off) are tracked to closure in the change log; launch phases cannot be marked `done` while they're open.

See `CHANGELOG.md` for the template and the initial entry.

---

## 22. Open decisions & risk register

| # | Item | Type | Owner | Notes |
|---|------|------|-------|-------|
| D1 | Final **public brand name** | Decision | product | **Resolved: AIjwerkingen** (2026-07-16 — see `PENDING-FIXES.md` P1-16). Configurable at zero SEO cost via `site.config.ts` (§5.1), which already reflects this name. |
| D2 | **Default survey mode at launch** (A vs B) | Decision | product/legal | May launch informational with a placeholder or Mode A; Mode B once questions finalised. |
| D3 | **Qualtrics DPA / EU storage** sufficiency for health data | Risk (blocking) | DPO/legal | Go/no-go input for Mode A with real data. |
| D4 | **DPIA outcome & lawful basis** | Risk (blocking) | DPO/legal | Gate for real-data collection (Phase 4). |
| D5 | **AI-crawler policy** (allow/deny GPTBot/ClaudeBot/etc.) | Decision (ADR) | product/legal | Section 11.6. |
| D6 | **CMS choice** (MDX vs headless) | Decision (ADR) | eng | Section 5. |
| D7 | **Languages at launch** (EN, NL, more?) | Decision | product | Section 17. |
| D8 | **Final survey questions** | Content | domain owner | Externalised to config; not blocking the informational site. |
| D9 | **Final domain** (+ hosting/CDN & data-residency vendor) | Decision (ADR) | product / eng/infra | Set in `site.config.canonicalUrl` (§5.1). **Must be final before anything is indexed** (§5.2, AC-DOMAIN). Hosting must satisfy EU residency + WAF. |
| D10 | **Bot-mitigation vendor** (Turnstile/hCaptcha) | Decision | eng | Privacy-friendly; human-only CAPTCHA. |
| D11 | **Visual identity & content authoring** (logo, color palette, typography, imagery/illustration style, actual page copy) | Decision + content (blocking for a "modern-looking" Phase 1) | product/design | This spec fixes the *toolchain* (Tailwind + headless components, §5) and *copy voice/structure* (answer-first, disclaimers, §7) but not the visual identity or the actual written copy. Without this, Phase 1 ships architecturally correct but visually unstyled pages. Resolve before or during Phase 1 — assign a copy author and a design pass. No reference-site mood-boarding — see the terminology note in §0 on why no existing platform is cited as a model. |
| D-minors | **Minors policy** (minimum age, age-assurance, parental consent) | Decision (blocking, DPIA input) | DPO/legal | New with the scope change (§13.1, `PENDING-FIXES.md` P0-5). This domain is expected to attract under-18 reporters; no policy exists yet. |
| D-third-party | **Named-third-party policy** (moderation/retention for reports naming companies or individuals) | Decision (blocking, DPIA input) | DPO/legal | New with the scope change (§13.1/§13.10, `PENDING-FIXES.md` P1-17). |

---

## 23. Appendices

- **Appendix A — Example survey config:** `survey.example.yaml`
- **Appendix B — Survey config JSON-Schema:** `survey.schema.json`
- **Appendix C — Example `robots.txt` + `llms.txt`:** `robots.example.txt`, `llms.example.txt`
- **Appendix D — Example JSON-LD (`Organization`, `FAQPage`, `HowTo`):** `schema-examples.jsonld`
- **Appendix E — Environment variables:** `.env.example` (repo root, created in Phase 0)
- **Appendix F — Site identity config:** `site.config.ts` (single source of truth for name/domain/NAP — §5.1; created in Phase 0)
- **Appendix G — Qualtrics integration runbook:** `qualtrics-integration.md` (step-by-step Mode A: create survey → embed → detect completion → launch)

_These appendices are provided as starting artifacts alongside this spec so an implementing agent has concrete, valid examples to adapt._
