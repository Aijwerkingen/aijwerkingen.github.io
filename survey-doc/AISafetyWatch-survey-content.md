# AISafetyWatch — survey content (readable export)

Source: Qualtrics survey `SV_eA4y9ucLih6un8a`, last modified 2026-08-18 09:43:08.

How to read this document:
- Each question ends with an anchor tag like `[Q3 · QID1 · multi-select · optional]` — export tag, internal ID, answer format, and whether an answer is forced. These anchors let edits in this document be traced back into the Qualtrics file; please keep them intact when commenting/editing.
- "Shown only if" lines describe skip/display logic — the question appears only when the condition holds.
- Adaptive wording: the survey pipes in "you / your" when respondents report their own experience, and "this person / their" when reporting on someone else's behalf (set by the branch after Q0a). Questions are shown here in the "you" form.

---
## Eligibility

**Before we begin: are you 16 years of age or older?**
  [Q1 · QID4 · single choice · required]
  Options:
    • Yes, I am 16 or older
    • No, I am under 16

---
### ↳ Branch: Under 16 - ineligible
*Taken only if: If No, I am under 16 Is Selected*

---
## Under-16 message

**Thank you for your interest. This survey can only be completed by someone aged 16 or older. If you are under 16, please ask a parent, guardian, or another adult (aged 16 or older) to complete it on your behalf. You can now close this window.**
  [Q_minor · QID32 · text / message (no answer) · optional]

*(Survey ends here; response flagged as Screened.)*

---
## Block A: Reporter

**Whose experience is this survey about?**
  [Q0a · QID14 · single choice · required]
  Options:
    • My own experience
    • Someone else's experience (I am reporting on their behalf)

· · · page break · · ·

**What is your relationship to the person whose experience you are reporting?**
  [Q0b · QID17 · single choice · required]
  Shown only if: If Q0a Someone else's experience Is Selected
  Options:
    • Parent / legal guardian
    • Partner or spouse
    • Other family member
    • Friend
    • Caregiver / support worker
    • Healthcare or mental-health professional
    • Teacher / educator
    • Other (please specify)  (free-text box)

---
### ↳ Branch: Proxy report
*Taken only if: If Whose experience... Someone else's experience Is Selected*

*(Wording switches to third person here: "you" → "this person", "your" → "their", etc.)*

---
## Block B: General & Demographics

**Please answer the following questions about you. What do you identify as?**
  [Q2 · QID5 · single choice · required]
  Options:
    • Female
    • Male
    • Non-binary
    • Prefer not to say

**In which country do you currently reside?**
  [Q1 · QID1220638753 · dropdown · optional]
  Options: a list of 193 options (Afghanistan … Zimbabwe) — full list kept in the QSF, not reproduced here.

---
## Block C: AI Experience & Situation

**What kind of AI-related experience are you reporting? (Select all that apply)**
  [Q_aitype · QID27 · multi-select · required]
  Options:
    • Direct AI conversations (e.g., AI chatbots, companion AI, dating AI)
    • Deepfakes & content (e.g., fake news, unauthorised AI use of personal images or video)
    • Social-media algorithms (e.g., feed recommendations)
    • Gaming & virtual worlds (e.g., absorptive environments)
    • Surveillance & tracking (e.g., facial recognition, AI-facilitated coercive control)
    • AI decision-making (e.g., health care, insurance)
    • Work environment (e.g., employee monitoring)
    • Other (please specify)  (free-text box)

· · · page break · · ·

**Please briefly describe the situation that you believe caused your mental-health difficulties — what happened, and how it affected you.**
  [Q_situation · QID28 · long text · optional]
  Answer: multi-line text box.

---
## Block D: Time & Duration

**When did this most recently happen?**
  [Q_when · QID29 · single choice · required]
  Options:
    • Today / within the last few days
    • Within the last week
    • Within the last month
    • Within the last 6 months
    • More than 6 months ago
    • It is ongoing

**Over what period are you exposed to this situation?**
  [Q_duration · QID30 · single choice · required]
  Options:
    • Less than a day
    • A few days
    • A few weeks
    • 1–6 months
    • 6–12 months
    • More than a year
    • Not sure

---
## Block E: Platforms & Context (if applicable)

**Which of the following digital and social platforms did you use recently?**
  [Q3 · QID1 · multi-select · optional, min 1 choice(s) if answered]
  Shown only if: If Social-media algorithms Is Selected; Or Gaming & virtual worlds Is Selected
  Options (shown in random order):
    • Instagram
    • TikTok
    • Snapchat
    • Reddit
    • X (formerly Twitter)
    • Meta (Facebook)
    • Twitch
    • Discord
    • Roblox
    • Steam
    • Console networks (PlayStation / Xbox)
    • Mobile games
    • Other (please specify)  (free-text box)
    • None  (exclusive — cannot combine with others)

**Where did you encounter the deepfake or AI-generated content? (Select all that apply)**
  [Q3c_deepfake_source · QID100 · multi-select · optional, min 1 choice(s) if answered]
  Shown only if: If Deepfakes & content Is Selected
  Options (shown in random order):
    • Instagram
    • TikTok
    • Snapchat
    • Reddit
    • X (formerly Twitter)
    • Meta (Facebook)
    • YouTube
    • Twitch
    • Discord
    • A website or search result
    • Messaging app (WhatsApp, Telegram, etc.)
    • Email
    • Other (please specify)  (free-text box)
    • Not sure  (exclusive — cannot combine with others)

**What system or context was involved in the surveillance or tracking? (e.g., a workplace camera system, a specific app or service, a government or public system)**
  [Q3d_surveillance_system · QID101 · long text · optional]
  Shown only if: If Surveillance & tracking Is Selected
  Answer: multi-line text box.

**Which of the following best describes where the AI-driven decision took place?**
  [Q3e_decision_sector · QID102 · single choice · optional]
  Shown only if: If AI decision-making Is Selected
  Options:
    • Healthcare
    • Insurance
    • Banking, credit, or finance
    • Government services or benefits
    • Hiring, HR, or the workplace
    • Housing
    • Education
    • Policing, legal, or justice system
    • Other (please specify)  (free-text box)

**If known, name the service, company, or organisation involved (optional).**
  [Q3e_decision_name · QID103 · short text · optional]
  Shown only if: If AI decision-making Is Selected
  Answer: single-line text box.

**What kind of monitoring or AI tool was involved? (e.g., productivity or activity tracker, camera monitoring, keystroke logging, automated scheduling)**
  [Q3f_work_monitoring · QID104 · long text · optional]
  Shown only if: If Work environment Is Selected
  Answer: multi-line text box.

· · · page break · · ·

**Which of the following Conversational AI platforms did you use recently?**
  [Q6 · QID8 · multi-select · optional, min 1 choice(s) if answered]
  Shown only if: If Direct AI conversations Is Selected
  Options (shown in random order):
    • ChatGPT
    • Claude
    • Gemini
    • Perplexity
    • Copilot(Microsoft)
    • Meta AI
    • character.ai
    • Other (please specify)  (free-text box)
    • None  (exclusive — cannot combine with others)

**What did you mainly use the Conversational AI platform(s) for? (Select all that apply)**
  [Q10 · QID20 · multi-select · required]
  Shown only if: If Direct AI conversations Is Selected; And AI platform None Is Not Selected
  Options:
    • Information / search / answering questions
    • Work or study productivity
    • Coding or technical help
    • Emotional support / therapy-like conversations
    • Coaching, advice, or decision-making
    • Companionship / social connection
    • Creative writing or brainstorming
    • Image, art, or media generation
    • Entertainment / fun
    • Other (please specify)  (free-text box)

**How did you mainly encounter AI?**
  [Q11 · QID21 · single choice · required]
  Shown only if: If Direct AI conversations Is Selected; And AI platform None Is Not Selected
  Options:
    • Active — you directly interacted with an AI (e.g., chatting with a chatbot, generating content)
    • Passive — you came across AI-generated content that others created (e.g., AI posts, images, or videos in your feed)
    • Both actively and passively
    • Not sure

---
## Block F: Symptoms

**Which of the following did you experience during or after this use? (Select all that apply)**
  [Q13 · QID22 · multi-select · required]
  Options:
    • Anxiety or nervousness
    • Low mood or sadness
    • Irritability or anger
    • Trouble sleeping / disrupted sleep
    • Fatigue or low energy
    • Difficulty concentrating
    • Compulsive or excessive use / difficulty stopping
    • Social withdrawal or avoiding people
    • Loneliness or isolation
    • Reduced self-esteem / negative self-image
    • Body-image concerns
    • Distressing or intrusive thoughts
    • Confusion about what is real (e.g., AI vs. human)
    • Emotional dependence on the platform
    • Physical symptoms (headaches, eye strain, etc.)
    • Other (please specify)  (free-text box)
    • None of the above  (exclusive — cannot combine with others)

---
## Block G: Thank you

**Thank you. Your report has been recorded. The information you shared helps build a clearer picture of how AI systems can affect people's mental health. You may now close this window.**
  [Q_thanks · QID31 · text / message (no answer) · optional]

---
## Appendix: unused questions (in the Qualtrics bin, not shown to respondents)

- If you answered "Other" above, please list the digital / social platforms you have used recently (each on a new line)  [Q3_other · QID2 · long text]
- If you answered "Other" above, please list the Conversational AI platforms you have used recently (each on a new line)  [Q6_other · QID9 · long text]
- Did you feel any distress during or after using the platform(s)?  [Q4 · QID6 · single choice]
- Did you feel distress during or after using the Conversational AI platform(s)?  [Q7 · QID11 · single choice]
- How would you describe the extent of distress felt while using the platform(s)?  [Q5 · QID12 · single choice]
- How would you describe the extent of distress felt while using the Conversational AI platform(s)?  [Q8 · QID13 · single choice]
- When did you most recently experience this distress from the digital / social platform(s)?  [Q12_social · QID18 · single choice]
- When did you most recently experience this distress from the Conversational AI platform(s)?  [Q12_ai · QID25 · single choice]
- For each of the following, how severe was it for you?  [Q14 · QID23 · matrix]
- In your view, how much of what you experienced is due to using these platforms, versus other things going on in your lif  [Q15 · QID24 · single choice]
- In which country are you based? (Where did this mainly take place?)  [Q_country · QID26 · single choice]
