// functions/api/blog-edit.js
//
// Staging-only blog editing endpoint. Reads a post from the base branch and turns
// an edit into one commit on a new branch plus a pull request - never a direct
// commit to the base branch. It also resolves DOIs and PubMed IDs for the editor's
// "Add source" dialog.
//
//   GET  ?slug=<slug>                     -> { slug, sha, markdown }      (cookie required)
//   GET  ?cite=<doi|pmid|url>             -> CiteData                     (cookie required)
//   POST { slug, sha, markdown, name, summary, images? }
//                                         -> { prUrl, branch }
//
// Dead on production by construction: it requires BLOG_EDITOR_ENABLED=1, which is
// only set on the internal Pages project, plus GITHUB_TOKEN/GITHUB_REPO. Nothing
// here honours DISABLE_PRODUCTION_GATE - that pilot switch is for the /report
// survey only, and it must never unlock this.
//
// Everything runs server-side, so the browser never talks to GitHub or to
// doi.org: the CSP needs no api.github.com or doi.org entry (see
// src/app/layout.tsx), and no user-supplied URL is ever fetched.
//
// See docs/BLOG_EDITOR_PHASE2_PLAN.md sections 4.5 and 8.

const COOKIE = "report_access";
const FILE_PREFIX = "content/blog/";
// Slug-shaped only, so the path can never escape content/blog/ or name a
// directory. The path is always rebuilt server-side from this.
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_BYTES = 200 * 1024;
const MAX_NAME = 80;
const MAX_SUMMARY = 120;

const MAX_IMAGES = 10;
const MAX_IMAGE_BYTES = Math.round(1.5 * 1024 * 1024);
const MAX_IMAGES_TOTAL = 12 * 1024 * 1024;

const CITE_TIMEOUT_MS = 8000;
// Crossref asks for a contact address in the User-Agent ("polite pool"). No
// personal address is ever put here; CITE_CONTACT is unset unless the owner adds
// one.
const USER_AGENT = "internal-blog-editor (citation lookup)";
const DOI_PREFIXES = ["https://doi.org/", "http://doi.org/", "https://dx.doi.org/", "http://dx.doi.org/"];
const PUBMED_HOST = "https://pubmed.ncbi.nlm.nih.gov/";

export async function onRequestGet(context) {
  const { request, env } = context;

  const gate = await guarded(request, env);
  if (gate) return gate;

  const params = new URL(request.url).searchParams;

  // Citation lookup is dispatched before the post path: it takes no slug.
  if (params.has("cite")) return lookupCitation(env, params.get("cite") || "");

  const slug = params.get("slug") || "";
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

  const images = await validateImages(slug, body.images, markdown);
  if (images.error) return json({ error: images.error, path: images.path }, images.status);

  const path = `${FILE_PREFIX}${slug}.md`;
  const baseBranch = base(env);

  // Conflict check: the branch is created from the base branch as it is *now*,
  // so a file changed since the editor opened it must be refused rather than
  // silently overwritten.
  const current = await gh(env, "GET", `/contents/${path}?ref=${baseBranch}`);
  if (current.status === 404) return json({ error: "no-such-post" }, 404);
  if (!current.ok) return githubFailure("read", current.status);
  if (current.data?.sha !== sha) return json({ error: "conflict" }, 409);

  // A save that changes nothing (and adds no image) is not an edit.
  if (b64decode(current.data?.content ?? "") === markdown && images.entries.length === 0) {
    return json({ error: "no-changes" }, 422);
  }

  const head = await gh(env, "GET", `/git/ref/heads/${baseBranch}`);
  if (!head.ok) return githubFailure("base-ref", head.status);
  const baseCommit = head.data?.object?.sha;
  if (!baseCommit) return githubFailure("base-ref", head.status);

  const baseTree = await gh(env, "GET", `/git/commits/${baseCommit}`);
  if (!baseTree.ok) return githubFailure("commit", baseTree.status);
  const baseTreeSha = baseTree.data?.tree?.sha;
  if (!baseTreeSha) return githubFailure("commit", baseTree.status);

  // One commit for the markdown and every image, so a save is atomic: there is no
  // state in which the post references an image that is not in the tree.
  const tree = [];
  const markdownBlob = await gh(env, "POST", "/git/blobs", {
    content: b64encode(markdown),
    encoding: "base64",
  });
  if (!markdownBlob.ok) return githubFailure("blob", markdownBlob.status);
  tree.push({ path, mode: "100644", type: "blob", sha: markdownBlob.data?.sha });

  for (const image of images.entries) {
    const blob = await gh(env, "POST", "/git/blobs", {
      content: image.data,
      encoding: "base64",
    });
    if (!blob.ok) return githubFailure("blob", blob.status);
    tree.push({ path: image.path, mode: "100644", type: "blob", sha: blob.data?.sha });
  }

  const newTree = await gh(env, "POST", "/git/trees", { base_tree: baseTreeSha, tree });
  if (!newTree.ok) return githubFailure("tree", newTree.status);

  const fileNames = images.entries.map((image) => image.path.split("/").pop());
  const message = [
    `blog(${slug}): ${summary}`,
    "",
    `Edited via the internal blog editor by ${name}.`,
    ...(fileNames.length > 0
      ? ["", `Images: ${fileNames.length} added (${fileNames.join(", ")})`]
      : []),
  ].join("\n");

  const commit = await gh(env, "POST", "/git/commits", {
    message,
    tree: newTree.data?.sha,
    parents: [baseCommit],
  });
  if (!commit.ok) return githubFailure("commit", commit.status);

  const branch = await createBranch(env, slug, commit.data?.sha);
  if (typeof branch !== "string") return branch;

  const pr = await gh(env, "POST", "/pulls", {
    title: `Blog edit: ${slug} - ${summary}`,
    head: branch,
    base: baseBranch,
    body: [
      `Edited by **${name}** via the internal blog editor.`,
      "",
      `File: \`${path}\``,
      ...(fileNames.length > 0
        ? ["", `Images added: ${fileNames.map((fileName) => `\`${fileName}\``).join(", ")}`]
        : []),
      "",
      "Merging this redeploys the internal site. Publishing to production is the usual",
      "staging -> main PR.",
    ].join("\n"),
  });
  if (!pr.ok) return githubFailure("pull-request", pr.status);

  return json({ prUrl: pr.data?.html_url ?? "", branch });
}

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

const IMAGE_PATH_RE = (slug) =>
  new RegExp(`^public/blog/${slug}/[a-z0-9]+(?:-[a-z0-9]+)*-[0-9a-f]{8}\\.(webp|jpg)$`);

function isWebp(bytes) {
  return (
    bytes.length > 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && // RIFF
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50 // WEBP
  );
}

function isJpeg(bytes) {
  return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

/**
 * Checks every image the editor sent. Each one must live under the post's own
 * directory, carry magic bytes matching its extension, and be named after the
 * SHA-256 of its own contents - so the path in the Markdown can never point at
 * something other than what was uploaded, and a "replace" cannot silently reuse
 * a cached path.
 *
 * Returns `{ entries }` or `{ error, status, path }`.
 */
async function validateImages(slug, images, markdown) {
  if (images === undefined || images === null) return { entries: [] };
  if (!Array.isArray(images) || images.length > MAX_IMAGES) {
    return { error: "bad-image", status: 400, path: "" };
  }

  const pattern = IMAGE_PATH_RE(slug);
  const seen = new Set();
  const entries = [];
  let total = 0;

  for (const image of images) {
    const path = typeof image?.path === "string" ? image.path : "";
    const data = typeof image?.data === "string" ? image.data : "";
    const bad = () => ({ error: "bad-image", status: 400, path });

    if (!pattern.test(path) || path.includes("..") || seen.has(path)) return bad();
    seen.add(path);

    // The post must actually reference it, or the commit would add an orphan.
    if (!markdown.includes(path.slice("public".length))) return bad();

    let bytes;
    try {
      const binary = atob(data);
      bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    } catch {
      return bad();
    }
    if (bytes.length < 1) return bad();
    // Too big is not the same failure as malformed: the dialog says so differently.
    if (bytes.length > MAX_IMAGE_BYTES) return { error: "too-large", status: 413, path };

    const ext = path.slice(path.lastIndexOf(".") + 1);
    if (ext === "webp" ? !isWebp(bytes) : !isJpeg(bytes)) return bad();

    const nameHash = path.slice(path.lastIndexOf("-") + 1, path.lastIndexOf("."));
    if ((await sha256HexOfBytes(bytes)).slice(0, 8) !== nameHash) return bad();

    total += bytes.length;
    if (total > MAX_IMAGES_TOTAL) return { error: "too-large", status: 413, path };
    entries.push({ path, data });
  }

  return { entries };
}

// ---------------------------------------------------------------------------
// Citation lookup (doi.org and NCBI only)
// ---------------------------------------------------------------------------

/** Same rules as src/admin/blog-editor/cite.ts - keep the two in step. */
function parseCiteInput(raw) {
  const value = String(raw || "").trim();
  if (!value) return null;

  const decode = (input) => {
    try {
      return decodeURIComponent(input);
    } catch {
      return input;
    }
  };
  const trimTail = (input) => input.replace(/[.,;)\]]+$/, "");
  const isDoi = (input) => /^10\.\d{4,9}\/\S+$/.test(input);

  for (const prefix of DOI_PREFIXES) {
    if (value.toLowerCase().startsWith(prefix)) {
      const doi = trimTail(decode(value.slice(prefix.length)).trim());
      return isDoi(doi) ? { doi } : null;
    }
  }

  const doiPrefix = value.match(/^doi:\s*(.+)$/i);
  if (doiPrefix) {
    const doi = trimTail(doiPrefix[1].trim());
    return isDoi(doi) ? { doi } : null;
  }

  if (value.toLowerCase().startsWith(PUBMED_HOST)) {
    const pmid = value.slice(PUBMED_HOST.length).match(/^(\d{1,9})\/?/);
    return pmid ? { pmid: pmid[1] } : null;
  }

  const pmidPrefix = value.match(/^pmid:?\s*(\d{1,9})$/i);
  if (pmidPrefix) return { pmid: pmidPrefix[1] };

  if (isDoi(trimTail(value))) return { doi: trimTail(value) };
  if (/^\d{1,9}$/.test(value)) return { pmid: value };
  return null;
}

async function lookupCitation(env, input) {
  const parsed = parseCiteInput(input);
  if (!parsed) return json({ error: "bad-cite" }, 400);

  try {
    const cite = parsed.doi ? await fromDoi(env, parsed.doi) : await fromPubmed(env, parsed.pmid);
    if (!cite) return json({ error: "not-found" }, 404);
    return json(cite);
  } catch (err) {
    if (err && (err.name === "TimeoutError" || err.name === "AbortError")) {
      return json({ error: "timeout" }, 504);
    }
    return json({ error: "not-found" }, 404);
  }
}

function userAgent(env) {
  // Crossref's "polite pool" wants a contact address. Never hard-code one.
  return env.CITE_CONTACT ? `${USER_AGENT} mailto:${env.CITE_CONTACT}` : USER_AGENT;
}

/** One request covers Crossref, DataCite, arXiv and any other DOI registrar. */
async function fromDoi(env, doi) {
  const url = `https://doi.org/${encodeURIComponent(doi).replace(/%2F/g, "/")}`;
  const res = await fetch(url, {
    headers: { Accept: "application/vnd.citationstyles.csl+json", "User-Agent": userAgent(env) },
    signal: AbortSignal.timeout(CITE_TIMEOUT_MS),
  });
  if (!res.ok) return null;
  let data;
  try {
    data = await res.json();
  } catch {
    return null;
  }
  return normaliseCsl(data, doi);
}

async function fromPubmed(env, pmid) {
  const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=${encodeURIComponent(pmid)}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": userAgent(env) },
    signal: AbortSignal.timeout(CITE_TIMEOUT_MS),
  });
  if (!res.ok) return null;

  let data;
  try {
    data = await res.json();
  } catch {
    return null;
  }

  const item = data?.result?.[pmid];
  if (!item || data?.error) return null;

  const doi = (item.articleids || []).find((id) => id?.idtype === "doi")?.value;
  const fallback = {
    authors: (item.authors || []).map((author) => pubmedSurname(author?.name)),
    title: text(item.title, 500),
    container: text(item.fulljournalname || item.source),
    volume: text(item.volume),
    pages: pageRange(item.pages),
    year: (String(item.pubdate || "").match(/\d{4}/) || [""])[0],
    pmid: String(pmid),
    doi: doi ? text(doi) : undefined,
  };

  // A DOI gives more consistent fields (casing, page range, author particles), so
  // when there is one, prefer it and keep the PMID for the PubMed link.
  if (doi) {
    const better = await fromDoi(env, doi);
    if (better) return { ...better, pmid: String(pmid) };
  }
  return fallback;
}

/** CSL-JSON -> CiteData. Only these fields ever leave the worker. */
function normaliseCsl(data, fallbackDoi) {
  if (!data || typeof data !== "object") return null;

  const authors = (Array.isArray(data.author) ? data.author : [])
    .slice(0, 50)
    .map((author) => {
      if (!author || typeof author !== "object") return "";
      if (typeof author.literal === "string") return text(author.literal);
      if (typeof author.name === "string" && !author.family) return text(author.name);
      const particle = typeof author["non-dropping-particle"] === "string" ? author["non-dropping-particle"] : "";
      return [particle, text(author.family)].filter(Boolean).join(" ");
    })
    .filter(Boolean);

  const cite = {
    authors,
    title: text(data.title, 500),
    container: text(data["container-title"]) || text(data.publisher),
    volume: text(data.volume),
    pages: pageRange(data.page),
    year: year(data.issued),
    doi: text(data.DOI) || fallbackDoi,
  };

  if (!cite.title || !cite.container) {
    // Not enough to format a house-style entry; the dialog offers manual entry.
    if (!cite.title) return null;
  }
  return cite;
}

/** First value of a possibly-array field, tags stripped, entities decoded. */
function text(value, limit = 300) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string" && typeof raw !== "number") return "";
  return decodeEntities(String(raw))
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limit);
}

function decodeEntities(value) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
}

/** "224-226" -> "224–226" (the house style uses an en dash). */
function pageRange(value) {
  const pages = text(value);
  return pages.replace(/(\d)\s*[-–]\s*(\d)/g, "$1–$2");
}

function year(issued) {
  const parts = issued?.["date-parts"]?.[0];
  const first = Array.isArray(parts) ? parts[0] : undefined;
  return first === undefined || first === null ? "" : String(first).slice(0, 4);
}

/** PubMed writes "Bockting CL"; keep the surname, drop the trailing initials. */
function pubmedSurname(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  while (parts.length > 1 && /^[A-Z]{1,4}(?:-[A-Z]{1,4})?$/.test(parts[parts.length - 1])) parts.pop();
  return parts.join(" ");
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

async function sha256HexOfBytes(bytes) {
  const buf = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
