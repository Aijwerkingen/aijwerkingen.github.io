# AI Impact Registry

A public-facing **survey & data-collection website** for reporting perceived adverse effects of conversational AI tools and digital/social media - a modern, secure, discoverable site whose core action is "report a side effect". See `TECHNICAL_SPEC.md` §1 for the full scope and §22 (D1) for the naming decision.

> **AI Impact Registry** is the public brand name. The production domain is `aiimpactregistry.org`
> (set in `src/site.config.ts`). `AISafetyWatch` remains available as a preview variant in the
> brand drawer. The repo folder name (`aijwerkingen.github.io`) is kept as-is.

## Read these in order
1. **`TECHNICAL_SPEC.md`** - the full technical specification. Start here.
2. **`CHANGELOG.md`** - the authoritative phase-status ledger. **Read this before doing any work** to learn the current state; append to it as you go (protocol in spec §21).
3. **`REVIEW.md`** - a reusable, phase-agnostic audit protocol for a fresh agent to verify completed work against the spec and the changelog's own claims. Use it any time you want an independent sanity check on the current state, not just after Phase 0.

## Starter / reference artifacts (repo root)
- `survey.example.yaml` - example config-driven survey (Mode B). **Questions are never hard-coded.**
- `survey.schema.json` - JSON-Schema that validates the survey config at build & runtime.
- `robots.example.txt` - starting `robots.txt` (references sitemap; AI-crawler policy is a decision - spec §11.6).
- `llms.example.txt` - starting `llms.txt` for AEO/GEO discovery.
- `schema-examples.jsonld` - example JSON-LD (`Organization`, `FAQPage`, `HowTo`).
- `qualtrics-integration.md` - step-by-step Mode A (Qualtrics embed) runbook, spec §8.3 Appendix G.
- `content/blog/README.md` - how the blog works: writing and publishing a post, frontmatter, cover images, tags and the RSS feed.

## The one idea to internalise
The survey layer sits behind a **`SurveyProvider` abstraction** with two implementations:
- **Mode A - `qualtrics`:** questions live in Qualtrics; the app embeds the survey.
- **Mode B - `native`:** the app renders questions from a **config file** and posts to **our own backend**.

Switching between them is **one config value (`SURVEY_PROVIDER`) + a redeploy** - no rewrite. See spec §8.

## Brand assets & the temporary preview drawer

The icon set lives in **`public/brand/<brand>/<theme>/`** - a matrix of name
(`aiimpactregistry`, `aisafetywatch`) × colour-way (`warm`, `teal`). `public/` is copied verbatim
into the static export, so these need no bundler step; paths are built by `brandAsset()`
in `src/site.config.ts` rather than written by hand, which keeps brand literals in that
one file (ADR-008). The UI palette in `src/app/globals.css` is sampled from this artwork,
so the two cannot drift apart.

The site ships with a **temporary brand-preview drawer** (small handle on the right edge)
for trying alternative names and colour-ways without a rebuild. It defaults to
**AI Impact Registry + warm**, matching `defaultBrandKey` / `defaultBrandTheme` in
`site.config.ts`.

> **To remove it:** delete `src/admin/` and the single `<AdminDrawer />` line in
> `src/app/layout.tsx`. That is its only entry point. Everything then renders the
> `site.config.ts` default.

It previews **rendered brand only**. Page titles, JSON-LD, canonical URLs, the sitemap,
the OG image and the favicon are generated at build time and intentionally keep the
default name, so crawler-visible identity stays single-sourced.

## Name & domain (settled)
All brand identity lives in **one file, `src/site.config.ts`** (spec §5.1) - name, domain, logo, NAP. Every SEO artifact (titles, meta, canonical, JSON-LD, sitemap, `robots.txt`, `llms.txt`) derives from it, so changing either is a **one-file edit**, not a codebase hunt. Both are now settled: **AI Impact Registry** on **aiimpactregistry.org** (spec §5.2, criterion AC-DOMAIN).

## First step / resuming later
- **Starting fresh:** begin **Phase 0** (spec §20) - scaffold the SSR app + CI, create `site.config.ts`, write the ADR files, initialise environments, then update `CHANGELOG.md`.
- **Resuming:** open `CHANGELOG.md` and follow the **▶ RESUME HERE** block at the top (mirrored in spec §0.1). The name and domain are settled; the remaining launch work is the Phase 4 compliance gates.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). This app is built for **static export**
(`output: "export"` in `next.config.ts`) to deploy on GitHub Pages, which has no server
runtime - keep that constraint in mind before adding anything that needs a Node server
(that's Mode B's backend, spec §8.4, which needs different hosting - see ADR-009/010 in
`CHANGELOG.md`).

To check the production build locally:

```bash
npm run build
npx serve out
```
