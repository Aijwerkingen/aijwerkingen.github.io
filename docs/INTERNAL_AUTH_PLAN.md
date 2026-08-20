# Plan: Password-gate the staging survey at `internal.aisafetywatch.com`

**Audience:** a cold agent with no prior context. Follow top to bottom.

---

## 0. Context you need

- **Repo:** `Aijwerkingen/aijwerkingen.github.io` (GitHub). The git repo root is the
  folder `aijwerkingen.github.io/` (inside the workspace). Remote alias: `github-ps`.
- **Stack:** Next.js 16, **static export** (`next.config.ts` has `output: "export"`),
  build command `npm run build`, build output directory `out/`. Node 24 in CI.
- **Branches:**
  - `main` → deployed by **Cloudflare Pages** to `aisafetywatch.com` (+ `*.pages.dev`).
    Currently does not show the survey. **Must stay public and untouched.**
  - `staging` → currently auto-deployed to **GitHub Pages** (`aijwerkingen.github.io`)
    by `.github/workflows/deploy.yml`. This is the in-progress survey we must hide.
- **Goal:** serve the `staging` build at **`internal.aisafetywatch.com`** behind a
  **single shared password** (HTTP Basic Auth, **password only — username ignored**),
  and **stop serving the ungated `aijwerkingen.github.io`** copy.
- **Repo guardrails that will bite you (do not ignore):**
  - `tsconfig.json` `include` globs `**/*.ts` → a `.ts` Pages Function would be
    type-checked by `next build` and CI. **Write the function as `.js`.**
  - `eslint.config.mjs` has a `no-restricted-syntax` rule banning literals incl.
    `aisafetywatch`, `github.io`, `lareb`, `vaers`… `next build` runs lint, so a
    hardcoded domain **breaks the build**. **Put no domain literals in the function**
    and **eslint-ignore `functions/**`.**

## 1. Approach (decided — do not redesign)

1. A Cloudflare **Pages Function** `functions/_middleware.js` gates every request
   with Basic Auth. It only activates when the env secret `INTERNAL_PASSWORD` is set.
2. Serve `staging` from a **dedicated Cloudflare Pages project**
   (`aisafetywatch-internal`) whose **production branch is `staging`**, using
   **direct-upload deploys from GitHub Actions** (`wrangler pages deploy out`).
   (A custom domain on a Pages project maps to its *production* branch, which is why
   `staging` needs its own project rather than a branch alias on the existing one.)
3. Custom domain **`internal.aisafetywatch.com`** on that project.
4. **Retire the GitHub Pages deploy** so the ungated URL stops serving.

**Why gate-by-secret-presence:** the public production project (`main`) will not have
`INTERNAL_PASSWORD`, so even if `functions/_middleware.js` is later merged into `main`,
production stays open. No hostname allowlist, no banned literals.

**Locked choices:** password-only (blank/any username accepted); subdomain
`internal.aisafetywatch.com`; gate active iff `INTERNAL_PASSWORD` secret is set.

## 2. Prerequisites to collect before starting

- `INTERNAL_PASSWORD` — the shared password value (**ask the human; never commit it**).
- `CLOUDFLARE_API_TOKEN` — token with **Account · Cloudflare Pages · Edit**
  (and **Zone · DNS · Edit** on the `aisafetywatch.com` zone, in case the custom-domain
  CNAME must be added manually).
- `CLOUDFLARE_ACCOUNT_ID`.
- `gh` authenticated with repo admin (to set Actions secrets and disable Pages).

If you lack the Cloudflare token, do the Cloudflare steps via the dashboard (noted inline)
and hand the human the exact clicks.

---

## 3. Repo changes (on the `staging` branch)

> Work inside the git repo root: `aijwerkingen.github.io/`. Branch: `staging`.
> `git switch staging && git pull`.

### 3a. `functions/_middleware.js` (new file)

```js
// functions/_middleware.js
//
// Cloudflare Pages Function — shared-password gate (HTTP Basic Auth).
//
// The `staging` branch is served at https://internal.aisafetywatch.com via the
// "aisafetywatch-internal" Pages project. This puts one shared password in front
// of EVERY request so only people we hand the password to can view the survey.
//
//  * Password-only: Basic Auth carries "username:password"; we ignore the
//    username and validate only the password (blank/any username is fine).
//  * Active ONLY when INTERNAL_PASSWORD is set on the project. The public
//    production project (aisafetywatch.com / main) has no such secret, so this
//    file is transparent there even if merged into main — production is never
//    locked.
//  * Constant-time comparison (SHA-256 digests) avoids timing leaks.

export async function onRequest(context) {
  const { request, env, next } = context;
  const expected = env.INTERNAL_PASSWORD;

  // No password configured => gate disabled, serve normally.
  if (!expected) return next();

  const header = request.headers.get("Authorization") || "";
  if (header.startsWith("Basic ")) {
    let decoded = "";
    try {
      decoded = atob(header.slice(6));
    } catch {
      decoded = "";
    }
    const colon = decoded.indexOf(":"); // "username:password"
    if (colon !== -1) {
      const supplied = decoded.slice(colon + 1);
      if (await timingSafeEqual(supplied, expected)) {
        const res = await next();
        const out = new Response(res.body, res);
        out.headers.set("Cache-Control", "no-store");
        return out;
      }
    }
  }

  return new Response("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Internal preview", charset="UTF-8"',
      "Cache-Control": "no-store",
    },
  });
}

async function timingSafeEqual(a, b) {
  const enc = new TextEncoder();
  const [ah, bh] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(a)),
    crypto.subtle.digest("SHA-256", enc.encode(b)),
  ]);
  const av = new Uint8Array(ah);
  const bv = new Uint8Array(bh);
  let diff = 0;
  for (let i = 0; i < av.length; i++) diff |= av[i] ^ bv[i];
  return diff === 0;
}
```

### 3b. `eslint.config.mjs` — ignore `functions/**`

In the `globalIgnores([...])` array add `"functions/**"`:

```js
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "functions/**", // Cloudflare Pages Functions — not part of the Next app
  ]),
```

### 3c. `tsconfig.json` — exclude `functions` (belt-and-suspenders)

```json
  "exclude": ["node_modules", "functions"]
```

### 3d. Verify the build is still green, then commit

```bash
npm ci
npm run build      # must pass: next lint + type-check + static export
```

If green:

```bash
git add functions/_middleware.js eslint.config.mjs tsconfig.json
git commit -m "Add Basic Auth gate for internal staging preview"
```

Do **not** push yet if you want to create Cloudflare infra first; either order works
because the gate is inert until the secret exists. Recommended order: create the project
and set the secret (Section 4–5), then push (Section 6 workflow triggers the deploy).

---

## 4. Create the Cloudflare Pages project

Export env for the CLI:

```bash
export CLOUDFLARE_API_TOKEN=***   # Pages:Edit (+ DNS:Edit)
export CLOUDFLARE_ACCOUNT_ID=***
```

Create a **direct-upload** project whose production branch is `staging`:

```bash
npx wrangler@latest pages project create aisafetywatch-internal \
  --production-branch=staging
```

> Dashboard fallback: Workers & Pages → Create → Pages → "Direct upload" (or connect
> the repo with production branch `staging`, build `npm run build`, output `out`).
> Direct-upload from Actions is the model this plan uses.

## 5. Set the shared password as a project secret

```bash
printf '%s' "$INTERNAL_PASSWORD" | \
  npx wrangler@latest pages secret put INTERNAL_PASSWORD \
  --project-name=aisafetywatch-internal
```

(Sets it for the production environment. Secrets take effect on the **next** deploy.)

> Dashboard fallback: project → Settings → Variables and Secrets → add **encrypted**
> `INTERNAL_PASSWORD` (Production).

## 6. Wire the GitHub Actions deploy (replaces GitHub Pages)

Add the repo Actions secrets:

```bash
gh secret set CLOUDFLARE_API_TOKEN  --repo Aijwerkingen/aijwerkingen.github.io
gh secret set CLOUDFLARE_ACCOUNT_ID --repo Aijwerkingen/aijwerkingen.github.io
```

Replace `.github/workflows/deploy.yml` entirely with:

```yaml
name: Deploy staging to Cloudflare (internal)

on:
  push:
    branches: [staging]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm run build
      - name: Deploy to Cloudflare Pages (internal)
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
        run: >
          npx wrangler@latest pages deploy out
          --project-name=aisafetywatch-internal
          --branch=staging
```

`wrangler pages deploy` automatically bundles `functions/` into the deployment, so the
Basic Auth middleware ships with it. `--branch=staging` matches the project's production
branch, so the deploy becomes the **production** deployment that the custom domain serves.

Commit the workflow change together with Section 3, then push `staging`:

```bash
git add .github/workflows/deploy.yml
git commit -m "Deploy staging to Cloudflare internal project instead of GitHub Pages"
git push origin staging
```

Watch the run: `gh run watch --repo Aijwerkingen/aijwerkingen.github.io`.

## 7. Attach the custom domain `internal.aisafetywatch.com`

API (zone is on Cloudflare in the same account, so DNS is provisioned automatically):

```bash
curl -sS -X POST \
  "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/pages/projects/aisafetywatch-internal/domains" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"name":"internal.aisafetywatch.com"}'
```

> Dashboard fallback: project → Custom domains → Set up a custom domain →
> `internal.aisafetywatch.com` → accept the auto-created CNAME.
>
> If DNS is **not** auto-created, add a proxied CNAME `internal` →
> `aisafetywatch-internal.pages.dev` in the `aisafetywatch.com` zone.

Wait for the domain to show **Active** (TLS cert issued — usually a minute or two).

## 8. Retire the GitHub Pages exposure

The workflow no longer publishes to Pages, but the existing site stays live until Pages
is turned off. Disable it:

```bash
gh api -X DELETE repos/Aijwerkingen/aijwerkingen.github.io/pages
```

> Dashboard fallback: repo → Settings → Pages → Source → **None**.

Note: this is a `*.github.io` **org/user** Pages repo, so this takes down the org root
site `https://aijwerkingen.github.io`. That is intended.

---

## 9. Verification

```bash
PW='the shared password'

# Gate challenges anonymous requests:
curl -sI https://internal.aisafetywatch.com/ | grep -Ei 'HTTP/|www-authenticate'
#   expect: HTTP/2 401  +  www-authenticate: Basic realm="Internal preview"...

# Password-only works (blank username, ':' prefix):
curl -sI -u ":$PW" https://internal.aisafetywatch.com/ | grep -i 'HTTP/'
#   expect: HTTP/2 200

# Wrong password rejected:
curl -sI -u ":nope" https://internal.aisafetywatch.com/ | grep -i 'HTTP/'
#   expect: HTTP/2 401

# Static assets are ALSO gated (no leak via /_next/...):
curl -sI https://internal.aisafetywatch.com/_next/ | grep -i 'HTTP/'
#   expect: HTTP/2 401

# Production stays OPEN and untouched:
curl -sI https://aisafetywatch.com/ | grep -i 'HTTP/'
#   expect: HTTP/2 200 (no auth prompt)

# Old GitHub Pages URL no longer serves the survey:
curl -sI https://aijwerkingen.github.io/ | grep -i 'HTTP/'
#   expect: 404 / not the survey
```

Also open `https://internal.aisafetywatch.com` in a private browser window: the browser
prompts for username+password — leave username blank, enter the shared password, confirm
the survey loads.

## 10. Rollback

- **Re-open staging publicly:** delete the `INTERNAL_PASSWORD` secret and redeploy — the
  gate goes inert (`next()` passthrough).
- **Undo entirely:** `git revert` the two commits; remove the custom domain
  (`DELETE .../pages/projects/aisafetywatch-internal/domains/internal.aisafetywatch.com`);
  delete the project (`wrangler pages project delete aisafetywatch-internal`);
  re-enable GitHub Pages (restore old `deploy.yml`, or Settings → Pages → source `staging`).

## 11. Gotchas / operational notes

- **Password rotation:** re-run the Section 5 `secret put`, then trigger a redeploy
  (`gh workflow run` / push) — secrets apply on the next deployment, not retroactively.
- **"Logging out":** browsers cache Basic credentials for the origin until the window is
  closed; use a private window to re-test the prompt.
- **Sharing:** send guests the URL + the one password. Any username works; blank is fine.
- **Do not** merge `functions/_middleware.js`'s activation to production by setting
  `INTERNAL_PASSWORD` on the *main* project — that would lock `aisafetywatch.com`.
- The middleware runs ahead of static assets (Pages Functions precede asset serving), so
  HTML and `/_next/*` assets are equally protected — no `_routes.json` needed.
- Everything is HTTPS via Cloudflare; Basic Auth must never be served over plain HTTP.
```
