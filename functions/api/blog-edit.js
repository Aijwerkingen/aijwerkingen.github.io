// functions/api/blog-edit.js
//
// Staging-only blog editing endpoint. Reads a post from the base branch and
// turns an edit into a branch + pull request - never a direct commit.
//
//   GET  ?slug=<slug>                     -> { slug, sha, markdown }   (cookie required)
//   POST { slug, sha, markdown, name, summary }
//                                         -> { prUrl, branch }
//
// Dead on production by construction: it requires BLOG_EDITOR_ENABLED=1, which
// is only set on the internal Pages project, plus GITHUB_TOKEN/GITHUB_REPO.
// Nothing here honours DISABLE_PRODUCTION_GATE - that pilot switch is for the
// /report survey only, and it must never unlock this.
//
// Git operations run server-side, so the browser never talks to GitHub: the CSP
// needs no api.github.com entry (see src/app/layout.tsx).
//
// See docs/BLOG_EDITOR_PLAN.md.

const COOKIE = "report_access";
const FILE_PREFIX = "content/blog/";
// Slug-shaped only, so the path can never escape content/blog/ or name a
// directory. The path is always rebuilt server-side from this.
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_BYTES = 200 * 1024;
const MAX_NAME = 80;
const MAX_SUMMARY = 120;

export async function onRequestGet(context) {
  const { request, env } = context;

  const gate = await guarded(request, env);
  if (gate) return gate;

  const slug = new URL(request.url).searchParams.get("slug") || "";
  if (!SLUG_RE.test(slug) || slug === "readme") {
    return json({ error: "bad-slug" }, 400);
  }

  const file = await gh(env, "GET", `/contents/${FILE_PREFIX}${slug}.md?ref=${base(env)}`);
  if (file.status === 404) return json({ error: "no-such-post" }, 404);
  if (!file.ok) return githubFailure("read", file.status);

  return json({
    slug,
    sha: file.data?.sha ?? "",
    markdown: b64decode(file.data?.content ?? ""),
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const gate = await guarded(request, env);
  if (gate) return gate;

  // CSRF belt and braces on top of the SameSite=Strict cookie: only a JSON body
  // from this exact origin can drive a write.
  const contentType = request.headers.get("Content-Type") || "";
  const origin = request.headers.get("Origin") || "";
  if (!contentType.startsWith("application/json") || origin !== new URL(request.url).origin) {
    return json({ error: "forbidden" }, 403);
  }

  let body = null;
  try {
    body = await request.json();
  } catch {
    /* malformed body -> handled by the validation below */
  }
  if (!body || typeof body !== "object") return json({ error: "bad-request" }, 400);

  const slug = typeof body.slug === "string" ? body.slug : "";
  if (!SLUG_RE.test(slug) || slug === "readme") {
    return json({ error: "bad-slug" }, 400);
  }

  const sha = typeof body.sha === "string" ? body.sha : "";
  if (!/^[0-9a-f]{40}$/.test(sha)) return json({ error: "bad-sha" }, 400);

  const markdown = typeof body.markdown === "string" ? body.markdown : "";
  if (!markdown || !/^---\r?\n/.test(markdown)) {
    return json({ error: "bad-markdown" }, 400);
  }
  if (new TextEncoder().encode(markdown).length > MAX_BYTES) {
    return json({ error: "too-large" }, 413);
  }

  const name = clean(body.name, MAX_NAME);
  if (!name) return json({ error: "bad-name" }, 400);
  const summary = clean(body.summary, MAX_SUMMARY) || "Edit";

  const path = `${FILE_PREFIX}${slug}.md`;
  const baseBranch = base(env);

  // Conflict check: the branch is created from the base branch as it is *now*,
  // so a file changed since the editor opened it must be refused rather than
  // silently overwritten.
  const current = await gh(env, "GET", `/contents/${path}?ref=${baseBranch}`);
  if (current.status === 404) return json({ error: "no-such-post" }, 404);
  if (!current.ok) return githubFailure("read", current.status);
  if (current.data?.sha !== sha) return json({ error: "conflict" }, 409);
  if (b64decode(current.data?.content ?? "") === markdown) {
    return json({ error: "no-changes" }, 422);
  }

  const head = await gh(env, "GET", `/git/ref/heads/${baseBranch}`);
  if (!head.ok) return githubFailure("base-ref", head.status);
  const baseCommit = head.data?.object?.sha;
  if (!baseCommit) return githubFailure("base-ref", head.status);

  const branch = await createBranch(env, slug, baseCommit);
  if (typeof branch !== "string") return branch;

  const message = `blog(${slug}): ${summary}\n\nEdited via the internal blog editor by ${name}.`;
  const commit = await gh(env, "PUT", `/contents/${path}`, {
    message,
    content: b64encode(markdown),
    sha,
    branch,
  });
  if (!commit.ok) return githubFailure("commit", commit.status);

  const pr = await gh(env, "POST", "/pulls", {
    title: `Blog edit: ${slug} - ${summary}`,
    head: branch,
    base: baseBranch,
    body: [
      `Edited by **${name}** via the internal blog editor.`,
      "",
      `File: \`${path}\``,
      "",
      "Merging this redeploys the internal site. Publishing to production is the usual",
      "staging -> main PR.",
    ].join("\n"),
  });
  if (!pr.ok) return githubFailure("pull-request", pr.status);

  return json({ prUrl: pr.data?.html_url ?? "", branch });
}

// ---------------------------------------------------------------------------
// Gate + helpers below are shared by both handlers and deliberately mirror
// functions/api/report-access.js so the cookie value matches exactly. Keep
// `accessToken`, `sha256Hex` and `cookieValue` byte-for-byte identical to that
// file - if one drifts, an unlock on /report stops unlocking the editor.
// ---------------------------------------------------------------------------

/**
 * Returns a Response to send instead of running the handler, or null to proceed.
 * Unset configuration answers 404 (not 401): on production this endpoint should
 * not appear to exist at all.
 */
async function guarded(request, env) {
  if (env.BLOG_EDITOR_ENABLED !== "1" || !env.GITHUB_TOKEN || !env.GITHUB_REPO) {
    return json({ error: "not-found" }, 404);
  }
  const token = await accessToken(env.INTERNAL_PASSWORD);
  if (!token || cookieValue(request, COOKIE) !== token) {
    return json({ error: "locked" }, 401);
  }
  return null;
}

function base(env) {
  return env.GITHUB_BASE_BRANCH || "staging";
}

/** Strips control characters and newlines; caps the length. */
function clean(value, max) {
  if (typeof value !== "string") return "";
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

/**
 * Creates `blog-edit/<slug>-<UTC stamp>` from `baseCommit`. Returns the branch
 * name, or a Response on failure. A name collision (two edits in the same
 * second) gets one retry with a -2 suffix.
 */
async function createBranch(env, slug, baseCommit) {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, "").replace(/(\d{8})(\d{6})/, "$1-$2");
  for (const suffix of ["", "-2"]) {
    const branch = `blog-edit/${slug}-${stamp}${suffix}`;
    const res = await gh(env, "POST", "/git/refs", {
      ref: `refs/heads/${branch}`,
      sha: baseCommit,
    });
    if (res.ok) return branch;
    if (res.status !== 422) return githubFailure("branch", res.status);
  }
  return githubFailure("branch", 422);
}

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

/**
 * A GitHub failure the caller can act on - never the token, never GitHub's
 * response body (it can echo request content). The status goes to the Pages log
 * instead.
 */
function githubFailure(step, status) {
  console.error(`blog-edit: github step=${step} status=${status}`);
  return json({ error: "github", step }, 502);
}

// GitHub returns file content base64-encoded; atob/btoa alone corrupt non-ASCII
// text (curly quotes, em dashes), so both directions go through UTF-8 bytes.
const b64decode = (b64) =>
  new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\n/g, "")), (c) => c.charCodeAt(0)));

function b64encode(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin);
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
