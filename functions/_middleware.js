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
