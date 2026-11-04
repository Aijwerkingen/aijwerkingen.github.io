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
