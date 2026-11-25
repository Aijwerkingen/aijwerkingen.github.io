# Plan: blog editor phase 2 - visual-only editing, true preview, images, links and sources

**Audience:** a cold agent with no prior context. Read top to bottom, then implement
section 5 in order. Do not skip the acceptance checks in section 7.

**Builds on:** the shipped phase-1 editor (`docs/BLOG_EDITOR_PLAN.md`, merged in
PR #76). Read that doc's "Update - implemented" notes first. Its guardrails
(production exclusion, cookie gate, PR-only saves, frontmatter never YAML-dumped)
all still apply.

**GitHub / Cloudflare setup:** nothing new. The existing fine-grained token's
**Contents: Read and write** permission also covers the Git Data API (blobs, trees,
commits) used below, and no new env vars are needed.

---

## 1. Why this phase exists (owner feedback)

The people who will use Edit are **not technical**. They should never see Markdown,
YAML or a "Source" tab. What they need is:

1. Edit text **as it looks on the blog**.
2. **Add images easily**: click a button, pick a file, describe it. No syntax.
3. A **proper preview**, exactly as the post will look once published.
4. **Links and scientific references without friction.** The authors are scientists
   and mostly cite journal articles. They should be able to paste a DOI or a PubMed
   link and get a correctly formatted source entry in the house style.

## 2. Goal - exact behaviour

The editor overlay on `internal.<domain>` becomes:

```
[ Edit | Preview ]                                  [Close]
┌─ Post details ───────────────────────────────────────────┐
│ Title [..........]  Short summary [.............]        │
│ Tags [guides, wellbeing]  Cover image [thumb] [Change][×]│
│ Published 7 Aug 2026 · AI Impact Registry team · Live    │  (read-only)
└──────────────────────────────────────────────────────────┘
┌─ the post, laid out like the real page ──────────────────┐
│  Title (big)  · date · N min read                        │
│  [cover image]                                           │
│  Toolbar: B I H2 H3 • 1. ❝ Link [Add image] [Add source] │
│  body text, editable, with the blog's typography         │
│  tag chips                                               │
└──────────────────────────────────────────────────────────┘
Your name [....]  What changed [....]      [Send for review]
```

- **Edit:** the body is edited inside a replica of the post page (same column width,
  heading styles, cover position, tag chips). The title, date line and cover in that
  replica update live from "Post details".
- **Preview:** a read-only render made by **the same component and the same Markdown
  renderer the build uses** (section 4), so what they see is what will be published,
  pending new images included.
- **Gone:** the Source tab, the raw frontmatter textarea, and the "check the Source
  tab" banner.
- **Images:** an "Add image" toolbar button for inline images; select an image to
  change its description, replace it, or remove it; plus the cover image control in
  Post details.
- **Links:** select text → **Link** (or Ctrl/Cmd+K, or just paste a URL over the
  selection) → a small dialog with the web address, plus Open/Remove for an existing
  link. No `window.prompt`.
- **Add source:** paste a DOI, a doi.org link, a PubMed link or a PMID → the editor
  looks up the article and shows the formatted entry (editable) → **Add**. The entry
  is appended to the post's **Sources** list (created if missing), and, if text was
  selected, that text is linked to the article. For non-article sources (reports,
  PDFs, web pages), a "Enter details manually" form produces the same format.
- **Send for review** opens a PR into `staging`, as today (one commit, now including
  any images).

Production: no visual change at all (check 2 proves it byte-for-byte), apart from one
CSS rule so inline images fit the column (step 9).

---

## 3. Decisions (do not revisit)

| Topic | Decision |
|---|---|
| Source tab | **Removed**, with no "advanced" toggle. Maintainers who need raw edits use GitHub directly. |
| Frontmatter | Edited through **form fields** only: Title, Short summary (`description`), Tags, Cover image + its description (`image`, `imageAlt`). **Shown read-only:** date, author, published/draft status. **Not shown:** everything else. Read with js-yaml `load` (read only); write with line-level edits (section 5, step 3). Only fields the user actually changed are rewritten, so untouched lines keep their exact formatting. `updated:` is set automatically, as in phase 1. |
| Safety net replacing Source | **HTML-equivalence check on open:** render the original body and the editor's re-serialised body with the build renderer and compare. If they differ, the post opens **read-only** with: "This post uses formatting the editor can't keep intact. Ask the web team to make this change." Nobody can silently corrupt a post they can't inspect. |
| Minimal diffs | If the body's rendered HTML is unchanged, submit the **original body text**, not the re-serialised one. So a details-only edit never rewrites the whole body, and "no change" stays detectable. |
| Preview fidelity | One shared `renderMarkdown()` (`src/lib/markdown.ts`) used by **both** the build (`src/lib/blog.ts`) and the editor, plus one shared presentational `PostView` used by **both** the post page and the editor. The two can't drift. |
| Images: where | `public/blog/<slug>/<stem>-<hash8>.<ext>`, referenced as `/blog/<slug>/…`. This is the existing convention in the "Images" section of `content/blog/README.md`. The static export already writes a `blog/<slug>/` directory next to `blog/<slug>.html`, so there's no route collision. |
| Images: names | Content-hashed (first 8 hex of the SHA-256 of the final bytes). Never overwritten: "replace" means a new file and a new path, so there's no stale cache. |
| Images: processing | **In the browser, before upload.** Scale the longest side to ≤ 1600 px (never upscale) and re-encode to **WebP q=0.85**, falling back to **JPEG q=0.85** where WebP encoding isn't supported (Safari). Re-encoding also **strips EXIF/GPS metadata** (privacy-first site). |
| Images: accepted | PNG, JPEG, WebP; ≤ 15 MB in; ≤ 1.5 MB out (retry once at q=0.7, then refuse). **No SVG, no GIF.** |
| Images: description | Required (it becomes the alt text). A "Decorative image" checkbox sets `alt=""` on purpose. UI wording: "Describe the image", never "alt". |
| Images: preview before merge | Never `blob:` URLs: the CSP `img-src 'self' data:` blocks them. Pending images display from in-memory `data:` URLs; **the document only ever holds the final path** (section 4). |
| Commit shape | **One atomic commit** via the Git Data API, for every save. |
| Citation style | Keep the **existing house style** (inline links in the text + a `## Sources` bullet list at the end), not numbered footnotes: `marked` has no footnote support, and footnotes would trip the equivalence check. Entry format, taken from the existing posts: `Surname, Surname & Surname - *Title*, Journal Volume, first–last (Year) · [DOI](https://doi.org/…) · [PubMed](https://pubmed.ncbi.nlm.nih.gov/<pmid>/)`. Up to 5 authors listed in full, otherwise `First-surname et al.`. Page ranges use an en dash. |
| Metadata lookup | **Server-side**, in the existing `blog-edit` Function (the CSP's `connect-src 'self'` blocks browser calls, and that stays). DOI → `https://doi.org/<doi>` with `Accept: application/vnd.citationstyles.csl+json` (one call covers Crossref, DataCite/arXiv and others). PMID → NCBI `esummary` (JSON), then its DOI (if any) through the same CSL path. Only these two fixed hosts are ever fetched (no SSRF). |
| Link targets | Only `https://`, `http://`, `mailto:`, and site-relative `/…`. A bare `example.org/x` gets `https://` added. Anything else (`javascript:`, `data:`…) is refused. |
| Out of scope | Paste and drag-drop upload, numbered/footnote citations, a picker for linking other blog posts, automatic dead-link checking, deleting orphaned images, cropping, captions, creating or renaming posts, editing date/author/status. |

---

## 4. Key mechanisms (read before coding)

### 4.1 Shared renderer - `src/lib/markdown.ts` (new, no Node APIs)

```ts
import { Marked } from "marked";
import { gfmHeadingId } from "marked-gfm-heading-id";

export function renderMarkdown(md: string): string {
  // A fresh instance per call keeps heading-id de-duplication per document,
  // and never touches marked's global state.
  return new Marked(gfmHeadingId(), { gfm: true, breaks: false }).parse(md) as string;
}
```

Also move `readingMinutes()` from `src/lib/blog.ts` into `src/lib/reading-time.ts`
(pure). `blog.ts` then uses `renderMarkdown` and the moved `readingMinutes`, and drops
its global `marked.use` / `marked.setOptions`. **Check 2 proves the output is
byte-identical.** If it isn't (for example, heading ids repeat differently), adjust
`renderMarkdown` until it is. Don't change the build output.

### 4.2 Shared view - `src/app/blog/PostView.tsx` (new, presentational)

Move the `<article>…</article>` markup from `src/app/blog/[slug]/page.tsx` into
`PostView`. Requirements:

- No hooks, no `"use client"`, no Node APIs, so both the server page and the client
  editor can import it.
- Props: `{ title, date, readingMinutes, author?, image?, imageAlt?, tags?, bodyHtml?,
  bodySlot?, resolveSrc? }`.
- Renders `bodySlot` (the live editor) when given, otherwise `bodyHtml` via
  `dangerouslySetInnerHTML` inside `div.prose-doc`, exactly as today.
- `resolveSrc(src)` (default identity) is applied to the cover `<img src>`, so the
  editor can show pending covers.
- The page keeps the JSON-LD `<script>`, metadata and `notFound()`, and renders
  `<PostView … bodyHtml={post.html} />`.

### 4.3 Pending images

- A per-editor **pending store**: `Map<publicPath, { dataUrl, base64 }>`.
- Insert image nodes with **`src = publicPath`** (the final path) plus the alt.
- `Image.extend({...})` overrides `renderHTML` so the **editor view** shows
  `pending.get(src)?.dataUrl ?? src`:
  ```ts
  renderHTML({ HTMLAttributes }) {
    const src = pending.get(HTMLAttributes.src)?.dataUrl ?? HTMLAttributes.src;
    return ["img", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { src })];
  }
  ```
  `@tiptap/markdown` serialises from node attrs, so `getMarkdown()` still emits the
  path. **Verify this** (check 5). If it doesn't hold in 3.35.0, use a minimal node
  view. Never put data URLs into the document.
- Keep `allowBase64: false` (the default).
- **Preview:** after `renderMarkdown()`, replace each `src="<pendingPath>"` with its
  `dataUrl` (exact string replace on the attribute). The cover uses `resolveSrc`.
- On submit, send only the entries whose path still appears in the final file.

### 4.4 Equivalence check

```ts
const same = (a: string, b: string) =>
  squash(renderMarkdown(a)) === squash(renderMarkdown(b));
// squash: collapse whitespace between tags (/>\s+</g -> "><") and runs of
// whitespace to one space; trim.
```

- **On open:** load the body into Tiptap, then compare `same(originalBody,
  editor.getMarkdown())`. If false, show the read-only state from section 3 and log
  the first differing ~200 characters to the console for the web team.
- **On submit:** `bodyOut = same(originalBody, current) ? originalBody : current`.
- Phase 1 found `&` re-serialised as `&amp;`. That renders identically, so it passes
  this check and is avoided in the file by the minimal-diff rule unless the body was
  actually edited. Lost two-space list continuation indents also render
  identically. Record in the PR which existing posts (if any) end up read-only.

### 4.5 References

**Input parsing** (client for UX, server re-validates). Accept and normalise:

- `10.1038/d41586-023-00288-7`, `doi:10.…`, `https://doi.org/10.…`,
  `https://dx.doi.org/10.…` → DOI. Regex `^10\.\d{4,9}/\S+$` after stripping the
  prefix; trim trailing `.,;)`.
- `https://pubmed.ncbi.nlm.nih.gov/37857895/`, `PMID: 37857895`, `37857895` → PMID
  (`^\d{1,9}$`).
- Anything else (for example a publisher article URL) → "Paste the DOI or PubMed
  link (you'll usually find the DOI on the article page)", with a button to switch
  to manual entry.

**Normalised result** (returned by the server, `CiteData`):
`{ authors: string[] /* display surnames */, title, container, volume?, pages?, year?, doi?, pmid?, url? }`.

- **From CSL-JSON:** each author is `[non-dropping-particle, family].join(" ")`, or
  `literal`/`name` for organisations (keeps "van Dis", not "Dis"). `title` and
  `container-title` may be arrays: take `[0]`, then strip HTML/MathML tags and
  decode entities. `year` from `issued["date-parts"][0][0]`. Pages: hyphen → en dash.
- **From esummary:** `result[pmid]`. Authors' `name` is "Bockting CL", so keep the
  surname part (everything before the final initials token). `fulljournalname` or
  `source`, `volume`, `pages`, `pubdate` year, and `articleids` (`idtype === "doi"`).
  If there's a DOI, re-resolve via CSL for consistent data and keep `pmid`.

**Formatting** (`formatSource(c: CiteData)` in `src/admin/blog-editor/cite.ts`,
pure). It returns an array of inline pieces (text, italic text, links), not a
Markdown string, so the editor inserts real nodes and Tiptap handles escaping:

```
authors:  ≤5 → "A, B, C & D";  >5 → "A et al.";  none → omit
then:     " - " + italic(title) + ", " + container + (volume ? " " + volume : "")
          + (pages ? ", " + pages : "") + (year ? " (" + year + ")" : "")
links:    " · " + link("DOI", "https://doi.org/" + doi)   if doi
          " · " + link("PubMed", "https://pubmed.ncbi.nlm.nih.gov/" + pmid + "/")  if pmid
          " · " + link("Link", url)                       manual entries without DOI
```

Reproduce the existing entries as the test oracle (check 17). For example, DOI
`10.1038/d41586-023-00288-7` must give
`van Dis, Bollen, Zuidema, van Rooij & Bockting - *ChatGPT: five priorities for research*, Nature 614, 224–226 (2023) · [DOI](https://doi.org/10.1038/d41586-023-00288-7)`.
If Crossref's author data or title casing differs slightly, the user can fix it in
the editable preview. Report any differences in the PR rather than hard-coding
fixes.

**Insertion** (Tiptap transaction):

1. Find a heading (level 2) whose text is `Sources` or `References`
   (case-insensitive). If it exists, append a `listItem > paragraph(pieces)` to the
   first `bulletList` after it (create the list right after the heading if there
   isn't one). If not, append `heading(2, "Sources")` + `bulletList` at the end of
   the document.
2. If the user had a non-empty text selection when they opened the dialog (and
   ticked "Link the selected text to this source", default on), apply a link mark to
   that range: the DOI URL, else PubMed, else the manual URL. Store the selection
   range when the dialog opens.
3. Don't add an entry that's already there: same DOI or PMID anywhere in the
   Sources list → message "This source is already listed" + option to just link the
   selection.

---

## 5. Implementation

Branch `session/blog-editor-phase2` off the latest `origin/staging`. **Read
`AGENTS.md` first.** Keep all editor code under `src/admin/blog-editor/`. The
`next.config.ts` alias for `@/admin/blog-editor/EditPostButton` is what keeps it out of
production. `PostView`, `markdown.ts` and `reading-time.ts` are shared, so they ship to
production, which is intended and harmless.

### Step 1 - Shared renderer + view (no behaviour change)

Do section 4.1 and 4.2 first, alone, and run check 2 before going further. Commit
this step separately.

### Step 2 - Remove Source and the raw frontmatter

In `BlogEditor.tsx`, delete the Visual/Source tab bar, `sourceText`, `showSource`,
`showVisual` (as tab switching), the frontmatter textarea and the round-trip banner.
Remove helpers in `md.ts` that become unused. Keep `split`, `assemble`, `tidy`,
`todayUtc`, `withUpdated`.

### Step 3 - Post details form (`PostDetails.tsx`, new)

- **Read** with js-yaml `load(frontmatter)`, display only. js-yaml returns `date` as a
  `Date`: show it with `formatDate(yyyy-mm-dd)` from `src/app/blog/format.ts`.
  Status = "Draft" if `published === false || draft === true`, else "Live".
- **Editable fields:** Title (single line, required), Short summary (textarea, hint
  "1-2 sentences, shown in search results and link previews", soft limit 160 with a
  counter), Tags (comma-separated input; trim; drop empties), Cover image (section
  5, step 6).
- **Write** (in `md.ts`), only for fields whose value changed:
  - `withField(frontmatter, key, valueYaml, afterKey?)` replaces `key:` **and any
    following indented continuation or `- ` block lines** (block-style tags), else
    inserts after `afterKey`'s line (or its block), else appends.
  - `withoutField(frontmatter, key)` removes the same span.
  - Values: strings as `JSON.stringify(s)` (a valid YAML double-quoted scalar); tags as
    `JSON.stringify(array)` (a valid YAML flow sequence); `image` path unquoted.
- These values feed `PostView` live (title, cover) in Edit mode.

### Step 4 - Edit / Preview layout

- Top segmented control: **Edit | Preview**.
- **Edit:** `PostDetails` card, then `<PostView … bodySlot={<Toolbar/> + <EditorContent/>}
  resolveSrc={pendingAware} />`. The editor root already has `prose-doc`; remove any
  extra border/background so it reads as the page. A subtle focus ring is fine.
- **Preview:** `<PostView … bodyHtml={withPendingSrcs(renderMarkdown(bodyOut))} />`,
  read-only, with title, date, reading time (`readingMinutes(bodyOut)`), cover and tags
  from the current details.
- Read-only state (section 4.4 failure): render Preview of the original with the
  message on top; hide Edit and Send.

### Step 5 - Images: `images.ts` + `ImageDialog.tsx` (new)

- `processImage(file)`: type and size checks → `createImageBitmap(file)` (no object
  URLs) → canvas scaled to ≤ 1600 px → `toDataURL("image/webp", 0.85)`. If the result
  isn't `data:image/webp`, fill white and use JPEG 0.85 → enforce ≤ 1.5 MB (one retry
  at 0.7). Returns `{ base64, dataUrl, ext, width, height, bytes }`.
- `hash8(bytes)` (SHA-256 → 8 hex), `fileStem(name)` (lowercase, `[a-z0-9-]`, ≤ 40,
  fallback `image`; covers use `cover`), `publicPath(slug, stem, hash, ext)`.
- `ImageDialog`: choose file → preview → "Describe the image" (required unless
  "Decorative image" is ticked) → Insert. Errors in plain words (wrong type, too big,
  couldn't read it). Cover mode adds the hint "Wide images (about 1200×630) look
  best when shared".

### Step 6 - Image controls

- **Toolbar:** **Add image** → dialog → `setImage({ src: publicPath, alt })`. When an
  image is selected: **Describe** (edit alt), **Replace** (dialog; `setImage` over the
  selection, prefilled alt), **Remove** (`deleteSelection`).
- **Cover** in `PostDetails`: thumbnail (`resolveSrc(image)`) with **Add / Change** →
  dialog (cover mode) → `withField(…"image"…, after "updated"/"date")` and
  `withField(…"imageAlt"…, after "image")`, and **Remove** → `withoutField` for both.

### Step 6b - Links and sources

- **`LinkDialog.tsx`** replaces the `window.prompt` in `Toolbar.tsx`'s `setLink`. It
  has a web-address field, prefilled when the cursor is on a link, and runs
  validation and normalisation per section 3 "Link targets".
  - Apply → `extendMarkRange("link").setLink({ href })`. Remove →
    `unsetLink()`. Open → `window.open(href, "_blank", "noopener")`.
  - With no selection, also ask for the link text and insert it as linked text.
  - Bind Ctrl/Cmd+K to open it (a tiny extension with `addKeyboardShortcuts`).
  - Keep StarterKit's Link `autolink` / `linkOnPaste` on, so pasting a URL over
    selected text links it. Restrict `protocols` / `isAllowedUri` to the allowed
    targets.
- **`cite.ts`** (pure): `parseCiteInput(s) → { doi } | { pmid } | null`,
  `formatSource(c)`, and `insertSource(editor, c, linkRange?)`.
- **`SourceDialog.tsx`:**
  - **Lookup mode:** input "DOI or PubMed link" → **Look up** → `GET
    /api/blog-edit?cite=<encoded input>` → shows the formatted preview plus editable
    fields (authors as a comma list, title, journal, volume, pages, year), with a live
    preview → **Add**. Errors: "We couldn't find that article - check the DOI, or
    enter the details manually."
  - **Manual mode** (link from lookup mode, or a tab): Authors or organisation, Title,
    Published in/by, Year, Web address (required unless DOI given), optional DOI →
    same preview → **Add**.
  - Checkbox "Link the selected text to this source" (shown only when text was
    selected).
- **Toolbar:** **Add source** button opens `SourceDialog`.

### Step 7 - Submit

- **Send for review** is disabled until something changed: details edited, body HTML
  differs (section 4.4), or images added.
- Payload `{ slug, sha, markdown, name, summary, images: [{ path: "public" + publicPath,
  data: base64 }] }`.
- New errors: `413` → "The images are too large together. Remove one and try
  again." `400 bad-image` → "One image couldn't be accepted. Remove it and add it
  again." Keep the phase-1 handling for 401/409/422.

### Step 8 - `functions/api/blog-edit.js`

**8a. Validate `images`** (optional, default `[]`) after the markdown validation:

- At most 10 entries, no duplicate paths.
- `path` must match exactly
  `^public/blog/<slug>/[a-z0-9]+(?:-[a-z0-9]+)*-[0-9a-f]{8}\.(webp|jpg)$`.
- `data` must decode (`atob` in try/catch) to 1 B-1.5 MB.
- **Magic bytes** must match the extension: WebP = `RIFF`@0 and `WEBP`@8; JPEG =
  `FF D8 FF`.
- SHA-256 of the bytes, first 8 hex, must equal the name's hash.
- `markdown` must contain `path.slice("public".length)`.
- Failure → `400 { error: "bad-image", path }`; total decoded size > 12 MB → `413`.
- `422 no-changes` only when the markdown is unchanged **and** there are no images.

**8b. Replace `PUT /contents` with one Git Data commit.** After the conflict check and
`GET /git/ref/heads/<base>`:

1. `GET /git/commits/<baseCommit>` → `tree.sha`.
2. `POST /git/blobs` (sequentially) for the markdown (`b64encode(markdown)`) and each
   image (`data`), all `encoding: "base64"`.
3. `POST /git/trees { base_tree, tree: [{ path, mode: "100644", type: "blob", sha }…] }`.
4. `POST /git/commits { message, tree, parents: [baseCommit] }`. Keep the existing
   message, plus `Images: <n> added (<file names>)` when there are images.
5. `createBranch(env, slug, newCommitSha)` (the existing helper; pass the new commit).
6. `POST /pulls` as today, with an "Images" list in the body.
7. Failures → `githubFailure("blob|tree|commit|branch|pull-request", status)`.

**8c. Citation lookup: `GET /api/blog-edit?cite=<input>`.** Same `guarded()` gate;
dispatch on the `cite` param before the existing `slug` path.

1. Parse `cite` server-side with the same rules as section 4.5 → DOI or PMID, else
   `400 { error: "bad-cite" }`.
2. **DOI:** `fetch("https://doi.org/" + encodeURIComponent(doi).replace(/%2F/g, "/"),
   { headers: { Accept: "application/vnd.citationstyles.csl+json", "User-Agent":
   UA } })` (redirects are followed by default). Non-2xx or non-JSON → `404 {
   error: "not-found" }`.
3. **PMID:**
   `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=<pmid>`.
   Missing `result[pmid]` or an `error` field → 404. If it has a DOI, do step 2 too
   and merge (CSL fields win, keep `pmid`).
4. Normalise to `CiteData` (section 4.5) **on the server** and return it. Cap text
   fields (title 500 chars, ≤ 50 authors) and strip tags. Never return the raw
   upstream body.
5. Upstream timeout: wrap each fetch in `AbortSignal.timeout(8000)` → `504 {
   error: "timeout" }`.
6. `UA` = `"internal-blog-editor (citation lookup)"`. **Don't put any personal email
   in it.** Optionally read `env.CITE_CONTACT` and append ` mailto:<value>` if the
   owner later sets one (Crossref's "polite pool"); leave it unset now.
7. Only these two hosts, built from validated IDs. Never fetch a user-supplied URL.

Update the header comment. Keep the guard and the cookie helpers byte-identical to
`report-access.js`.

### Step 9 - Public CSS (ships to production; intended)

In `src/app/globals.css` inside the `.prose-doc` rules:

```css
.prose-doc img {
  @apply my-6 h-auto max-w-full rounded-xl border border-line;
}
```

### Step 10 - Docs

- `content/blog/README.md`: a short "Editing on internal" note (what non-technical
  editors can do; images are processed and content-hashed automatically).
- `docs/BLOG_EDITOR_PLAN.md`: one line at the top pointing here.
- `CHANGELOG.md`.
- At the top of this doc, add an "Update - implemented" note with every deviation.

---

## 6. Testing

As in phase 1, section 5: `NEXT_PUBLIC_BLOG_EDITOR=1 npm run build && npx wrangler
pages dev out`, with `.dev.vars` (already git-ignored) and
`GITHUB_BASE_BRANCH=blog-editor-test`. **Ask the owner before pushing or resetting
that branch**, and before closing test PRs or deleting test branches. Never test
against `staging`. Never print the token.

Fixtures (generate them; don't commit them): a JPEG with GPS EXIF (`exiftool
-GPSLatitude=52.37 -GPSLongitude=4.89 x.jpg`), a transparent PNG, an SVG, a GIF, a
> 15 MB image, and, on the test branch only, a post containing something the editor
can't keep (for example a raw `<details>` HTML block or a footnote).

---

## 7. Acceptance checks (all must pass before opening the PR)

1. `npx tsc --noEmit`, `npm run lint`, `npm audit --audit-level=high` pass.
   Production build with no flags:
   `grep -rlE "ProseMirror|tiptap|blog-edit|Edit post" out/ || echo CLEAN` prints
   `CLEAN`.
2. **Production output unchanged by the refactor.** Build without flags on
   `origin/staging` → copy `out/blog` aside; build without flags on your branch
   **before step 9's CSS** → `diff -r` shows no differences in any `blog/**/*.html`.
   (Run it again after step 9; only CSS asset names/content may differ.)
3. **Preview = build:** for every existing post, Preview's body HTML equals the
   `prose-doc` inner HTML of that post's built page.
4. **No technical surface:** the editor UI contains no "Source", "Frontmatter",
   "Markdown", "alt" or raw `---`/YAML anywhere (inspect with `get_page_text`).
5. **No base64 in the document:** after adding two images, the submitted markdown
   contains `/blog/<slug>/…` paths and no `data:image`.
6. **Details-only edit = minimal diff:** changing only the title produces a PR whose
   diff touches only the `title:` and `updated:` lines, even on the posts phase 1
   flagged as lossy.
7. **Untouched = no submit:** opening a post and changing nothing leaves "Send for
   review" disabled.
8. **Safety lock:** the fixture post opens read-only with the "ask the web team"
   message; no Edit tab or Send button.
9. **Images end to end:** text + 2 inline images + a cover → exactly one commit
   touching the `.md` and 3 images. After merging into `blog-editor-test` and building
   that branch, the images render on `/blog/<slug>`, and `og:image` points to the
   cover.
10. **Metadata stripped:** the GPS JPEG, once committed, has no GPS/EXIF (`exiftool`
    on the file from the PR branch).
11. **Server rejects** (with `curl` and a valid cookie), each with 400 `bad-image`:
    - a path outside `public/blog/<slug>/`, or containing `..`
    - a `.png` or `.svg` extension
    - PNG bytes named `.webp`
    - a hash mismatch
    - an image not referenced in the markdown
    - 11 images

    And with 413: a 1.6 MB image.
12. **Frontmatter safety:** a title and an image description containing `: " #` and
    `’` survive as valid YAML (the build reads them back exactly). Block-style tags
    (`tags:` followed by `- x` lines) are replaced cleanly. `date:` keeps its original
    form.
13. Pasting or dropping an image file inserts **no** base64 image.
14. JPEG fallback (temporarily force it): a `.jpg` is produced, the transparent PNG
    gets a white background, and the server accepts it.
15. **Links:** Ctrl/Cmd+K opens the dialog. Pasting a URL over selected text links
    it. `example.org` becomes `https://example.org`. `javascript:alert(1)` and
    `data:` are refused, in both the dialog and paste. Editing and removing an
    existing link work.
16. **Lookup inputs:** each of these resolves to the same article:
    `10.1038/d41586-023-03266-1`, `doi:10.1038/d41586-023-03266-1`,
    `https://doi.org/10.1038/d41586-023-03266-1`, and
    `https://pubmed.ncbi.nlm.nih.gov/37857895/`. The PubMed path also adds the
    `[PubMed]` link. An arXiv DOI (`10.48550/arXiv.…`, DataCite) resolves too. A
    nonexistent DOI and a publisher URL give the friendly messages.
17. **House-style oracle:** the three Sources entries in
    `content/blog/living-guidelines-for-ai-in-research.md` that have a DOI/PMID,
    regenerated via lookup, match the existing lines except for differences you list
    in the PR (for example upstream title casing). The ≤5 / >5 author rule, `van`
    particles and the en-dash page range are correct.
18. **Insertion:** in a post with a `## Sources` list, the entry is appended to that
    list. In a post without one, a `## Sources` heading + list is created at the end.
    The selected text becomes a link to the DOI. Adding the same DOI twice shows
    "already listed". The submitted Markdown passes the equivalence check and
    renders the entry identically in Preview and the built page.
19. **Lookup endpoint safety** (`curl`): no cookie → 401. `cite=http://169.254.169.254/`
    or any URL that isn't a DOI or PubMed link → 400. The response never contains
    upstream raw JSON. With `BLOG_EDITOR_ENABLED` unset → 404.
20. **Phase-1 regressions:** 409 conflict, 401 re-unlock keeping the edits, and
    non-ASCII text all behave as before. `/report` is unchanged.

Put every check's output in the PR description (PR into `staging`, attribution
trailer, don't merge).
