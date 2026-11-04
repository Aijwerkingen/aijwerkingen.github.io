#!/usr/bin/env python3
"""
qsf_to_text.py — Render a Qualtrics .qsf as a human-readable, Word-pasteable
survey document that keeps question types, options, and display-logic
dependencies legible.

The output is *semi-structured*: every question carries its stable anchors
(QID + export tag) in a trailing bracket, e.g.  [Q3 · QID1 · multi-select],
so edits made in the text/Word doc can be merged back into the original QSF
by anchor (see merge_text_edits.py). The QSF itself remains the source of
truth for machine-level details (recode values, IDs, theme, etc.).

Usage: python3 qsf_to_text.py <survey.qsf> <output.md>
"""
import json, re, sys, html

MAX_LISTED_CHOICES = 25  # above this, summarise instead of listing all

PIPES = {
    "${e://Field/subj}": "you",
    "${e://Field/poss}": "your",
    "${e://Field/beq}": "are you",
    "${e://Field/doq}": "do you",
}

TAG_RE = re.compile(r"<[^>]+>")

def clean(text):
    if not text:
        return ""
    t = TAG_RE.sub(" ", text)
    t = html.unescape(t)
    for k, v in PIPES.items():
        t = t.replace(k, v)
    t = re.sub(r"\s+", " ", t).strip()
    return t

def qtype_label(p):
    qt = p.get("QuestionType")
    sel = p.get("Selector", "")
    if qt == "MC":
        if sel in ("DL", "SB"):
            return "dropdown"
        if sel in ("MAVR", "MAHR", "MACOL", "MSB"):
            return "multi-select"
        return "single choice"
    if qt == "TE":
        return {"SL": "short text", "ML": "long text", "ESTB": "essay text"}.get(sel, "text entry")
    if qt == "Matrix":
        return "matrix"
    if qt == "DB":
        return "text / message (no answer)"
    if qt == "Slider":
        return "slider"
    return qt or "unknown"

def required_label(p):
    v = p.get("Validation", {}).get("Settings", {}) or {}
    if v.get("ForceResponse") == "ON":
        return "required"
    if v.get("Type") == "MinChoices":
        return f"optional, min {v.get('MinChoices')} choice(s) if answered"
    return "optional"

def logic_text(dl):
    """Flatten Qualtrics DisplayLogic/BranchLogic into one English sentence,
    using the human 'Description' strings Qualtrics stores."""
    parts = []
    def walk(node):
        if not isinstance(node, dict):
            return
        for key in sorted(k for k in node if k.isdigit()):
            sub = node[key]
            if isinstance(sub, dict):
                if "Description" in sub:
                    parts.append(clean(sub["Description"]))
                else:
                    walk(sub)
    walk(dl)
    return "; ".join(parts)

def render_choices(p, lines):
    choices = p.get("Choices") or {}
    order = [str(c) for c in (p.get("ChoiceOrder") or sorted(choices, key=lambda x: int(x) if str(x).isdigit() else 0))]
    order = [c for c in order if c in choices] or list(choices)
    n = len(order)
    if n == 0:
        return
    randomized = bool(p.get("Randomization", {}) and p.get("Randomization", {}).get("Type"))
    if n > MAX_LISTED_CHOICES:
        first = clean(choices[order[0]].get("Display", ""))
        last = clean(choices[order[-1]].get("Display", ""))
        lines.append(f"  Options: a list of {n} options ({first} … {last}) — full list kept in the QSF, not reproduced here.")
        return
    label = "Options (shown in random order):" if randomized else "Options:"
    lines.append(f"  {label}")
    for c in order:
        ch = choices[c]
        disp = clean(ch.get("Display", ""))
        extras = []
        if ch.get("TextEntry") in ("true", True):
            extras.append("free-text box")
        if ch.get("ExclusiveAnswer"):
            extras.append("exclusive — cannot combine with others")
        suffix = f"  ({'; '.join(extras)})" if extras else ""
        lines.append(f"    • {disp}{suffix}")

def render_question(p, lines):
    qid = p["QuestionID"]
    tag = p.get("DataExportTag", "")
    tlabel = qtype_label(p)
    req = required_label(p)
    text = clean(p.get("QuestionText", ""))
    lines.append(f"**{text}**")
    meta = f"  [{tag} · {qid} · {tlabel} · {req}]"
    lines.append(meta)
    dl = p.get("DisplayLogic")
    if dl:
        lines.append(f"  Shown only if: {logic_text(dl)}")
    if p.get("QuestionType") == "MC":
        render_choices(p, lines)
    elif p.get("QuestionType") == "TE":
        sel = p.get("Selector")
        hint = {"SL": "single-line text box", "ML": "multi-line text box", "ESTB": "large essay box"}.get(sel, "text box")
        lines.append(f"  Answer: {hint}.")
    lines.append("")

def main(qsf_path, out_path):
    with open(qsf_path) as f:
        data = json.load(f)

    entry = data["SurveyEntry"]
    questions, blocks, flow = {}, [], None
    for el in data["SurveyElements"]:
        if el["Element"] == "SQ":
            questions[el["Payload"]["QuestionID"]] = el["Payload"]
        elif el["Element"] == "BL":
            blocks = el["Payload"] if isinstance(el["Payload"], list) else list(el["Payload"].values())
        elif el["Element"] == "FL":
            flow = el["Payload"]

    block_by_id = {b["ID"]: b for b in blocks}
    lines = []
    lines.append(f"# {entry['SurveyName']} — survey content (readable export)")
    lines.append("")
    lines.append(f"Source: Qualtrics survey `{entry['SurveyID']}`, last modified {entry['LastModified']}.")
    lines.append("")
    lines.append("How to read this document:")
    lines.append("- Each question ends with an anchor tag like `[Q3 · QID1 · multi-select · optional]` — export tag, internal ID, answer format, and whether an answer is forced. These anchors let edits in this document be traced back into the Qualtrics file; please keep them intact when commenting/editing.")
    lines.append("- \"Shown only if\" lines describe skip/display logic — the question appears only when the condition holds.")
    lines.append("- Adaptive wording: the survey pipes in \"you / your\" when respondents report their own experience, and \"this person / their\" when reporting on someone else's behalf (set by the branch after Q0a). Questions are shown here in the \"you\" form.")
    lines.append("")

    def render_flow_item(item, depth=0):
        t = item.get("Type")
        if t in ("Standard", "Block", "Default") and item.get("ID") in block_by_id:
            render_block(block_by_id[item["ID"]], depth)
        elif t == "Branch":
            desc = item.get("Description", "Branch")
            cond = logic_text(item.get("BranchLogic", {}))
            lines.append("---")
            lines.append(f"### ↳ Branch: {desc}")
            if cond:
                lines.append(f"*Taken only if: {cond}*")
            lines.append("")
            for sub in item.get("Flow", []):
                render_flow_item(sub, depth + 1)
        elif t == "EmbeddedData":
            fields = {e["Field"]: e.get("Value", "") for e in item.get("EmbeddedData", [])}
            if depth > 0 and "subj" in fields:
                lines.append(f"*(Wording switches to third person here: \"you\" → \"{fields['subj']}\", \"your\" → \"{fields.get('poss','')}\", etc.)*")
                lines.append("")
        elif t == "EndSurvey":
            opts = item.get("Options", {})
            flag = opts.get("ResponseFlag")
            lines.append(f"*(Survey ends here{f'; response flagged as {flag}' if flag else ''}.)*")
            lines.append("")

    def render_block(block, depth=0):
        lines.append("---")
        lines.append(f"## {block.get('Description', block['ID'])}")
        lines.append("")
        for el in block.get("BlockElements", []):
            if el["Type"] == "Question":
                q = questions.get(el["QuestionID"])
                if q:
                    render_question(q, lines)
            elif el["Type"] == "Page Break":
                lines.append("· · · page break · · ·")
                lines.append("")

    for item in flow["Flow"]:
        render_flow_item(item)

    # Trash / unused questions, listed briefly for completeness
    trash = [b for b in blocks if b.get("Type") == "Trash"]
    if trash:
        lines.append("---")
        lines.append("## Appendix: unused questions (in the Qualtrics bin, not shown to respondents)")
        lines.append("")
        for b in trash:
            for el in b.get("BlockElements", []):
                q = questions.get(el.get("QuestionID"))
                if q:
                    lines.append(f"- {clean(q.get('QuestionText',''))[:120]}  [{q.get('DataExportTag','')} · {q['QuestionID']} · {qtype_label(q)}]")
        lines.append("")

    with open(out_path, "w") as f:
        f.write("\n".join(lines))
    print(f"Wrote {out_path} ({len(lines)} lines)")

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
