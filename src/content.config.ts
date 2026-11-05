// content.config.ts — the ONE place every word of user-facing copy lives.
//
// site.config.ts owns IDENTITY (brand name, domain, contacts, research/legal
// flags). This file owns COPY: page headings, body text, FAQ answers, button
// labels, the crisis notice, the llms.txt blurb — everything a reader sees.
//
// Editing copy is a one-file change here; no component edits needed. Sentences
// that carry a link or the brand name are written as `Span[]` (see
// src/content/rich.ts) and rendered by <Prose>/<RichLine>; everything else is a
// plain string. Blog posts are the one exception — they stay authored as
// Markdown in content/blog/*.md (already fully externalised).

import { siteConfig } from "@/site.config";
import { a, b, brand, h2, p, ul, type Block, type Span } from "@/content/rich";

/* ═══════════════════════════════════════════════════════════════════════════
   FILL-IN BLANKS
   ───────────────────────────────────────────────────────────────────────────
   The launch checklist of values still to be decided/confirmed. Anything left
   blank here is OMITTED from the rendered page (never shown as a placeholder),
   exactly like the identity blanks in site.config.ts.

   ▸ IDENTITY blanks (legal entity, institution, principal investigator, ethics
     approval, DPO email, phone, postal address, legal sign-off) live in
     src/site.config.ts — fill them there.

   ▸ The COPY blanks below are specifics the legal drafts currently assert as
     PROPOSALS. They are redline targets for the DPO/legal owner and take effect
     visibly only once site.config `legal.approved` is flipped to true.
   ═══════════════════════════════════════════════════════════════════════════ */
export const fillIn = {
  /** Retention period stated in the privacy notice. ← DECIDE (e.g. "5 years"). */
  retentionPeriod: "five years",
  /** Survey/data processor named in the privacy notice. ← CONFIRM against the DPA. */
  dataProcessor: "Qualtrics",
  /** Where report data is stored. ← CONFIRM against the processor's tenant/region. */
  storageRegion: "European Economic Area",
  /** National data-protection supervisory authority (for complaints). */
  supervisoryAuthority: {
    name: "Autoriteit Persoonsgegevens",
    url: "https://autoriteitpersoonsgegevens.nl",
  },
  /** Primary crisis line named in prose fallbacks (NL default). */
  crisisLine: {
    name: "113 Zelfmoordpreventie",
    dial: "call 113 or 0800-0113",
    url: "https://www.113.nl",
  },
};

/* Derived contacts — computed from site.config so copy can't drift from it. */
/** Named data controller: the institution once set, otherwise the brand. */
const controller = siteConfig.research.institution || siteConfig.name;

const CTA_REPORT = { label: "Report your experience", href: "/report" };

export const content = {
  /* ── Global descriptors (SEO / meta) ─────────────────────────────────────
     The home <title>/template are built from the brand name in layout.tsx;
     this is the default description and every per-page title + description. */
  meta: {
    /** Brand-agnostic descriptor: home <title> and OG image alt are "<brand> - <this>". */
    descriptor: "Global registry for possible adverse effects of AI tools",
    defaultDescription:
      "Global reporting center for the psychological effects of AI technology. It records possible adverse effects of AI tools, including ones that only emerge later.",
    pages: {
      home: {
        // Intentionally no `title`: the home page inherits the layout default
        // ("<brand> - <descriptor>"). An empty string here suppresses <title>.
        description:
          "Global reporting center for the psychological effects of AI technology. Report any subjective experience you have after any AI exposure or interaction. It records possible adverse effects of AI tools, including ones that only emerge later.",
      },
      about: {
        title: "About",
        description:
          "Who is behind this reporting platform, how reports are used, and the research governance it operates under.",
      },
      howItWorks: {
        title: "How reporting works",
        description:
          "What happens when you report a psychological effect of AI: what you're asked, what we store, and what your report contributes to. Effects that seem fine at first can still be reported.",
      },
      faq: {
        title: "FAQ",
        description:
          "Answers to common questions about reporting experiences of psychological effects after AI exposure or interaction: what to report, privacy, what happens next, and who can report. Includes effects that seemed fine at first but may prove adverse later.",
      },
      blog: {
        title: "Blog",
        description:
          "Relevant articles and updates on the global reporting center for the psychological effects of AI technology. Includes work on possible adverse effects of AI tools.",
      },
      report: {
        title: "Report your experience",
        description:
          "The public reporting platform launches soon. When it is live, the report form will appear here.",
      },
      helplines: {
        title: "Crisis helplines & resources",
        description:
          "A directory of verified crisis helplines and mental-health resources worldwide. If you are in crisis, help is available.",
      },
      contact: {
        title: "Contact",
        description:
          "How to reach us with questions about the platform, your data, or the research. Not a route for emergencies or crisis support.",
      },
      privacy: {
        title: "Privacy notice",
        description:
          "What we collect when you report an experience linked to an AI tool or system, why, how long we keep it, and your rights.",
      },
      terms: {
        title: "Terms & disclaimer",
        description:
          "The terms on which this reporting platform is offered, including what it is not: a crisis service, a source of medical advice, or a complaints channel.",
      },
      accessibility: {
        title: "Accessibility statement",
        description:
          "How accessible this platform is, the standard we aim to meet, the limitations we know about, and how to report a barrier.",
      },
    },
  },

  /* ── Header + footer navigation ──────────────────────────────────────────── */
  nav: [
    { href: "/about", label: "About" },
    { href: "/blog", label: "Blog" },
    { href: "/faq", label: "FAQ" },
  ],
  header: {
    skipToContent: "Skip to content",
    reportCta: "Report your experience",
    reportCtaShort: "Report",
  },
  footerNav: {
    Site: [
      { href: "/", label: "Home" },
      { href: "/about", label: "About" },
      { href: "/how-it-works", label: "How it works" },
      { href: "/blog", label: "Blog" },
      { href: "/faq", label: "FAQ" },
      { href: "/report", label: "Report your experience" },
      { href: "/helplines", label: "Crisis helplines" },
    ],
    Legal: [
      { href: "/privacy", label: "Privacy notice" },
      { href: "/terms", label: "Terms & disclaimer" },
      { href: "/accessibility", label: "Accessibility" },
      { href: "/contact", label: "Contact" },
    ],
  },
  /** Footer provenance sentence (rendered only when research.institution is set). */
  footerProvenanceLead: "A research instrument from ",

  /* ── Dynamic crisis notice (footer + report page) ─────────────────────────
     The component fills country/helpline in at runtime; these are its fixed
     phrases. */
  crisis: {
    notCrisis: "Not a crisis service.",
    dangerLead:
      "If you or someone else is in immediate danger, contact your local emergency number",
    inCountryPrefix: "In",
    support: "offers free, confidential crisis support.",
    detectedNote: "Country detected automatically.",
    seeAll: "See all helplines →",
    chooseCountryTitle: "Click to choose your country",
    searchPlaceholder: "Search country…",
    noMatch: "No match",
  },

  /* ── Home ─────────────────────────────────────────────────────────────────── */
  home: {
    hero: {
      title: "The global registry for possible adverse effects of AI tools",
      body: [
        brand,
        " is inspired by pharmacovigilance research and tracks possible adverse effects that individuals attribute to AI tools.",
      ] as Span[],
      detail:
        "We collect insights into experiences that may be, or may later turn out to be, harmful - including chatbot interactions, deepfake content, social media algorithms, AI surveillance, automated decision-making, and job displacement.",
      invite:
        "You are invited to report your own experience or to report on behalf of someone else. Submissions take a few minutes. All reports are encrypted and handled to high privacy standards; no name or account is required.",
      ctas: [CTA_REPORT, { label: "Common questions", href: "/faq" }],
      chips: [
        "No account needed",
        "You can stop at any point",
        "Your words are enough",
      ],
    },
    partnersLabel: "Developed with",
    whatWeDo: {
      eyebrow: "What we do",
      title: "A report becomes part of a wider picture",
      cards: [
        {
          title: ["About ", brand] as Span[],
          body: [
            brand,
            " is a global registry for possible adverse effects of AI tools. It gives people a place to describe what they experienced after an AI exposure or interaction, in their own words and without needing to prove what caused it.",
          ] as Span[],
        },
        {
          title: "What we do with your report",
          body: [
            "We review the information you choose to share and look for patterns across reports. A single report may describe one person's experience; together, reports can show where further attention or investigation is needed. We do not provide a diagnosis, emergency response, or individual medical advice.",
          ] as Span[],
        },
        {
          title: "What research we do",
          body: [
            "We study reported possible adverse effects of AI tools through structured online questionnaires and analysis of aggregated patterns. This helps us understand what people are experiencing, identify questions that need closer study, and improve how the effects of AI are monitored over time.",
          ] as Span[],
        },
      ],
    },
    how: {
      eyebrow: "How it works",
      steps: [
        { title: "Select the AI technology" },
        {
          title:
            "Describe when and how the AI technology affected you.",
        },
        { title: "Indicate symptoms you experience" },
      ],
    },
  },

  /* ── How reporting works ──────────────────────────────────────────────────── */
  howItWorks: {
    header: {
      eyebrow: "How it works",
      title: "What happens to your report",
      intro:
        "Reporting takes a few minutes. Here is the whole of it, start to finish, so nothing is a surprise.",
    },
    // Also feeds the HowTo JSON-LD.
    steps: [
      {
        name: "Describe how you felt",
        text: "In your own words. Mild or overwhelming, during use or afterwards. You don't need clinical language, and you don't need to be sure the tool is to blame.",
      },
      {
        name: "Add any context you have",
        text: "Which tool or platform, and roughly when. An approximate name or a general description is enough. Everything beyond the essentials is optional.",
      },
      {
        name: "Submit with privacy protected",
        text: "No account, no name. Contact details are optional and only used if you invite follow-up questions. You can stop at any point before submitting.",
      },
      {
        name: "Your report joins the others",
        text: "It is reviewed alongside other reports to surface patterns that a single experience cannot show on its own.",
      },
    ],
    body: [
      h2("What we store"),
      p(
        "Only what is needed to understand the report: what you described, the tool or platform involved, and any optional context you chose to add. Your privacy is protected by default - we do not ask for your name and you do not need an account. If you supply contact details, they are optional, clearly marked, and used only for follow-up.",
      ),
      p(
        "The ",
        a("privacy notice", "/privacy"),
        " sets out the detail: purposes, retention, who processes the data, and your rights over it.",
      ),
      h2("What it does not do"),
      p(
        "Submitting a report does not contact the company involved on your behalf, does not produce a clinical assessment of your situation, and does not reach anyone in real time. This is not a crisis service - if you or someone else is in immediate danger, contact your local emergency number.",
      ),
    ] as Block[],
    cta: CTA_REPORT,
  },

  /* ── About ────────────────────────────────────────────────────────────────── */
  about: {
    header: {
      eyebrow: "About",
      title: "Why this exists",
      intro: [
        brand,
        " collects reports of possible adverse effects that people attribute to AI tools - from chatbots and social media algorithms to deepfakes, AI surveillance, automated decision-making, and job displacement - so that patterns can be studied rather than guessed at. An effect may feel helpful at first and only prove harmful later, which is why we ask for experiences, not proof.",
      ] as Span[],
    },
    body: [
      h2("The problem"),
      p(
        "When a medicine causes an unexpected effect, there is somewhere to report it, and those reports accumulate into evidence. When an AI tool or system affects someone - a chatbot, a social media algorithm, an automated decision - leaving them more anxious, more isolated, worse about their body, or unable to stop - there is usually nowhere for that to go. It stays a private experience, and nothing aggregates.",
      ),
      p(
        "That absence is the gap this platform addresses. Not by treating digital tools as if they were drugs, but by taking seriously that the effects linked to their use are real, reportable, and becomes legible once enough people describe it.",
      ),
      h2("What we do with reports"),
      p(
        "Reports are reviewed as part of ongoing monitoring for patterns across tools and platforms. A single report is not a diagnosis and is never treated as one - it is one account among many. What makes it valuable is the aggregate: recurring descriptions, from unrelated people, of the same kind of effect around the same kind of product.",
      ),
      p(
        "We collect as little as possible to do that. Your privacy is protected by default: reporting needs no account and asks for no name. Contact details are optional and only used if you invite follow-up.",
      ),
      h2("What this is not"),
      p(
        "This is not a crisis or emergency service, and reports are not read in real time. If you or someone else is in immediate danger, contact your local emergency number. In the Netherlands you can also reach ",
        a(fillIn.crisisLine.name, fillIn.crisisLine.url),
        " (" + fillIn.crisisLine.dial + ").",
      ),
      p(
        "It is also not a support service, a complaints channel to the companies involved, or a route to individual advice. Reporting here will not get you a clinical opinion about your own situation - if you need one, speak to a health professional.",
      ),
    ] as Block[],
    partners: {
      heading: "Who is behind this",
      body: [
        p(
          "This platform is developed by researchers at Amsterdam UMC and the University of Amsterdam. It is part of the research priority area ",
          a(
            siteConfig.researchPriorityArea.name,
            siteConfig.researchPriorityArea.url,
          ),
          " at the University of Amsterdam, which brings together research on how science and the public connect.",
        ),
      ] as Block[],
    },
    // Rendered only when the research provenance block is filled in.
    governance: {
      heading: "Governance",
      intro:
        "This platform is operated as a research instrument, under the following accountability:",
    },
    questions: [
      h2("Questions"),
      p(
        "The ",
        a("FAQ", "/faq"),
        " answers what to report, how your privacy is protected, and what happens next. For anything else, ",
        a("contact us", "/contact"),
        " - though please don’t use it for anything urgent.",
      ),
    ] as Block[],
  },

  /* ── Report ───────────────────────────────────────────────────────────────── */
  report: {
    header: {
      eyebrow: "Report",
      title: "Report your experience",
      intro:
        "Tell us how an AI tool or system has affected you. This takes a few minutes. You don’t need an account, you don’t need proof, and you can stop at any point.",
    },
    chips: [
      "High privacy standards",
      "No account required",
      "Contact details optional",
    ],
    gate: {
      launchTitle: "The reporting form launches soon",
      launchBody: [
        "The public reporting platform is nearly ready. When it launches, the report form will appear on this page. Until then, you can read about what we are building in the ",
        a("launch announcement", "/blog/launching-soon-report-ai-side-effects"),
        ".",
      ] as Span[],
      thanksTitle: "Thank you for your report",
      thanksBody:
        "Your experience has been recorded. Every report helps build a clearer picture of how AI can affect people’s wellbeing.",
      reportAnother: "Report another experience",
      needSupport: [
        "Need support right now? ",
        a("See crisis helplines", "/helplines"),
        ".",
      ] as Span[],
      // The link href is the live form URL, only known at runtime, so this line
      // is composed in the component rather than as a Span[].
      openInTab: {
        before: "Form not loading, or prefer a full page? ",
        link: "Open it in a new tab",
        after: ".",
      },
      iframeTitle: "Experience report form",
      // Internal team-preview gate.
      passwordLabel: "Team preview password",
      unlock: "Unlock preview",
      unlocking: "Checking…",
      wrongPassword: "That password didn’t work.",
      genericError: "Something went wrong. Please try again.",
    },
  },

  /* ── FAQ ──────────────────────────────────────────────────────────────────── */
  faq: {
    header: {
      eyebrow: "Questions",
      title: "Frequently asked questions",
      intro: [
        "Short, direct answers about reporting experiences linked to AI tools and systems with ",
        brand,
        ". Still unsure about something? ",
        a("Start a report", "/report"),
        " - you can stop at any point.",
      ] as Span[],
    },
    items: [
      {
        q: "What should I report?",
        a: "Anything you felt, noticed or experienced that seems linked to an AI tool or system - chatbots, social media algorithms, deepfakes, AI surveillance, automated decision-making, job displacement - during use or afterwards, including effects that seemed fine or helpful at first. An effect on your mood, anxiety, sleep, how you feel about yourself, or something you can't quite put a name to. Mild or strong, helpful or unsettling. You don't need proof of a link; noticing it is enough. If you're unsure whether it qualifies, report it anyway and let it be assessed.",
      },
      {
        q: "Which tools and platforms can I report?",
        a: "Any AI tool or system: chatbots, AI companions and assistants, deepfake content, social media algorithms, AI surveillance, automated decision-making, or AI-driven job displacement. It helps to include as much detail as you have - the app or platform name, and roughly when it happened - but an approximate name or description is enough to start a report.",
      },
      {
        q: "What if I don't know which app was involved?",
        a: "That's fine - describe what you were using and how you felt as best you can. You're not expected to name every app with certainty; a general description of the tool or platform is enough to start a report.",
      },
      {
        q: "Is my report private?",
        a: "Yes. We hold ourselves to high privacy standards: we don't require your name, and we collect only what's necessary to understand the report. If you choose to share contact details for follow-up questions, that's optional and clearly marked before you submit.",
      },
      {
        q: "What happens after I submit a report?",
        a: "Your report is logged and reviewed as part of ongoing monitoring for patterns. An individual report isn't a diagnosis and isn't treated as one - it contributes to a broader signal that gets investigated over time.",
      },
      {
        q: "Can professionals report too?",
        a: "Yes. The same form works for anyone affected, parents or carers, and professionals such as clinicians, educators, and researchers. Professionals may have access to more context, which is helpful but not required - the core questions are the same for everyone.",
      },
      {
        q: "Can I report on behalf of my child?",
        a: "Yes. Parents and carers can submit a report on behalf of a child in their care. We're still finalizing our policy on reports involving minors; check back here for updates.",
      },
      {
        q: "What if I'm not sure the tool or platform is to blame?",
        a: "That's fine - you're not expected to prove anything. Suspected links are exactly what this kind of reporting is for. Reviewers look across many reports to spot patterns that a single experience can't show on its own.",
      },
      {
        q: "How long does reporting take?",
        a: "Most people finish in a few minutes. The form starts with the essentials and lets you add optional detail - like a longer description or supporting dates - only if you want to.",
      },
      {
        q: "Is this a crisis or emergency service?",
        a: "No. This is not a crisis or emergency service, and reports are not read in real time. If you or someone else is in immediate danger, contact your local emergency number or a crisis line (e.g. in the Netherlands, 113 Zelfmoordpreventie) right away, then report here afterward if you still want to.",
      },
      {
        q: "What data do you collect, and why?",
        a: "We collect only what's needed to understand and assess a report: how you felt, the tool or platform involved, and optional context. We don't require identifying information. Full detail on what's collected and why will be published in our privacy notice.",
      },
      {
        q: "Will you contact the company I'm reporting?",
        a: "Not automatically, and not with anything that identifies you without your separate consent. Our policy for handling reports that name specific companies or people is still being finalized.",
      },
    ],
    closing: {
      title: "Didn’t find your question?",
      body: "You don’t need to resolve every doubt before reporting. Describe how you felt and let it be assessed.",
      cta: CTA_REPORT,
    },
  },

  /* ── Helplines ────────────────────────────────────────────────────────────── */
  helplines: {
    header: {
      eyebrow: "Resources",
      title: "Crisis helplines & resources",
      intro:
        "If you or someone you know is in crisis, free and confidential help is available. The directories below cover verified helplines in most countries worldwide.",
    },
    emergencyNotice: [
      b("In immediate danger?"),
      " Call your local emergency number. For country-specific crisis helplines, we recommend ",
      a("findahelpline.com", "https://findahelpline.com/"),
      " - it detects your location and shows verified services instantly.",
    ] as Span[],
    directoriesHeading: "Verified directories",
    directoriesIntro: [
      "The following resources maintain up-to-date lists of crisis helplines. We link to them rather than duplicating their data, so you always see the most current information. Our on-site helpline selector (shown on the ",
      a("report page", "/report"),
      ") draws from these same sources but covers a smaller set of countries - use the directories below for the most complete coverage.",
    ] as Span[],
    directories: [
      {
        name: "Find a Helpline",
        url: "https://findahelpline.com/",
        description:
          "Run by ThroughLine, this is the most comprehensive verified directory - covering 1,500+ helplines in 175+ countries across 21 topics and 15 specialties. Helpline organisations verify their own information directly.",
      },
      {
        name: "Wikimedia Mental Health Resources",
        url: "https://meta.wikimedia.org/wiki/Mental_health_resources",
        description:
          "Maintained by the Wikimedia Foundation's Trust & Safety team. Community-maintained and reasonably broad, intended for anyone needing support during a personal crisis.",
      },
      {
        name: "International Association for Suicide Prevention (IASP)",
        url: "https://www.iasp.info/resources/Crisis_Centres/",
        description:
          "Lists crisis centres and helplines across Africa, Asia, Europe, North America, Oceania, and South America. IASP is a WHO-affiliated body dedicated to suicide prevention.",
      },
      {
        name: "HelpGuide - International Directory",
        url: "https://www.helpguide.org/find-help",
        description:
          "A curated international directory of crisis helplines, broken down by country. HelpGuide is a nonprofit mental-health resource.",
      },
      {
        name: "TherapyRoute - Worldwide Crisis Lines",
        url: "https://www.therapyroute.com/article/helplines-suicide-hotlines-and-crisis-lines-from-around-the-world",
        description:
          "Another worldwide directory of crisis and suicide-prevention helplines, organised by country.",
      },
    ],
    accuracy: [
      h2("A note on accuracy"),
      p(
        "Crisis helplines change their phone numbers, hours, and web addresses from time to time. The on-site selector on our report page is a convenience feature - it is not a substitute for a verified, real-time directory. ",
        a("Find a Helpline", "https://findahelpline.com/"),
        " (by ThroughLine) verifies its data directly with each helpline organisation and is the resource we recommend most highly for finding support.",
      ),
      p(
        "If you notice outdated or incorrect information on our site, please ",
        a("let us know", "/contact"),
        " so we can update it.",
      ),
    ] as Block[],
  },

  /* ── Contact ──────────────────────────────────────────────────────────────── */
  contact: {
    header: {
      eyebrow: "Contact",
      title: "Get in touch",
      intro:
        "For questions about the platform, the research, or your data. Please don't use this form for anything urgent.",
    },
    crisisNote: [
      b("Not a crisis service."),
      " Nobody monitors this form in real time. If you or someone else is in immediate danger, contact your local emergency number. In the Netherlands, ",
      a(fillIn.crisisLine.name, fillIn.crisisLine.url),
      " (" + fillIn.crisisLine.dial + ") offers free, confidential support with suicidal thoughts or crisis.",
    ] as Span[],
    body: [
      h2("Contact form"),
      p(
        "Use the form below to contact us about the platform, the research, or your data. Your message will be handled through the contact form.",
      ),
    ] as Block[],
  },

  /* ── Legal draft banner (shown on privacy/terms/accessibility until sign-off) ── */
  legalDraftNotice: {
    title: "Draft for review - not yet in force.",
    body: "This document has not been approved by our data protection officer or legal owner. Every specific below - retention periods, lawful bases, named processors - is a proposal for review, not an approved fact. Do not rely on it.",
  },

  /* ── Privacy ──────────────────────────────────────────────────────────────── */
  privacy: {
    header: {
      eyebrow: "Privacy",
      title: "Privacy notice",
      intro:
        "What we collect when you report, why we collect it, and what you can ask us to do with it.",
    },
    body: [
      h2("Who is responsible"),
      p(
        controller +
          " is the controller for the personal data described here. For anything in this notice, or to exercise the rights below, use our ",
        a("contact form", "/contact"),
        ".",
      ),
      h2("What we collect"),
      p("When you submit a report, we collect:"),
      ul(
        [
          "what you tell us about how you felt, in your own words - this is the substance of the report;",
        ],
        ["the tool, app, or platform involved, and roughly when it happened;"],
        [
          "any optional context you choose to add, such as your age band or whether you are reporting for yourself or someone you support;",
        ],
        [
          "contact details, ",
          b("only"),
          " if you choose to give them so we can ask follow-up questions.",
        ],
      ),
      p(
        "We do not ask for your name, and reporting does not require an account. Free-text answers are the point of this platform, so they may contain information about your health or state of mind. Under the GDPR that is special-category data (Art. 9), and it is treated as such throughout.",
      ),
      h2("Why we collect it"),
      p(
        "To monitor for patterns of possible adverse effects associated with AI tools and systems, and to study them. Reports are analysed in aggregate. An individual report is not assessed as a clinical case and does not produce advice, a diagnosis, or a response to you.",
      ),
      h2("Our lawful basis"),
      p(
        "We propose to process this data as a task carried out in the public interest (Art. 6(1)(e)), relying on the scientific-research condition in Art. 9(2)(j) for special-category data, subject to the safeguards in Art. 89(1) - including data minimisation and, wherever it does not defeat the research purpose, pseudonymisation.",
      ),
      h2("Privacy by default"),
      p(
        "Your privacy is protected by default. Because we do not ask for your name, we generally cannot connect a later request to a specific report - see ",
        a("your rights", "#rights"),
        " for what that means in practice. If you include details that identify you inside a free-text answer, they are stored as part of the report.",
      ),
      h2("Who else handles your data"),
      p(
        "The report form is provided by " +
          fillIn.dataProcessor +
          ", which stores responses on our behalf as a data processor under a written agreement. All reports are encrypted. We do not sell your data, and we do not share it for advertising.",
      ),
      h2("Where your data is stored"),
      p(
        "We intend for report data to be stored within the " +
          fillIn.storageRegion +
          ". Where any processor or sub-processor transfers data outside the EEA, we will rely on an adequacy decision or Standard Contractual Clauses, and will name those transfers here.",
      ),
      h2("How long we keep reports"),
      p(
        "We propose to retain reports for " +
          fillIn.retentionPeriod +
          " from submission, after which they are deleted or fully anonymised. Aggregated results that cannot identify anyone may be kept indefinitely, including after publication.",
      ),
    ] as Block[],
    // Split so the "Your rights" heading can carry an id for the anchor above.
    rightsHeading: "Your rights",
    rights: [
      p("Under the GDPR you can ask us to:"),
      ul(
        ["confirm what personal data we hold about you, and give you a copy;"],
        ["correct it if it is wrong;"],
        ["erase it;"],
        ["restrict or object to how we use it;"],
        ["provide it in a portable form, where that right applies."],
      ),
      p(
        "Because we do not ask for your name by default, we usually cannot identify which report is yours, and Art. 11 means we are not required to acquire more information purely to find it. If you want to be able to withdraw a report later, include contact details when you submit — otherwise we will likely be unable to act on a request about it.",
      ),
      p(
        "To make a request, use our ",
        a("contact form", "/contact"),
        ".",
      ),
    ] as Block[],
    tail: [
      h2("Automated decisions"),
      p(
        "We do not make automated decisions about you that produce legal or similarly significant effects, and we do not profile you for advertising.",
      ),
      h2("Children"),
      p(
        "This platform is expected to be used by people under 18. Our policy on a minimum age, on how age is established, and on parental consent where it is required is being finalised with our data protection officer, and this section will be replaced when it is.",
      ),
      h2("Complaints"),
      p(
        "If you are unhappy with how we handle your data, please tell us first through our ",
        a("contact form", "/contact"),
        ". You also have the right to complain to your national supervisory authority - in the Netherlands, the ",
        a(fillIn.supervisoryAuthority.name, fillIn.supervisoryAuthority.url),
        ".",
      ),
      h2("Changes"),
      p(
        "If this notice changes materially, we will update it here and revise the review date. See also our ",
        a("terms", "/terms"),
        ".",
      ),
    ] as Block[],
  },

  /* ── Terms ────────────────────────────────────────────────────────────────── */
  terms: {
    header: {
      eyebrow: "Terms",
      title: "Terms & disclaimer",
      intro:
        "What this platform offers, what it does not, and the basis on which you use it.",
    },
    body: [
      h2("Not a crisis or emergency service"),
      p(
        "This is the most important term here. ",
        brand,
        " does not provide emergency help. Reports are not read in real time and nobody is monitoring them for signs that you are at risk. If you or someone else is in immediate danger, contact your local emergency number. In the Netherlands you can also reach ",
        a(fillIn.crisisLine.name, fillIn.crisisLine.url),
        " (" + fillIn.crisisLine.dial + ").",
      ),
      h2("Not medical advice"),
      p(
        "Nothing on this site is medical, psychological, or legal advice, and submitting a report does not create a clinical relationship of any kind. Reports are analysed in aggregate for research; you will not receive an assessment of your own situation. If you need advice about your health, speak to a qualified professional.",
      ),
      h2("What you submit"),
      p("By submitting a report, you confirm that:"),
      ul(
        ["what you describe is your own account, given in good faith;"],
        [
          "you are not submitting anyone else’s identifying details unnecessarily - describe what happened without naming other people where you can;",
        ],
        [
          "you understand that we do not ask for your name by default and that we therefore may not be able to find or withdraw your report later (see the ",
          a("privacy notice", "/privacy"),
          ").",
        ],
      ),
      h2("Reports that name companies or individuals"),
      p(
        "Reports may name products, companies, or people. We do not pass your report to the company involved, and we do not publish reports as submitted. Our policy for handling reports that identify third parties - including how they are moderated and how long they are kept - is being finalised, and this section will be replaced when it is.",
      ),
      h2("Availability"),
      p(
        "The platform is offered as it is. We do not guarantee that it will be available without interruption, and we may change or withdraw it.",
      ),
      h2("Liability"),
      p(
        "Nothing in these terms excludes liability where it cannot lawfully be excluded. The scope of any other limitation is being finalised with our legal owner.",
      ),
      h2("Governing law"),
      p(
        "We propose that these terms are governed by Dutch law, subject to confirmation once the operating entity is registered.",
      ),
      h2("Changes"),
      p(
        "If these terms change materially, we will update them here and revise the review date.",
      ),
    ] as Block[],
  },

  /* ── Accessibility ────────────────────────────────────────────────────────── */
  accessibility: {
    header: {
      eyebrow: "Accessibility",
      title: "Accessibility statement",
      intro:
        "We want anyone to be able to report, whatever they use to browse. Here is where we stand and what we know is not yet good enough.",
    },
    body: [
      h2("The standard we aim for"),
      p(
        "We aim to meet ",
        a("WCAG 2.2 level AA", "https://www.w3.org/TR/WCAG22/"),
        ". The site has been built against that target: it is keyboard navigable throughout, uses visible focus indicators, respects reduced-motion preferences, and its text and interface colours were chosen to meet AA contrast ratios.",
      ),
      h2("Current status"),
      p(
        "This statement has not yet been backed by a formal accessibility audit. We have not completed an independent assessment or testing with people who use assistive technology, so we do not claim conformance — only that AA is what we are building to. That assessment is planned, and this section will be replaced by its result.",
      ),
      h2("Known limitations"),
      p("We are aware of the following:"),
      ul(
        [
          b("The report form."),
          " The form itself is provided and rendered by a third party (" +
            fillIn.dataProcessor +
            ") inside an embedded frame. Its accessibility is largely outside our control and has not been audited by us. If the embedded form is unusable for you, the report page offers a link to open it in a full browser tab, which some people find works better.",
        ],
        [
          b("No audit result."),
          " As above - until an assessment is done, there may be barriers we simply do not know about yet.",
        ],
      ),
      h2("If something blocks you"),
      p(
        "Please tell us - a specific report of what failed is the fastest route to fixing it. Use our ",
        a("contact form", "/contact"),
        " and, if you can, say what page you were on, what you were trying to do, and what you use to browse.",
      ),
      p(
        "If you are not satisfied with how we respond, you can raise it with your national supervisory body for digital accessibility.",
      ),
    ] as Block[],
  },

  /* ── 404 ──────────────────────────────────────────────────────────────────── */
  notFound: {
    eyebrow: "404",
    title: "Page not found",
    body: "Sorry, we couldn’t find that page. Here are some places to go instead:",
    links: [
      { label: "Report your experience", href: "/report", primary: true },
      { label: "FAQ", href: "/faq" },
      { label: "Home", href: "/" },
    ],
  },

  /* ── Blog index (posts themselves live in content/blog/*.md) ───────────────── */
  blog: {
    eyebrow: "Blog",
    title: "Writing on AI, wellbeing, and reporting",
    intro:
      "Articles, in the public interest, on spotting when an AI tool or social platform is affecting how you feel, and what happens to the reports you send us.",
    empty: "No posts yet - check back soon.",
  },

  /* ── llms.txt (AI-assistant hand-hold, emitted at build) ───────────────────── */
  llms: {
    summary: [
      "is a public service for reporting possible adverse",
      "effects of AI tools and systems (chatbots, social media, deepfakes,",
      "AI surveillance, automated decision-making). Anyone",
      "affected — and parents, carers, and professionals supporting someone",
      "else — can submit reports to help identify patterns. This is not",
      "a crisis or emergency service; in an emergency, contact your local",
      "emergency number.",
    ],
    corePages: [
      ["/", "Home", "what the service is and how to report an experience."],
      ["/report", "Report your experience", "the reporting form — the main action."],
      ["/how-it-works", "How reporting works", "step-by-step of what happens to a report."],
      ["/about", "About us", "who we are, our mission, and governance."],
      ["/faq", "FAQ", "common questions with direct answers."],
      ["/blog", "Blog", "Articles, in the public interest, on the possible adverse effects of AI tools, and what the reports reveal."],
      ["/helplines", "Crisis helplines", "immediate support lines — this site is not itself a crisis service."],
      ["/contact", "Contact", "how to reach us (not for emergencies)."],
    ] as Array<[string, string, string]>,
    legalPages: [
      ["/privacy", "Privacy statement", "how personal and health data is handled (GDPR)."],
      ["/accessibility", "Accessibility statement", "WCAG 2.2 AA conformance."],
      ["/terms", "Terms & disclaimer", "not a crisis service; emergency guidance."],
    ] as Array<[string, string, string]>,
    keyFacts: [
      "Purpose: collect reports of possible adverse effects of AI tools and systems, from the public and professionals.",
      "Audience: people affected, plus the parents, carers, and professionals supporting them.",
      "Reports are handled to high privacy standards; no account or name is required.",
      "Not a diagnosis, treatment, crisis, or moderation-enforcement service.",
    ],
  },
} as const;

export type Content = typeof content;
