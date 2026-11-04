# Qualtrics integration runbook (Mode A)

Step-by-step, from **creating the survey in Qualtrics** to it being **live and detecting completions inside the AIjwerkingen app**. This is the concrete "how" for spec §8.3. Do Part A in Qualtrics, Part B in the app, then Part C to test and launch.

> **Two accounts, two people.** A person with a Qualtrics account does Part A; an engineer does Part B. The implementing agent must **not** log into Qualtrics or accept its terms on your behalf - it prepares code/config and hands the Qualtrics UI steps to a human.

> **Where the data lives.** In Mode A the response data is stored **in Qualtrics**, not in our database. That makes Qualtrics a data processor for (potentially) health data - the DPA / EU-data-centre / sub-processor review (spec §13, decision D3) is a **blocking go-live check**. Confirm it before real reporting starts.

---

## Part A - Create & configure the survey in Qualtrics

### A1. Create the survey
1. Log in to Qualtrics → **Create project** → **Survey** (blank, from a copy, or from a file).
2. Name it (e.g. "AIjwerkingen – Report a side effect").

### A2. Build the questions
- Add your questions/blocks. (In Mode A the questions live here, not in our config file - that's the whole point of Mode A.)
- Keep it mobile-friendly; the survey will render inside an iframe on `/report`.

### A3. Survey Options - set these deliberately (important for a health/anonymous site)
Open **Survey Options** (a.k.a. survey settings):
- **Anonymize Responses = ON.** By default the anonymous link still records the respondent's **IP address and geolocation**. Turning on *Anonymize Responses* stops IP/location being tied to responses - required for our anonymous-by-default, data-minimising stance (spec §13). *(Note: this is not reversible for already-collected data, so set it before going live.)*
- **By Invitation Only = OFF.** If this is on, the anonymous link shows "This survey can only be taken by invitation." It must be off (i.e. *Available to anyone*) for the embed to work.
- **Prevent Multiple Submissions** - decide per requirements. For open public reporting you may leave it off (a person could legitimately report more than one event); if on, it uses a browser cookie, which is weak. Do not rely on it for integrity.
- **Allow respondents to finish later** - off is simpler for an embedded single-session form; on can cause "link opens mid-survey" surprises during testing (see Troubleshooting).

### A4. (Optional) Correlation ID via Embedded Data
Only if you have a documented lawful reason to link a submission back to a first-party record (spec §8.3 - prefer **not** to). If you do:
1. **Survey flow** → add an **Embedded Data** element at the very top; add a field named e.g. `first_party_id` with **no value** (value comes from the URL).
2. The app passes it as a URL parameter on the iframe src: `...?first_party_id=OPAQUE_ID`. Use an **opaque, non-identifying** token only - never PII, never a raw email (spec Privacy rules: no PII in URLs).

### A5. Add completion detection (postMessage to the parent app)
So the app knows the survey was submitted (to show a thank-you and fire an analytics event), have Qualtrics post a message to the parent window on the **final** screen.
1. Edit the **last question** of the survey (or a dedicated final text/graphic question).
2. Open its **JavaScript** editor and add:

```javascript
Qualtrics.SurveyEngine.addOnload(function () {
  /* runs when the final page is shown */
  try {
    // Post ONLY to the known parent origin - never "*".
    var PARENT_ORIGIN = "https://YOUR-FINAL-DOMAIN";  // = site.config.canonicalUrl
    window.parent.postMessage(
      { sender: "aijwerkingen-survey", event: "completed" },
      PARENT_ORIGIN
    );
  } catch (e) { /* no-op */ }
});
```

- Targeting a **specific `PARENT_ORIGIN`** (not `"*"`) is the secure form. Update it when the final domain is chosen (spec §5.1).
- Alternative trigger: attach to the final **Next/Submit** button click instead of `addOnload`, if you want the signal exactly on submit. `addOnload` on the End-of-Survey confirmation page is the simplest reliable option.

### A6. Publish & activate
1. Click **Publish**. The first publish **activates** the survey (it can now collect responses). Add a version description (e.g. "v1 initial").
2. Remember: **edits are not live until you Publish again.** The survey link never changes on republish.

### A7. Get the embeddable link (Anonymous Link)
1. Go to the **Distributions** tab.
2. Choose **Get a single reusable link** (a.k.a. the **Anonymous Link** - same thing, name varies by screen).
3. **Copy** the URL. It looks like `https://YOURBRAND.eu.qualtrics.com/jfe/form/SV_xxxxxxxx`.
4. **Confirm the data-centre region** in the host (e.g. `*.eu.qualtrics.com` for EU). This matters for data residency (spec §13/ADR-006).

You now have the two values the app needs:
- **Anonymous link URL** → `QUALTRICS_SURVEY_URL`
- **Qualtrics origin** (scheme + host, e.g. `https://YOURBRAND.eu.qualtrics.com`) → `QUALTRICS_ORIGIN`

---

## Part B - Integrate into the AIjwerkingen app

### B1. Configuration
Set env vars (spec `.env.example`):
```
SURVEY_PROVIDER="qualtrics"
QUALTRICS_SURVEY_URL="https://uva.fra1.qualtrics.com/jfe/form/SV_1zdQGq7PaFsv2Jg"
QUALTRICS_ORIGIN="https://uva.fra1.qualtrics.com"
```
> Current instance: UvA's EU datacenter is served from `*.fra1.qualtrics.com`
> (Frankfurt), not the `*.eu.qualtrics.com` brand form - both are EU regions.
`SURVEY_PROVIDER="qualtrics"` selects Mode A; the `/report` page renders the Qualtrics provider (spec §8.1–8.2). Switching to Mode B later is just changing this value + redeploy.

### B2. Content-Security-Policy - allow the Qualtrics frame
The app's CSP must permit framing the specific Qualtrics origin, and nothing broader:
```
Content-Security-Policy: ... frame-src https://*.qualtrics.com; ...
```
Prefer the exact host (`https://YOURBRAND.eu.qualtrics.com`) over the wildcard where possible. Also keep `frame-ancestors 'self'` so *our* site can't be framed by others (spec §12). If the iframe renders blank, CSP or the survey's own embedding settings are the usual cause (see Troubleshooting).

### B3. The embed component (responsive iframe)
Illustrative React/Next component for `/report` in Mode A:

```tsx
"use client";
import { useEffect, useState } from "react";

export function QualtricsEmbed({
  src, qualtricsOrigin,
}: { src: string; qualtricsOrigin: string }) {
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      // SECURITY: only trust messages from the known Qualtrics origin.
      if (event.origin !== qualtricsOrigin) return;
      const data = event.data;
      if (data && data.sender === "aijwerkingen-survey" && data.event === "completed") {
        setCompleted(true);
        // fire the privacy-first analytics "submission_completed" event here (spec §15)
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [qualtricsOrigin]);

  if (completed) {
    return <ThankYou />; // on-brand confirmation; no PII
  }

  return (
    <div className="qualtrics-embed">
      <iframe
        src={src}
        title="Report a suspected side effect"
        referrerPolicy="no-referrer"
        // size responsively via CSS; give it generous height
        style={{ width: "100%", minHeight: "80vh", border: 0 }}
        loading="lazy"
      />
      {/* Accessibility + resilience fallback (see B5) */}
      <p>
        Trouble with the form?{" "}
        <a href={src} target="_blank" rel="noopener noreferrer">
          Open it in a new tab
        </a>.
      </p>
    </div>
  );
}
```

Key points:
- **Validate `event.origin`** against `QUALTRICS_ORIGIN` before acting on any message - never trust `"*"`.
- Give the iframe an accessible **`title`** and `referrerPolicy="no-referrer"`.
- **Never append PII to `src`.** Only an opaque correlation token, and only if A4 was set up with a lawful basis.
- Size responsively; Qualtrics resizes its own content but the iframe needs room, especially on mobile.

### B4. Completion → thank-you + analytics
When the validated `completed` message arrives, show the thank-you state and fire the **"submission_completed"** conversion event (the same named event Mode B fires on server confirmation - spec §15), so analytics is mode-agnostic.

### B5. Accessibility fallback (required)
An embedded iframe can't be assumed WCAG AA-conformant, and the completion JS may not fire in every browser. Always provide the **"Open in a new tab"** direct link (shown above) and note the iframe caveat in the Accessibility Statement (spec §14).

---

## Part C - Test, then launch

### C1. Test the flow
- **Preview vs live:** test the *flow/rendering* with the Qualtrics **Preview** link (preview responses don't count against your quota and are flagged), but test the **actual embed + completion message** with the **Anonymous Link** in the app, because preview uses a different frame structure and the `postMessage` may not behave the same.
- **Completion:** complete the survey in the embedded iframe and confirm the app switches to the thank-you state and logs the analytics event.
- **Caching gotcha:** if you edited the survey and don't see changes, you likely didn't **Publish**, or your browser cached the old version - test in an **incognito/private window**.
- **Mobile:** verify iframe height/scroll on a real phone; confirm the survey doesn't try to open links in the same tab and lose the session.
- **Origin security:** confirm messages from any other origin are ignored (the `event.origin` check).

### C2. Launch checklist (Mode A, real data)
- [ ] **Qualtrics DPA / EU data-centre / sub-processors reviewed and approved** for health data (spec §13, D3) - **blocking**.
- [ ] **Anonymize Responses = ON**; no IP/geolocation tied to responses (unless a documented lawful basis says otherwise).
- [ ] By Invitation Only = OFF; anonymous link works in the embed.
- [ ] CSP `frame-src` scoped to the Qualtrics origin; `frame-ancestors 'self'` set.
- [ ] No PII in the iframe URL; correlation (if any) uses an opaque token with a lawful basis and is documented in the privacy notice.
- [ ] Completion detection validated (origin-checked) and wired to analytics.
- [ ] Accessibility fallback link present; caveat in the Accessibility Statement.
- [ ] `PARENT_ORIGIN` in the Qualtrics JS matches the **final** `site.config.canonicalUrl` (spec §5.1).

---

## Troubleshooting

| Symptom | Likely cause / fix |
|---------|--------------------|
| Iframe is **blank / refuses to load** | The parent CSP doesn't allow the Qualtrics origin in `frame-src`, or a browser/extension blocks third-party frames. Fix CSP (B2); test in a clean profile. |
| Survey shows **"can only be taken by invitation"** | *By Invitation Only* is ON. Turn it OFF (A3). |
| **Old version** of the survey appears | You didn't **Publish** after editing, or it's browser-cached. Publish; test in incognito (A6/C1). |
| **Completion event never fires** | The postMessage JS wasn't added to the *final* page, `PARENT_ORIGIN` doesn't match, or you're testing via the Preview link (different frame). Recheck A5; test with the Anonymous Link; confirm `event.origin` matches `QUALTRICS_ORIGIN`. |
| Link **opens mid-survey** during testing | *Allow respondents to finish later* saved progress via cookie. Use incognito, or turn it off (A3). |
| Response records **IP/location** you didn't want | *Anonymize Responses* was off when responses came in (not retroactively fixable). Turn it on before real launch (A3). |
| Embedded link inside the survey **navigates the same tab and loses data** | Force such links to open in a new tab; keep the survey the only thing in our iframe (spec §8.3). |

---

## How this maps to the phased plan
- **Phase 2** (spec §20) implements Part B (provider, iframe, origin-checked completion, CSP, a11y fallback) and can be tested against a throwaway test survey.
- The **real** survey (Part A) and the **Launch checklist** (C2) belong with **Phase 4/5**, because collecting real data is gated on the DPA/DPIA compliance review (D3/D4).
- Record progress and the D3 decision in `CHANGELOG.md`.
