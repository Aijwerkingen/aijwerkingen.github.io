# Plan: password-gate ONLY the `/report` survey embed (Level 2, edge-validated)

**Audience:** a cold agent with no prior context. Follow top to bottom.

> Supersedes the earlier "whole-site Basic Auth" plan, which was wrong: it gated
> the entire site and popped a browser username prompt (that work shipped as
> PR #38 and was reverted by PR #39). **Do not reintroduce a site-wide gate.**

---

## 0. Context

- **Repo:** `Aijwerkingen/aijwerkingen.github.io`. Git root is `aijwerkingen.github.io/`.
- **Stack:** Next.js 16, **static export** (`next.config.ts` → `output: "export"`),
  build `npm run build`, output `out/`, Node 24.
- **Deploys:**
  - `main` → Cloudflare Pages → `aisafetywatch.com`. `/report` there shows a
    **"The reporting form launches soon"** placeholder (no survey).
  - `staging` → Cloudflare Pages → **`internal.aisafetywatch.com`**. `/report`
    there embeds the Qualtrics survey in an iframe. **This is the deploy we change.**
    Because it's Cloudflare Pages, **Pages Functions are available** (Level 2 works).
- **Survey embed:** `src/app/report/page.tsx`. On `staging` it renders an `<iframe>`
  pointing at a Qualtrics URL (currently a hard-coded/`NEXT_PUBLIC_` fallback) and an
  "open in a new tab" link with the same URL.

## 1. Goal — exact behavior

`/report` must be gated by a **single shared password**; **nothing else** on the
site changes (home, about, blog, … stay fully public).

- **Default / wrong / no password:** `/report` shows the **`main` placeholder**
  ("The reporting form launches soon"). No 401, **no browser username dialog**.
- **Correct password:** the Qualtrics **iframe** appears in place.
- **The Qualtrics URL must NOT be in the static bundle** — it is served by an edge
  Function only after the password is verified. (Otherwise the "gate" is pointless:
  the URL is a public Qualtrics link reachable directly.)

## 2. Design

- A **Cloudflare Pages Function** `functions/api/report-access.js` holds the password
  (`INTERNAL_PASSWORD`) and the survey URL (`QUALTRICS_SURVEY_URL`) as **project env**,
  never in the bundle.
  - `POST {password}` → correct: set an httpOnly cookie + return `{ url }`; wrong: `401`.
  - `GET` → valid cookie: return `{ url }`; else `401`.
- `/report` becomes: server page renders the **placeholder** by default and mounts a
  small **client component** (`ReportGate`) that, on load, `GET`s the endpoint — if
  unlocked it swaps in the iframe; otherwise it shows the placeholder plus a password
  field. Submitting `POST`s the password.
- **Fail-safe:** if `INTERNAL_PASSWORD` is unset (or the site is served somewhere with
  no Functions, e.g. plain static), `GET`/`POST` never return a URL → the page stays on
  the placeholder. Safe by construction.

**Repo guardrails (will break `npm run build` if ignored):**
- `tsconfig.json` `include` globs `**/*.ts` → write the Function as **`.js`** (not `.ts`).
- `eslint.config.mjs` bans literals like `aisafetywatch`, `github.io`, `lareb`… and
  `next build` runs lint. Keep **no** such literals in `functions/**` or `src/**`, and
  **eslint-ignore `functions/**`**. (The Qualtrics URL is not a banned literal, but we
  remove it from `src` anyway so it isn't bundled.)
- CSP in `src/app/layout.tsx` already allows the same-origin fetch
  (`connect-src 'self'`) and the iframe (`frame-src https://*.qualtrics.com`) — **no CSP
  change needed.** Verify these lines still exist before finishing.

---

## 3. Repo changes (branch: `staging`)

### 3a. NEW `functions/api/report-access.js`

```js
// functions/api/report-access.js
//
// Edge gate for the /report survey embed. The Qualtrics URL is NEVER in the
// static bundle — it lives only in this Function's env and is returned only
// after the shared password is verified. Only /report is affected; the rest of
// the site is untouched.
//
//   POST { password }  -> correct: Set-Cookie(report_access) + { url }
//                         wrong:   401
//   GET                -> valid cookie: { url }   else 401

const COOKIE = "report_access";

export async function onRequestGet(context) {
  const { request, env } = context;
  const token = await accessToken(env.INTERNAL_PASSWORD);
  if (token && cookieValue(request, COOKIE) === token) {
    return json({ url: env.QUALTRICS_SURVEY_URL });
  }
  return json({ error: "locked" }, 401);
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env.INTERNAL_PASSWORD) return json({ error: "not-configured" }, 503);

  let password = "";
  try {
    const body = await request.json();
    password = typeof body?.password === "string" ? body.password : "";
  } catch {
    /* malformed body -> treated as empty */
  }

  if (await timingSafeEqual(password, env.INTERNAL_PASSWORD)) {
    const token = await accessToken(env.INTERNAL_PASSWORD);
    return json({ url: env.QUALTRICS_SURVEY_URL }, 200, {
      // Path=/ so the cookie is also sent to /api/report-access on later GETs.
      "Set-Cookie": `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=43200`,
    });
  }
  return json({ error: "wrong-password" }, 401);
}

function json(obj, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...extraHeaders },
  });
}

function cookieValue(request, name) {
  const raw = request.headers.get("Cookie") || "";
  for (const part of raw.split(/;\s*/)) {
    const eq = part.indexOf("=");
    if (eq !== -1 && part.slice(0, eq) === name) return part.slice(eq + 1);
  }
  return "";
}

// Opaque, unforgeable cookie value derived from the secret (not the secret itself).
async function accessToken(secret) {
  return secret ? sha256Hex("report-access:" + secret) : "";
}

async function sha256Hex(s) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function timingSafeEqual(a, b) {
  const [ah, bh] = await Promise.all([sha256Hex(a), sha256Hex(b)]);
  let diff = 0;
  for (let i = 0; i < ah.length; i++) diff |= ah.charCodeAt(i) ^ bh.charCodeAt(i);
  return diff === 0;
}
```

### 3b. NEW `src/app/report/ReportGate.tsx` (client component)

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type GateState =
  | { status: "loading" }
  | { status: "locked"; error?: string }
  | { status: "unlocked"; url: string };

export function ReportGate() {
  const [state, setState] = useState<GateState>({ status: "loading" });
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/report-access", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((d) => alive && setState({ status: "unlocked", url: d.url }))
      .catch(() => alive && setState({ status: "locked" }));
    return () => {
      alive = false;
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const r = await fetch("/api/report-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ password }),
      });
      if (r.ok) {
        const d = await r.json();
        setState({ status: "unlocked", url: d.url });
      } else {
        setState({ status: "locked", error: "That password didn’t work." });
      }
    } catch {
      setState({ status: "locked", error: "Something went wrong. Please try again." });
    } finally {
      setSubmitting(false);
      setPassword("");
    }
  }

  if (state.status === "unlocked") {
    return (
      <>
        <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
          <iframe
            src={state.url}
            title="Experience report form"
            className="h-[900px] w-full"
            referrerPolicy="no-referrer"
            allowFullScreen={false}
            sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
          />
        </div>
        <p className="mt-4 text-sm text-ink-soft">
          Form not loading, or prefer a full page?{" "}
          <a href={state.url} target="_blank" rel="noopener noreferrer" className="link">
            Open it in a new tab
          </a>
          .
        </p>
      </>
    );
  }

  // loading OR locked -> render the public "launches soon" placeholder (= main),
  // plus the password field so the team can unlock the embed.
  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-surface p-10 text-center shadow-sm">
      <h2 className="text-xl font-semibold">The reporting form launches soon</h2>
      <p className="mx-auto mt-3 max-w-xl text-ink-soft">
        The public reporting platform is nearly ready. When it launches, the anonymous
        report form will appear on this page. Until then, you can read about what we are
        building in the{" "}
        <Link href="/blog/launching-soon-report-ai-side-effects" className="link">
          launch announcement
        </Link>
        .
      </p>

      {state.status === "locked" && (
        <form onSubmit={onSubmit} className="mx-auto mt-8 flex max-w-sm flex-col gap-3">
          <label htmlFor="report-pw" className="text-sm text-ink-soft">
            Team preview password
          </label>
          <input
            id="report-pw"
            type="password"
            autoComplete="off"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-line bg-canvas px-3 py-2"
          />
          <button
            type="submit"
            disabled={submitting || password.length === 0}
            className="rounded-lg bg-accent px-4 py-2 font-medium text-white disabled:opacity-50"
          >
            {submitting ? "Checking…" : "Unlock preview"}
          </button>
          {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        </form>
      )}
    </div>
  );
}
```

> Match the exact class names / button styles to the project's design system if they
> differ; the structure above is what matters. Reuse the `main` placeholder copy verbatim
> so the locked state is pixel-identical to production.

### 3c. EDIT `src/app/report/page.tsx`

- Remove the `QUALTRICS_SURVEY_URL` constant and the inline `<iframe>` / "open in a new
  tab" block (they move into `ReportGate`).
- Remove the now-unused `NEXT_PUBLIC_QUALTRICS_SURVEY_URL` reference.
- Import and render `<ReportGate />` where the iframe block used to be. Keep the header
  `<section>` and the `CrisisHelpline` notice exactly as they are.
- Optional: set `metadata.description` to the `main` "launches soon" copy so crawlers/SEO
  see the public state (the survey never renders server-side anyway).

Resulting body sketch:

```tsx
import type { Metadata } from "next";
import { siteConfig } from "@/site.config";
import { CrisisHelpline } from "@/components/CrisisHelpline";
import { ReportGate } from "./ReportGate";

export const metadata: Metadata = {
  title: "Report your experience",
  description:
    "The public reporting platform launches soon. When it is live, the anonymous report form will appear here.",
  alternates: { canonical: "/report" },
};

export default function ReportPage() {
  // ...unchanged JSON-LD + <section> header + CrisisHelpline notice...
  // then, in place of the old iframe block:
  //   <ReportGate />
}
```

### 3d. EDIT `eslint.config.mjs` — ignore `functions/**`

Add `"functions/**"` to the `globalIgnores([...])` array.

### 3e. EDIT `tsconfig.json` — exclude `functions`

`"exclude": ["node_modules", "functions"]`.

### 3f. EDIT `.env.example`

Replace the `NEXT_PUBLIC_QUALTRICS_SURVEY_URL` entry with a note that the survey URL is
now a **server-side** Pages env var `QUALTRICS_SURVEY_URL` (not `NEXT_PUBLIC_`, so it is
never bundled), set on the Cloudflare project — see Section 4.

### 3g. Build locally — must pass

```bash
npm ci
npm run build   # next lint + type-check + static export must all pass
```

---

## 4. Cloudflare project config (the `staging` / internal.aisafetywatch.com project)

Set two env vars on the Pages project that serves `internal.aisafetywatch.com`
(Production environment, since the custom domain serves production):

```bash
export CLOUDFLARE_API_TOKEN=***      # Pages:Edit
export CLOUDFLARE_ACCOUNT_ID=***
PROJECT=<the staging pages project name>   # e.g. aisafetywatch-internal

printf '%s' "$INTERNAL_PASSWORD" | \
  npx wrangler@latest pages secret put INTERNAL_PASSWORD --project-name="$PROJECT"

printf '%s' "$QUALTRICS_SURVEY_URL" | \
  npx wrangler@latest pages secret put QUALTRICS_SURVEY_URL --project-name="$PROJECT"
```

`QUALTRICS_SURVEY_URL` value = the real survey link. Current value:
`https://uva.fra1.qualtrics.com/jfe/form/SV_1zdQGq7PaFsv2Jg` (UvA EU / Frankfurt
instance).

> Dashboard fallback: project → Settings → Variables and Secrets → add **encrypted**
> `INTERNAL_PASSWORD` and `QUALTRICS_SURVEY_URL` (Production). Secrets apply on the next
> deploy.

## 5. Deploy

Push `staging`; the existing pipeline builds and deploys to the Cloudflare project.
`wrangler pages deploy` (or the Git integration) automatically bundles `functions/`, so
`/api/report-access` ships with the build.

```bash
git add functions/api/report-access.js src/app/report/ReportGate.tsx \
        src/app/report/page.tsx eslint.config.mjs tsconfig.json .env.example
git commit -m "Gate /report survey embed behind shared password (edge-validated)"
git push origin staging
```

---

## 6. Verification

```bash
BASE=https://internal.aisafetywatch.com
PW='the shared password'

# Rest of the site stays public:
curl -sI "$BASE/" | grep -i 'HTTP/'                  # 200, no auth prompt
curl -sI "$BASE/about" | grep -i 'HTTP/'             # 200

# /report page itself loads publicly (placeholder), no username dialog:
curl -sI "$BASE/report" | grep -i 'HTTP/'            # 200

# The survey URL is NOT in the page HTML:
curl -s "$BASE/report" | grep -ci 'qualtrics'        # expect 0

# Endpoint is locked without the cookie:
curl -s "$BASE/api/report-access" | head             # {"error":"locked"} (401)

# Wrong password rejected:
curl -s -X POST "$BASE/api/report-access" \
  -H 'Content-Type: application/json' --data '{"password":"nope"}'   # 401

# Correct password returns the URL and sets the cookie:
curl -s -X POST "$BASE/api/report-access" \
  -H 'Content-Type: application/json' --data "{\"password\":\"$PW\"}" -i | head
#   expect: 200, Set-Cookie: report_access=...; and body {"url":"https://...qualtrics..."}
```

Browser check: open `$BASE/report` → placeholder + password field, no username dialog.
Enter the wrong password → still placeholder, inline error. Enter the correct password →
the Qualtrics iframe appears; reload → stays unlocked (cookie) with no re-entry.

## 7. Rollback

- Revert the commit (`git revert`), push. `/report` returns to the plain iframe (or
  restore `main`'s placeholder — your call).
- Or just remove `INTERNAL_PASSWORD` from the project and redeploy → `/report` stays on
  the placeholder for everyone (survey never unlocks).

## 8. Notes / gotchas

- **Only `/report` is affected.** Do **not** add a `functions/_middleware.js` (that gates
  the whole site and shows a browser username prompt — the reverted PR #38 mistake).
- **Password rotation:** re-run `pages secret put INTERNAL_PASSWORD`, redeploy. Existing
  cookies (derived from the old secret) stop matching automatically.
- **"Log out":** cookie is `Max-Age=43200` (12h) and `HttpOnly`; clear cookies or use a
  private window to re-lock sooner.
- **Sharing:** hand colleagues the URL + the one password; they type only a password
  (no username). They can also browse the rest of the site freely.
- The real survey lives on Qualtrics. This gate hides the *entry point*; for hard
  protection of the survey itself, also enable Qualtrics' own Survey Password Protection.
```
