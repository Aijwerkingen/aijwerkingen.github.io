# Plan: in-place blog editor on the internal site (staging only, PR-based)

**Audience:** a cold agent with no prior context. Read top to bottom, then implement
section 4 in order. Do not skip the acceptance checks in section 6.

**Prerequisite (human, not you):** section 3 ("GitHub + Cloudflare setup") must be
done by the repo owner before the save step can be tested end to end. You can build
and test everything up to "Save" without it.

---

## Update - implemented (2026-11-25)

Implemented on `session/blog-editor` off `staging`. Everything in section 4 was followed in
order; these are the deviations, all of them forced by what the codebase actually does:

1. **Production exclusion needs more than the build flag (affects section 6.2).** Steps 1 and 5
   assume `NEXT_PUBLIC_BLOG_EDITOR` alone keeps the editor out of production. On this codebase it
   does not: an ES import registers the module in the graph before any flag can be folded.
   Measured - with step 5's static import the production build emitted the editor *and* a 524 KB
   Tiptap chunk (`out/_next/static/chunks/2f98b2ytlu0qm.js`, 53 `ProseMirror` hits) although
   nothing rendered it; a conditional `dynamic()` in the Server Component changed nothing; a
   conditional `dynamic()` inside a Client Component still emitted both chunks. Deleting the
   reference entirely made `out/` clean, which proves check 2 is satisfiable - just not by a flag.
   So `next.config.ts` now *also* aliases `@/admin/blog-editor/EditPostButton` to the no-op
   `src/admin/blog-editor/disabled.tsx` when the flag is unset. The flag remains the switch that
   turns the feature on for staging.
2. **`updated:` is rewritten only when something else changed (step 4.3).** Auto-setting it on
   every save would make check 7's `no-changes` answer unreachable, because the submitted file
   would always differ from the stored one. With the guard a no-op save is byte-identical, the
   endpoint answers 422, and `dateModified` stops claiming edits that never happened.
3. **The name comes from a `readStoredName()` lazy initialiser, not a localStorage
   `useEffect` (step 4.5).** React 19's `react-hooks/set-state-in-effect` rule rejects the effect
   form and lint is a CI gate.
4. **`.gitignore` gained `.dev.vars*` (section 5).** It was not covered - only `.env*` was - so the
   local file holding a real token would have been committable.
5. **The page imports the button statically, as step 5 shows**, and the exclusion happens at
   resolve time (deviation 1). An intermediate design that made the button itself lazy was dropped:
   it removed the button from the pre-rendered HTML, which check 3 requires.

Checks 7, 8 and 9 need the throwaway `blog-editor-test` base branch from section 5 (a real token
and real writes), so they are held for the owner's go-ahead. Checks 1-6 and 10 pass; the evidence
is in the pull request.

---

## 1. Goal - exact behaviour

On **`internal.<domain>`** (the `staging` deploy) only:

1. Every blog post page (`/blog/<slug>`) shows an **Edit** button.
2. Clicking it asks for the **team password** (the same `INTERNAL_PASSWORD` that
   unlocks `/report`), unless the browser is already unlocked.
3. The post opens in a **Tiptap** rich-text editor, with the raw frontmatter in a
   plain textarea above it, and a **Source** tab that shows the whole `.md` file as
   plain text (escape hatch for anything the rich editor can't represent).
4. The editor types their name and a one-line summary and clicks **Submit**.
5. A Pages Function creates a branch from `staging`, commits the changed
   `content/blog/<slug>.md`, opens a **pull request into `staging`**, and the UI
   shows the PR link.
6. A human merges the PR. That push to `staging` redeploys the internal site
   (existing `deploy.yml`). Publishing to production is the usual staging → main PR.

On **production (`main`)**: nothing changes. No Edit button, no editor code in the
bundle, and the edit endpoint refuses every request.

### Decisions already made (do not revisit)

| Topic | Decision |
|---|---|
| Password | **Same** `INTERNAL_PASSWORD` and **same** `report_access` cookie as `/report`. Unlock by POSTing to the existing `/api/report-access`. |
| Save target | Always a **new branch + PR into `staging`**. Never commit directly to `staging` or `main`. |
| GitHub credential | A **fine-grained personal access token** (one repo, contents + PRs). No GitHub App. |
| Frontmatter | Edited as **raw text** (textarea). Never parsed and re-dumped with js-yaml (that would turn `date: 2026-08-07` into an ISO timestamp and reformat quoting). |
| Scope | Edit **existing** posts only. No create, delete, rename, or image upload. |
| Drafts | The staging build includes drafts (`BLOG_INCLUDE_DRAFTS=1`) so generated `published: false` posts can be reviewed and edited on internal before going live. |
| Attribution | Shared password = no identity. The self-reported name goes into the commit message and PR body. |

---

## 2. Context you need

- **Repo:** `Aijwerkingen/aijwerkingen.github.io`, git root = this directory. Work on a
  branch off `staging`; open the PR into `staging`.
- **Stack:** Next.js 16 with **static export** (`next.config.ts` → `output: "export"`),
  React 19, Tailwind 4, Node 24. Build = `npm run build` → `out/`.
  **Read `AGENTS.md` first:** this Next.js differs from your training data; consult
  `node_modules/next/dist/docs/` before using `next/dynamic` or client components.
- **Deploys:**
  - `main` → Cloudflare Pages (git integration) → production domain. Has **no**
    `NEXT_PUBLIC_*` flags. The `functions/` folder deploys there too.
  - `staging` → `.github/workflows/deploy.yml` → `wrangler pages deploy out
    --project-name=aisafetywatch-internal --branch=staging` → `internal.<domain>`.
- **Existing gating pattern you must copy:**
  - Build flag: `src/admin/panel-enabled.ts` (`NEXT_PUBLIC_BRAND_PANEL === "1"`), used
    in `src/app/layout.tsx` as `{brandPanelEnabled && <AdminDrawer />}`. The flag is
    set only in `deploy.yml`.
  - Edge password: `functions/api/report-access.js`. `POST {password}` → sets cookie
    `report_access=<sha256("report-access:" + INTERNAL_PASSWORD)>` (HttpOnly, Secure,
    SameSite=Strict, Path=/, 12h). `GET` → 200 if cookie valid, else 401.
    **Note:** `GET` also returns 200 without a cookie when `DISABLE_PRODUCTION_GATE=1`
    (a pilot switch). So `GET /api/report-access` returning 200 does **not** prove the
    user knows the password. The edit endpoint must verify the cookie itself.
- **Blog engine:** `src/lib/blog.ts` reads `content/blog/*.md` at build time (YAML
  frontmatter split by a regex, body rendered with `marked` + GFM + heading IDs).
  The post page is `src/app/blog/[slug]/page.tsx` (a server component). Body HTML
  renders inside `<div className="prose-doc">`.
- **Guardrails that break the build if ignored:**
  - `eslint.config.mjs` bans literals matching
    `aijwerkingen|aisafetywatch|github\.io|lareb|...` in `src/**`. Never hard-code the
    repo owner/name or domain in `src/`. `functions/**` is eslint-ignored, but take
    the repo name from env there too.
  - `tsconfig.json` includes `**/*.ts`, so Pages Functions must be **`.js`**.
  - CSP is in `src/app/layout.tsx` (around lines 184-193): `script-src 'self'
    'unsafe-inline'`, `style-src 'self' 'unsafe-inline'`, `connect-src 'self' ...`,
    `img-src 'self' data:`. Tiptap/ProseMirror works with this, and all GitHub calls
    are made **server-side** from the Function, so **no CSP change is needed**. Do not
    add `api.github.com` to `connect-src`.
  - CI (`.github/workflows/ci.yml`) runs `tsc --noEmit`, `npm run lint`,
    `npm run build`, `npm audit --audit-level=high`. All must pass.

---

## 3. GitHub + Cloudflare setup (HUMAN - repo owner does this)

### 3.1 Create the token

> **Status (2026-11-25):** the implementing agent already holds a fine-grained token
> for the `Aijwerkingen` org. Before using it (for local testing in `.dev.vars` or as
> the Cloudflare `GITHUB_TOKEN`), confirm it has **Contents: Read and write** and
> **Pull requests: Read and write** on `aijwerkingen.github.io`. Run the check in 3.3,
> then test that a branch can be created on the throwaway base branch from section 5.
> If it lacks either permission, or covers more repos than this one, ask the owner for
> a token scoped exactly as below. **Never print, log, or commit the token.**

1. Pick the GitHub account that will **own** the token. PRs will show as opened by
   this account. A dedicated machine user in the org is cleanest; your own account
   works too.
2. If the org restricts fine-grained tokens: **Org `Aijwerkingen` → Settings →
   Personal access tokens → Settings** → allow fine-grained tokens (and, if approval
   is required, approve the request after step 3).
3. **Account → Settings → Developer settings → Personal access tokens →
   Fine-grained tokens → Generate new token**
   - **Resource owner:** `Aijwerkingen` (the org, not your personal account)
   - **Expiration:** the longest the org allows (put a calendar reminder to rotate)
   - **Repository access:** *Only select repositories* → `aijwerkingen.github.io`
   - **Repository permissions:**
     - **Contents: Read and write** (read the `.md`, create branch, commit)
     - **Pull requests: Read and write** (open the PR)
     - Metadata: Read-only (added automatically)
   - Nothing else. No account permissions.
4. Copy the token once. Do **not** put it in the repo or in GitHub Actions secrets;
   only Cloudflare needs it.

### 3.2 Repo settings (recommended, both optional)

- **Settings → General → Pull Requests → "Automatically delete head branches"** →
  on, so merged `blog-edit/*` branches clean themselves up.
- If `staging` has branch protection, nothing changes: the editor always goes through
  a PR. PRs opened with a PAT **do** trigger `ci.yml`.

### 3.3 Sanity-check the token (optional, from your machine)

```bash
read -s GH_T && curl -s -H "Authorization: Bearer $GH_T" -H "User-Agent: blog-editor-check" https://api.github.com/repos/Aijwerkingen/aijwerkingen.github.io/contents/content/blog/README.md?ref=staging | head -c 200; unset GH_T
```

You should see JSON starting with `{"name":"README.md"`. A `404` means wrong repo
access, or an org approval is still pending.

### 3.4 Cloudflare Pages env (project `aisafetywatch-internal` ONLY)

Cloudflare dashboard → Workers & Pages → `aisafetywatch-internal` → Settings →
Variables and Secrets. Add them in the **same environment where `INTERNAL_PASSWORD`
already lives**:

| Name | Type | Value |
|---|---|---|
| `GITHUB_TOKEN` | **Secret** | the token from 3.1 |
| `GITHUB_REPO` | Text | `Aijwerkingen/aijwerkingen.github.io` |
| `GITHUB_BASE_BRANCH` | Text | `staging` |
| `BLOG_EDITOR_ENABLED` | Text | `1` |

`INTERNAL_PASSWORD` is already set there; nothing to change.

**Never set `GITHUB_TOKEN` or `BLOG_EDITOR_ENABLED` on the production Pages
project.** Their absence is what keeps the endpoint dead on production.

Env changes apply to the **next** deployment: re-run the "Deploy staging to
Cloudflare (internal)" workflow (Actions → Run workflow) after adding them.

---

## 4. Implementation (AGENT)

Branch: `session/blog-editor` off `staging`. Order matters; each step is testable.

### Step 1 - Build flags

1. **NEW `src/admin/blog-editor-enabled.ts`**, same shape and comment style as
   `panel-enabled.ts`:
   ```ts
   export const blogEditorEnabled = process.env.NEXT_PUBLIC_BLOG_EDITOR === "1";
   ```
2. **`.github/workflows/deploy.yml`**: in the `npm run build` step's `env`, add
   ```yaml
   # Staging only: Edit button + Tiptap editor on blog posts (see
   # src/admin/blog-editor-enabled.ts and docs/BLOG_EDITOR_PLAN.md).
   NEXT_PUBLIC_BLOG_EDITOR: "1"
   # Staging only: build published:false drafts so they can be reviewed/edited.
   BLOG_INCLUDE_DRAFTS: "1"
   ```
   Do **not** touch `ci.yml` (CI must keep proving the production-shaped build).

### Step 2 - Pages Function `functions/api/blog-edit.js`

A single file (no shared imports, to keep Pages Functions routing simple). Copy the
helpers `json`, `cookieValue`, `sha256Hex`, and `accessToken` from
`functions/api/report-access.js` **verbatim**, with a comment saying they must stay
identical, so the cookie value matches.

**Guard, at the top of both handlers, in this order:**

```js
if (env.BLOG_EDITOR_ENABLED !== "1" || !env.GITHUB_TOKEN || !env.GITHUB_REPO) {
  return json({ error: "not-found" }, 404);
}
const token = await accessToken(env.INTERNAL_PASSWORD);
if (!token || cookieValue(request, "report_access") !== token) {
  return json({ error: "locked" }, 401);
}
```

Do **not** honour `DISABLE_PRODUCTION_GATE` here.

**Constants and validation:**

- `BASE = env.GITHUB_BASE_BRANCH || "staging"`
- `SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/`. Reject anything else with 400. Also
  reject `readme`. Path is always `content/blog/${slug}.md` (built server-side,
  never from client input).
- Max markdown size 200 KB → 413.

**GitHub fetch helper (gotchas included):**

```js
async function gh(env, method, path, body) {
  const res = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "internal-blog-editor", // REQUIRED by GitHub; Workers send none
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, data };
}
```

UTF-8-safe base64 (GitHub's `content` is base64; `atob`/`btoa` alone corrupt
non-ASCII text such as curly quotes and em dashes):

```js
const b64decode = (b64) =>
  new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\n/g, "")), (c) => c.charCodeAt(0)));
function b64encode(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
```

**`GET /api/blog-edit?slug=<slug>`**

1. `gh(env, "GET", `/contents/content/blog/${slug}.md?ref=${BASE}`)`
2. 404 → `json({ error: "no-such-post" }, 404)`. Other non-ok → 502.
3. Return `json({ slug, sha: data.sha, markdown: b64decode(data.content) })`.

**`POST /api/blog-edit`** body `{ slug, sha, markdown, name, summary }`

1. CSRF hardening: require `request.headers.get("Content-Type")` to start with
   `application/json`, and require `Origin` to equal `new URL(request.url).origin`.
   Otherwise 403. (The cookie is already SameSite=Strict; this is belt and braces.)
2. Validate: slug (as above); `sha` is a 40-hex string; `markdown` is a non-empty
   string ≤ 200 KB that starts with `---\n` (the frontmatter fence); `name` is
   required. Clean `name` and `summary`: strip CR/LF and control characters, trim,
   cap `name` at 80 chars and `summary` at 120. Empty `summary` → `"Edit"`.
3. **Conflict check:** GET the file on `BASE` again. If `data.sha !== sha` → `json({
   error: "conflict" }, 409)` (someone changed the post since it was opened).
   If the new markdown equals the current file → `json({ error: "no-changes" }, 422)`.
4. Base commit: `gh("GET", `/git/ref/heads/${BASE}`)` → `data.object.sha`.
5. Branch name: `blog-edit/${slug}-${YYYYMMDD-HHMMSS UTC}`. Create it with
   `gh("POST", "/git/refs", { ref: `refs/heads/${branch}`, sha: baseCommit })`.
   On 422 (already exists), append `-2` and retry once.
6. Commit: `gh("PUT", `/contents/content/blog/${slug}.md`, { message, content:
   b64encode(markdown), sha, branch })`, where
   `message = `blog(${slug}): ${summary}\n\nEdited via the internal blog editor by
   ${name}.``
7. PR: `gh("POST", "/pulls", { title: `Blog edit: ${slug} - ${summary}`, head:
   branch, base: BASE, body })`. The body says: edited by `<name>` via the internal
   editor; post path; "Merging redeploys internal; publish to production via the
   usual staging → main PR."
8. Return `json({ prUrl: data.html_url, branch })`.
9. Any GitHub failure after step 5 → 502 with `{ error: "github", step: "<name>" }`.
   **Never** include the token or raw GitHub error bodies in the response. Log
   `status` with `console.error` for Cloudflare logs.

Export only `onRequestGet` and `onRequestPost`.

### Step 3 - Dependencies

```bash
npm install --save-exact @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-table @tiptap/markdown
```

- Use **Tiptap v3** (supports React 19). All `@tiptap/*` packages must share the
  same exact version. `@tiptap/markdown` is Tiptap's official Markdown extension;
  check its current README for the exact API (`editor.getMarkdown()` /
  `contentType: "markdown"`) instead of relying on memory.
- v3 `StarterKit` already includes Link and Underline. Configure Link with
  `openOnClick: false`. Use the table kit export from `@tiptap/extension-table`.
- Run `npm audit --audit-level=high` and make sure it still passes.

### Step 4 - Client components (`src/admin/blog-editor/`)

All files `"use client"`. Keep the UI copy in the component; this is an internal tool
(no `content.config.ts` entries needed).

**4a. `EditPostButton.tsx`** - the only thing the post page imports.

- Props: `{ slug: string }`.
- Renders a small secondary-style button "Edit post" (reuse existing Tailwind tokens,
  e.g. `border-line`, `text-ink-soft`, `hover:text-ink`).
- On click, load the editor lazily: `const { BlogEditor } = await
  import("./BlogEditor")`, or `next/dynamic(..., { ssr: false })` declared in this
  client file (check the Next 16 docs in `node_modules/next/dist/docs/` for the
  current rule on `ssr: false`). Render it as a full-screen overlay (`fixed inset-0
  z-50 overflow-auto bg-canvas`), with Esc / Close confirming before discarding
  unsaved changes.

**4b. `BlogEditor.tsx`** - a state machine:
`checking → locked → loading → editing → submitting → done | error`.

1. **checking:** `GET /api/blog-edit?slug=…` (`credentials: "same-origin"`).
   - 200 → go to *editing* with `{ sha, markdown }`.
   - 401 → *locked*.
   - 404 `no-such-post` → error "This post isn't on the staging branch yet."
   - Other 404 → error "Editing isn't enabled on this deployment."
2. **locked:** password field → `POST /api/report-access` with `{ password }`. 200 →
   back to *checking*. 401 → "That password didn't work." (Same password and cookie
   as `/report`, so unlocking either unlocks both for 12h.)
3. **editing:** split the file with the **same** regex as `src/lib/blog.ts`
   (`/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/`) into `frontmatterText` and
   `body`. Layout, top to bottom:
   - Tabs: **Visual** (default) | **Source**.
   - *Visual tab:*
     - "Frontmatter" monospace `<textarea>` bound to `frontmatterText`.
     - A toolbar (bold, italic, H2, H3, bullet list, ordered list, blockquote, link,
       code, undo/redo; table insert optional).
     - Tiptap `EditorContent`, with the editor's root wrapped in `className="prose-doc"`
       so it looks like the live post. Load `body` as Markdown. Set
       `immediatelyRender: false`.
   - *Source tab:* one monospace `<textarea>` with the **whole file**. Switching tabs
     syncs both ways: Visual → Source serialises `---\n${frontmatterText}\n---\n\n${
     editor.getMarkdown()}`; Source → Visual re-splits and reloads the editor.
   - **Round-trip warning:** right after loading, serialise the untouched editor
     back to Markdown and compare with the original body (normalise by trimming
     trailing whitespace per line and collapsing 3+ newlines to 2). If they differ,
     show a yellow banner: "This post has formatting the visual editor may rewrite.
     Check the Source tab before submitting, or edit there." Do **not** block.
   - Fields "Your name" (required) and "What changed" (optional, one line).
   - **Submit** builds the final file:
     - From whichever tab is active (Source text as-is; Visual = assembled as above).
     - Ensure exactly one trailing newline.
     - **Auto-set `updated:`** in the frontmatter to today's UTC date `YYYY-MM-DD`: if
       a line matching `/^updated:.*$/m` exists, replace it; otherwise insert
       `updated: <date>` on the line after the `date:` line. Plain string edits only,
       no YAML parse/dump.
     - Then `POST /api/blog-edit` with `{ slug, sha, markdown, name, summary }`.
4. **Responses:**
   - 200 → *done*: "Pull request opened" + link to `prUrl` (new tab) + "It goes live
     on internal after the PR is merged."
   - 409 → "Someone changed this post since you opened it. Copy your text from the
     Source tab, reload, and reapply." Keep the editor content visible.
   - 422 `no-changes` → "Nothing changed."
   - 401 → *locked*, keeping the edits in state.
   - Other → generic error, keeping the edits.
5. Remember "Your name" in `localStorage` (inside try/catch). Nothing else persisted.

### Step 5 - Wire into the post page

`src/app/blog/[slug]/page.tsx`:

```tsx
import { blogEditorEnabled } from "@/admin/blog-editor-enabled";
import { EditPostButton } from "@/admin/blog-editor/EditPostButton";
...
// In the header, next to the date/reading-time row:
{blogEditorEnabled && <EditPostButton slug={slug} />}
```

Add a comment mirroring the one at `{brandPanelEnabled && <AdminDrawer />}` in
`layout.tsx`: staging-only, compiled out of production, see this doc.

When `BLOG_INCLUDE_DRAFTS=1` and the post is hidden (`published === false || draft
=== true`), also show a small "Draft - not on production" pill in the header, behind
the same `blogEditorEnabled` check. `getPostBySlug` already returns the flags.

### Step 6 - Docs

- `README.md`: a "Blog editor (staging only)" section next to "Report gate (staging
  only)". Cover the flags, the env vars from section 3.4, and the PR flow.
- `content/blog/README.md`: a short "Editing a post on internal" subsection.
- `CHANGELOG.md`: an entry.
- At the top of this file, add an "Update - implemented" note listing any deviation.

---

## 5. Local testing

1. **UI only:**
   ```bash
   NEXT_PUBLIC_BLOG_EDITOR=1 BLOG_INCLUDE_DRAFTS=1 npm run dev
   ```
   The button and overlay render; API calls 404 (no Functions under `next dev`).
   That's expected.
2. **Full flow, against a throwaway base branch (never `staging`):**
   - `git push origin staging:blog-editor-test` (ask the human first; this pushes a
     branch).
   - Create a git-ignored `.dev.vars` (check `.gitignore` covers it; add it if not):
     ```
     INTERNAL_PASSWORD=localtest
     BLOG_EDITOR_ENABLED=1
     GITHUB_TOKEN=<human pastes; never commit, never echo>
     GITHUB_REPO=Aijwerkingen/aijwerkingen.github.io
     GITHUB_BASE_BRANCH=blog-editor-test
     ```
   - `NEXT_PUBLIC_BLOG_EDITOR=1 npm run build && npx wrangler pages dev out`
   - Edit a post, submit, and confirm a PR into `blog-editor-test` appears. Close the
     PR, then delete the test branch afterwards (with the human's OK).
   - The cookie is `Secure`. If the browser won't store it over `http://localhost`,
     test in Chromium (it treats localhost as secure) rather than weakening the flag.

---

## 6. Acceptance checks (all must pass before opening the PR)

1. `npx tsc --noEmit`, `npm run lint`, `npm audit --audit-level=high` pass.
2. **Production-shaped build is clean.** Run `npm run build` with **no** flags, then:
   ```bash
   grep -rlE "ProseMirror|tiptap|blog-edit|Edit post" out/ || echo CLEAN
   ```
   It must print `CLEAN`.
3. **Staging build has it:** `NEXT_PUBLIC_BLOG_EDITOR=1 npm run build`. The post HTML
   contains the button. The Tiptap chunk is a separate JS file that is **not**
   referenced in the initial HTML (it's lazy).
4. **Endpoint dead without env:** `wrangler pages dev out` without
   `BLOG_EDITOR_ENABLED` → `GET /api/blog-edit?slug=x` returns 404.
5. **Endpoint locked without cookie:** with env set but no cookie → 401, even with
   `DISABLE_PRODUCTION_GATE=1` set.
6. Bad slug (`../x`, `README`, `A_B`) → 400. Cross-origin `Origin` header on POST → 403.
7. **Lossless round trip:** for every post in `content/blog/`, open in the editor and
   submit with no changes → 422 `no-changes` (apart from the `updated:` line; compare
   with `updated:` stripped). Record which posts trigger the round-trip warning in
   the PR description.
8. Non-ASCII survives: edit a post containing `’ — é`, and confirm the committed file
   on the PR branch shows those characters intact.
9. Conflict: open the editor, change the same file on the base branch via the GitHub
   UI, submit → 409 message.
10. `/report` still works exactly as before (unlock, iframe, cookie).

---

## 7. Out of scope (don't build)

Creating, deleting or renaming posts; image upload (`public/blog/<slug>/`); per-user
accounts; auto-merge; editing non-blog pages; rate limiting the password (the
existing `/api/report-access` has none either - log it as a follow-up in
`PENDING-FIXES.md` if you think it matters).
