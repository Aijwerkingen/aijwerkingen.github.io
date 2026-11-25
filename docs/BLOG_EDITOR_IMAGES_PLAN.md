# Plan: images in the internal blog editor (phase 2)

**Audience:** a cold agent with no prior context. Read top to bottom, then implement
section 4 in order. Do not skip the acceptance checks in section 6.

**Builds on:** the shipped text-only editor (`docs/BLOG_EDITOR_PLAN.md`, merged in
PR #76). Read that doc's "Update - implemented" notes first. Its decisions and
guardrails all still apply. This doc only adds images.

**GitHub / Cloudflare setup:** nothing new. The existing fine-grained token's
**Contents: Read and write** permission also covers the Git Data API (blobs, trees,
commits) used below, and no new env vars are needed.

---

## 1. Goal - exact behaviour

In the editor on `internal.<domain>`, an editor can:

1. **Insert an inline image** at the cursor: toolbar **Image** → choose a file → enter
   alt text (or tick "Decorative") → the image appears in the editor immediately.
2. **Edit an existing image:** select it → **Alt text** (change it), **Replace**
   (upload a new file in its place), or press Delete to remove it.
3. **Set, replace, or remove the cover image** (frontmatter `image:` + `imageAlt:`),
   which is also the per-post social-share (OG) image.
4. **Submit** as today. The PR now contains **one commit** with the `.md` file and
   every new image file.

On production nothing changes, apart from one CSS rule that keeps inline images
inside the column (step 6).

### Decisions (do not revisit)

| Topic | Decision |
|---|---|
| Where files live | `public/blog/<slug>/<name>-<hash8>.<ext>`, referenced as `/blog/<slug>/<name>-<hash8>.<ext>`. This is the existing convention in the "Images" section of `content/blog/README.md`. The static export already puts a `blog/<slug>/` directory next to `blog/<slug>.html`, so this path doesn't collide with the post route. |
| File names | Content-hashed (first 8 hex of the SHA-256 of the final bytes). Files are never overwritten: "replace" means a new file and a new path, so there's no stale Cloudflare cache and nothing for a PR to clobber. |
| Processing | **In the browser, before upload.** Decode, scale so the longest side is ≤ 1600 px (never upscale), re-encode to **WebP q=0.85**. If the browser can't encode WebP (Safari returns PNG from `toDataURL("image/webp")`), use **JPEG q=0.85**. Re-encoding also **strips EXIF/GPS metadata**, which matters on a privacy-first site. |
| Accepted input | `image/png`, `image/jpeg`, `image/webp` only, ≤ 15 MB before processing. **No SVG** (script risk), **no GIF** (animation would be lost). Output must be ≤ 1.5 MB; if it isn't, retry once at q=0.7, then refuse. |
| Alt text | Required. A "Decorative" checkbox sets `alt=""` on purpose. |
| Commit shape | **One atomic commit** via the Git Data API (blobs → tree → commit), and the branch ref is created pointing at that commit. This replaces the current `PUT /contents` call for every save, including text-only saves. |
| Preview of new images | Never `blob:` URLs: the CSP's `img-src 'self' data:` blocks them. Pending images preview as `data:` URLs, but the **document only ever holds the final path**. See step 3. |
| Orphans | An image removed from a post stays in the repo. No delete flow. |
| Paste / drag-drop of files | Not supported in this phase. Must not insert base64 into the post (see check 9). |

---

## 2. Context you need

- **Read `AGENTS.md` first.** This Next.js differs from what you know.
- **Shipped code you'll change:**
  - `functions/api/blog-edit.js` - GET/POST endpoint. Today POST does: validate →
    conflict check (`contents` sha) → `GET /git/ref/heads/<base>` → `createBranch()`
    → `PUT /contents/...` → `POST /pulls`. Helpers: `gh()`, `b64encode()`,
    `b64decode()`, `clean()`, `githubFailure()`, `guarded()`.
  - `src/admin/blog-editor/BlogEditor.tsx` - state machine; `useEditor` with
    `[StarterKit, Image, TableKit, Markdown]`; `nextFile()` assembles the submitted
    file; `submit()` POSTs `{ slug, sha, markdown, name, summary }`.
  - `src/admin/blog-editor/Toolbar.tsx` - formatting buttons.
  - `src/admin/blog-editor/md.ts` - raw-text frontmatter helpers (`split`,
    `assemble`, `withUpdated`, …). **Frontmatter is never YAML-parsed and re-dumped.**
- **Tiptap version:** all `@tiptap/*` packages are pinned at `3.35.0`. Don't add new
  Tiptap packages (no FileHandler extension). Everything here uses the
  already-installed `@tiptap/extension-image` and plain DOM APIs.
- **Production exclusion:** `next.config.ts` aliases
  `@/admin/blog-editor/EditPostButton` to `disabled.tsx` when
  `NEXT_PUBLIC_BLOG_EDITOR` is unset. Keep **all** new client code under
  `src/admin/blog-editor/`, imported only from files already behind that alias, so
  the production build stays clean.
- **CSP** (`src/app/layout.tsx`): `img-src 'self' data:`, `connect-src 'self' …`.
  No change needed and none allowed.
- **Guardrails:** ESLint banned literals (no repo or domain names in `src/`); Pages
  Functions are `.js`; CI = `tsc --noEmit`, lint, build, `npm audit --audit-level=high`.

---

## 3. How pending images work (read before coding)

A new image isn't on the site until its PR is merged, so the editor can't load it
from `/blog/<slug>/…`. Use this approach:

- A per-session **pending store**, `Map<publicPath, { dataUrl, base64, bytes }>`,
  where `publicPath` is `/blog/<slug>/<name>-<hash8>.<ext>`.
- Insert the image node with **`src = publicPath`** (the final path) and the alt.
  So the Markdown, the Source tab, and the submitted file always contain the real
  path, never base64.
- A small `Image.extend({...})` overrides `renderHTML` so the **editor view** shows
  the pending `dataUrl` when `src` is in the store, and `src` otherwise:
  ```ts
  renderHTML({ HTMLAttributes }) {
    const src = pending.get(HTMLAttributes.src)?.dataUrl ?? HTMLAttributes.src;
    return ["img", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { src })];
  }
  ```
  `@tiptap/markdown` serialises from node attrs, so `getMarkdown()` still emits the
  path. **Verify this** (check 3). If it doesn't hold in 3.35.0, use a minimal node
  view instead. Don't put data URLs in the document.
- Keep `allowBase64: false` (the default) on the Image extension.
- Already-merged images (`/blog/<slug>/…` on staging) load normally: same origin.
- The cover preview uses the same store: show `pending.get(path)?.dataUrl ?? path`.
- On submit, send only the store entries whose `publicPath` still appears in the
  final file (body **or** frontmatter). Entries inserted then deleted are dropped.

---

## 4. Implementation

Branch `session/blog-editor-images` off the latest `origin/staging`.

### Step 1 - `src/admin/blog-editor/images.ts` (new, `"use client"`, no React)

- `ACCEPTED = ["image/png", "image/jpeg", "image/webp"]`; `MAX_INPUT = 15 MB`;
  `MAX_OUTPUT = 1.5 MB`; `MAX_EDGE = 1600`.
- `async function processImage(file: File): Promise<{ bytes: Uint8Array; ext: "webp" | "jpg"; dataUrl: string; width: number; height: number }>`
  1. Reject unaccepted type or size > `MAX_INPUT` with a typed error.
  2. `createImageBitmap(file)` (no object URLs). Compute the scale `min(1, MAX_EDGE / max(w, h))`.
  3. Draw onto a canvas. For JPEG output, fill white first (transparent PNGs otherwise
     turn black).
  4. `canvas.toDataURL("image/webp", 0.85)`. If the result doesn't start with
     `data:image/webp`, use `toDataURL("image/jpeg", 0.85)`.
  5. Decode to bytes. If > `MAX_OUTPUT`, retry at 0.7, then reject.
- `async function hash8(bytes)`: `crypto.subtle.digest("SHA-256")` → first 8 hex.
- `function fileStem(name: string)`: lowercase, strip the extension, non
  `[a-z0-9]` → `-`, trim dashes, max 40 chars, fallback `image`. The cover always uses
  stem `cover`.
- `function publicPath(slug, stem, hash, ext)` → `/blog/${slug}/${stem}-${hash}.${ext}`.
  The repo path is `"public" + publicPath`.
- The pending store: `createPendingStore()` returns `{ add, get, entries, clear }`.
  Create one per `BlogEditor` mount (`useRef`) and pass it to the extension through
  its options or storage.

### Step 2 - Frontmatter helpers in `md.ts`

Generalise the existing `withUpdated` pattern (keep `withUpdated` working; it can call
the new helper):

- `getField(frontmatter, key): string | null` - reads `^key:\s*(.*)$`, strips one
  layer of matching quotes.
- `withField(frontmatter, key, value, after?)` - replaces the line if present,
  otherwise inserts after the `after` key's line, otherwise appends.
- `withoutField(frontmatter, key)` - removes the line.
- **Quoting:** write `imageAlt` as `JSON.stringify(alt)`, which is a valid YAML
  double-quoted scalar and safe for colons, quotes and `#`. Write `image` unquoted
  (it's a path).

### Step 3 - Image dialog (`ImageDialog.tsx`, new)

A modal used for inline insert, replace, and cover:

- File input (`accept="image/png,image/jpeg,image/webp"`) → `processImage` → shows
  the preview (`dataUrl`), final dimensions and size.
- Alt text input (required unless "Decorative" is ticked). Helper text: "Describe
  what the image shows for someone who can't see it."
- For the cover: a hint if the aspect ratio is far from 1.91:1 ("1200×630 crops best
  for social sharing"). Don't crop.
- Confirm → `{ publicPath, alt, entry }`. The caller adds `entry` to the pending store.
- Errors in plain words: wrong type, too large, couldn't read the image.

### Step 4 - Editor wiring

**`BlogEditor.tsx`:**

- Replace `Image` with the extended image extension from section 3, configured with
  the pending store.
- **Cover panel** above the frontmatter textarea: thumbnail of the current cover
  (from `getField(frontmatterText, "image")`), plus **Upload cover** / **Replace** /
  **Remove** buttons. Upload/Replace opens the dialog in cover mode, then sets
  `image:` (after `date:`/`updated:`) and `imageAlt:` (right after `image:`) with
  `withField`. Remove calls `withoutField` for both. Because it edits
  `frontmatterText`, the Source tab and the dirty check keep working with no extra
  code.
- `submit()`: compute the final markdown as today, then
  `images = store.entries().filter(e => markdown.includes(e.publicPath)).map(e => ({ path: "public" + e.publicPath, data: e.base64 }))`.
  POST `{ slug, sha, markdown, name, summary, images }`.
- New response handling: `413 too-large` → "The images are too large together; remove
  one and try again." `400 bad-image` → "One image was rejected (<path>). Remove it
  and re-add it."

**`Toolbar.tsx`** - three buttons:

- **Image**: opens the dialog; on confirm,
  `editor.chain().focus().setImage({ src: publicPath, alt }).run()`.
- **Alt text** (enabled when `editor.isActive("image")`): `window.prompt` prefilled
  with the current alt; `updateAttributes("image", { alt })`.
- **Replace** (enabled when an image is selected): opens the dialog; on confirm,
  `setImage` over the selection (keep the old alt as the dialog's default).

### Step 5 - `functions/api/blog-edit.js`

**5a. Validate `images`** (optional array; default `[]`), right after the existing
markdown validation:

- At most **10** entries. Each is `{ path: string, data: string }`.
- `path` must match exactly
  `^public/blog/<slug>/[a-z0-9]+(?:-[a-z0-9]+)*-[0-9a-f]{8}\.(webp|jpg)$`. Build the
  regex with the already-validated slug, escaping nothing else. Reject duplicates.
- `data` must be base64 that decodes (`atob` in try/catch) to between 1 byte and
  **1.5 MB**.
- **Magic bytes** must match the extension: WebP = `RIFF` at offset 0 **and** `WEBP`
  at 8; JPEG = `FF D8 FF`.
- **Hash must match the name:** SHA-256 of the decoded bytes, first 8 hex, equals the
  `-<hash8>` in the file name.
- `markdown` must contain `path.slice("public".length)` (no unreferenced uploads).
- Any failure → `json({ error: "bad-image", path }, 400)`. If the total decoded bytes
  are > 12 MB → `413 too-large`.
- `no-changes` (422) now applies only when the markdown is unchanged **and**
  `images` is empty.

**5b. Replace `PUT /contents` with one Git Data commit.** After the conflict check
and `GET /git/ref/heads/<base>` (unchanged):

1. `GET /git/commits/<baseCommit>` → `data.tree.sha` (base tree).
2. Blobs: for the markdown, `POST /git/blobs { content: b64encode(markdown),
   encoding: "base64" }`; for each image, `POST /git/blobs { content: data,
   encoding: "base64" }`. Collect the SHAs. Run them sequentially (simple, and kind to
   rate limits).
3. `POST /git/trees { base_tree, tree: [{ path, mode: "100644", type: "blob", sha }, …] }`.
4. `POST /git/commits { message, tree, parents: [baseCommit] }`. Keep the existing
   message, and when there are images append a line `Images: <n> added
   (<comma-separated file names>)`.
5. `createBranch(env, slug, newCommitSha)`. The existing function already takes the
   commit to point at, so pass the new commit instead of `baseCommit`.
6. `POST /pulls` as today. Add an "Images" list to the body with each repo path.
7. Failures map to `githubFailure("<blob|tree|commit|branch|pull-request>", status)`.

Update the header comment's request shape. Keep the rest of the guard and helper code
unchanged, and keep the cookie helpers byte-identical to `report-access.js`.

### Step 6 - Public styling (ships to production; intended)

`src/app/globals.css`, inside the `.prose-doc` block:

```css
.prose-doc img {
  @apply my-6 h-auto max-w-full rounded-xl border border-line;
}
```

Without this, a 1600 px image overflows the post column on production too.

### Step 7 - Docs

- `content/blog/README.md`, "Images" section: say that files are content-hashed and
  processed in the browser when added through the internal editor, and that manually
  added images should follow the same `public/blog/<slug>/` path.
- `docs/BLOG_EDITOR_PLAN.md`: one line at the top pointing to this doc.
- `CHANGELOG.md` entry.
- At the top of this doc, add an "Update - implemented" note listing any deviation.

---

## 5. Testing

Same as phase 1, section 5: `NEXT_PUBLIC_BLOG_EDITOR=1 npm run build && npx wrangler
pages dev out`, with `.dev.vars` (already git-ignored) and
`GITHUB_BASE_BRANCH=blog-editor-test`. **Ask the owner before pushing or resetting
that branch**, and before closing test PRs or deleting test branches afterwards.
Never test against `staging`. Never print the token.

Test fixtures (generate them; don't commit them):

- A JPEG **with GPS EXIF**: e.g. `exiftool -GPSLatitude=52.37 -GPSLongitude=4.89 in.jpg`,
  or any phone photo.
- A transparent PNG.
- An SVG and a GIF (must be refused).
- A > 15 MB image (must be refused before decode).

---

## 6. Acceptance checks (all must pass before opening the PR)

1. `npx tsc --noEmit`, `npm run lint`, `npm audit --audit-level=high` pass.
   **Production build is still clean:** with no flags,
   `grep -rlE "ProseMirror|tiptap|blog-edit|Edit post" out/ || echo CLEAN` prints `CLEAN`.
2. **Metadata is stripped:** the GPS JPEG, uploaded and committed, has no EXIF in the
   committed file (`exiftool` on the file downloaded from the PR branch shows no GPS
   fields).
3. **No base64 in the document:** after inserting two images, the Source tab and the
   submitted markdown contain `/blog/<slug>/…` paths and **no** `data:image`.
4. **One commit:** an edit with text + 2 inline images + a cover produces a PR with
   exactly one commit touching the `.md` and 3 image files. After merging into
   `blog-editor-test` and building that branch locally, the images render on
   `/blog/<slug>` and the OG `og:image` meta tag points to the cover.
5. **Frontmatter:** the cover writes `image: /blog/<slug>/cover-<hash>.webp` and
   `imageAlt: "<alt>"`. An alt containing `: " #` survives as valid YAML (the build
   reads it back correctly). Remove deletes both lines. `date:` keeps its original
   form.
6. Alt is required. "Decorative" produces `![](…)`, i.e. `alt=""` in the HTML.
7. **Server rejects** (hit the endpoint with `curl` and a valid cookie), each with
   400 `bad-image`:
   - a path outside `public/blog/<slug>/`, or containing `..`
   - a `.png` or `.svg` extension
   - PNG bytes named `.webp`
   - a hash that doesn't match the bytes
   - an image not referenced in the markdown
   - 11 images

   And with 413: one 1.6 MB image.
8. **Phase-1 regressions:** a text-only edit still opens a PR (now via the Git Data
   path, one commit); 409 conflict and 422 no-changes still behave as before;
   non-ASCII text survives.
9. Pasting an image from the clipboard and dropping a file onto the editor insert
   **no** base64 image (either nothing happens, or the paste is ignored).
10. The JPEG fallback works: force it (temporarily stub WebP detection to fail),
    confirm a `.jpg` is produced, the transparent PNG gets a white background, and
    the server accepts it. Revert the stub.
11. `/report` still works exactly as before.

Put the output of every check in the PR description (into `staging`, attribution
trailer, don't merge).

---

## 7. Out of scope

Paste and drag-drop upload; deleting orphaned images; cropping or editing tools;
responsive `srcset`; image captions (Markdown has none; the post body can use an
italic line under the image); non-blog pages.
