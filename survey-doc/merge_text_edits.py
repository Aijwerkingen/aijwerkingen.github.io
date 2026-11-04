#!/usr/bin/env python3
"""
merge_text_edits.py — Reverse direction: apply edits made in the readable
document back into the original .qsf, producing an updated .qsf that can be
imported into Qualtrics.

How it works (and its limits):
- The document is NOT a full serialization of the survey; the original QSF
  stays the source of truth for structure (blocks, flow, logic, validation,
  recodes, theme). What the doc *does* carry, via the `[tag · QID · type ·
  required]` anchors, is enough to map every question and its options back
  to the QSF.
- Reversible edits: question wording, and option wording for options that
  are listed in full. Edit the text in place, keep the anchor line and the
  `•` bullets, and this script writes the changes into the QSF.
- Adding/removing options: add or delete `•` bullet lines under a question.
  New options get fresh choice IDs; annotate with `(free-text box)` /
  `(exclusive — cannot combine with others)` as in the export.
- NOT reversible from the doc (change these in Qualtrics): display logic,
  block/flow structure, validation, summarised long lists (e.g. the country
  dropdown), and piped "you/this person" wording (the doc shows the "you"
  form; piping is preserved untouched unless the text around it changed).

Usage: python3 merge_text_edits.py <edited.md> <original.qsf> <output.qsf>
"""
import json, re, sys

ANCHOR_RE = re.compile(r"^\s*\[([^\]·]*)·\s*(QID[0-9]+)\s*·")
QUESTION_RE = re.compile(r"^\*\*(.+)\*\*\s*$")
BULLET_RE = re.compile(r"^\s*•\s*(.*)$")

PIPE_RE = re.compile(r"\$\{e://Field/[a-z]+\}")
PIPES_FWD = {
    "${e://Field/subj}": "you",
    "${e://Field/poss}": "your",
    "${e://Field/beq}": "are you",
    "${e://Field/doq}": "do you",
}

def doc_form(text):
    """Render QSF text the way qsf_to_text.py does: strip HTML, apply the
    'you'-form of each pipe, collapse whitespace. Used to detect whether the
    doc text was actually edited."""
    import html as _html
    t = re.sub(r"<[^>]+>", " ", text or "")
    t = _html.unescape(t)
    for k, v in PIPES_FWD.items():
        t = t.replace(k, v)
    return re.sub(r"\s+", " ", t).strip()
# doc-form of each pipe, to translate edited text back where possible
PIPE_BACK = [
    ("are you", "${e://Field/beq}"),
    ("do you", "${e://Field/doq}"),
    ("your", "${e://Field/poss}"),
    ("you", "${e://Field/subj}"),
]

def parse_doc(path):
    """Return {qid: {"text": str, "choices": [ {display, textentry, exclusive} ] or None}}"""
    edits = {}
    lines = open(path).read().splitlines()
    i = 0
    while i < len(lines):
        m = QUESTION_RE.match(lines[i])
        if m and i + 1 < len(lines):
            am = ANCHOR_RE.match(lines[i + 1])
            if am:
                qid = am.group(2)
                entry = {"text": m.group(1).strip(), "choices": None}
                j = i + 2
                # scan until next question/section for bullets
                bullets = []
                summarised = False
                while j < len(lines) and not QUESTION_RE.match(lines[j]) and not lines[j].startswith(("##", "---")):
                    if "full list kept in the QSF" in lines[j]:
                        summarised = True
                    bm = BULLET_RE.match(lines[j])
                    if bm:
                        raw = bm.group(1).strip()
                        textentry = "(free-text box)" in raw
                        exclusive = "exclusive" in raw
                        disp = re.sub(r"\s*\((free-text box|exclusive[^)]*)\)\s*", " ", raw).strip()
                        bullets.append({"display": disp, "textentry": textentry, "exclusive": exclusive})
                    j += 1
                if bullets and not summarised:
                    entry["choices"] = bullets
                edits[qid] = entry
                i = j
                continue
        i += 1
    return edits

def restore_pipes(new_text, original_text):
    """If the original question text used piped fields, try to put them back
    by replacing the doc-form words. Only applied when the original had pipes."""
    if not PIPE_RE.search(original_text or ""):
        return new_text
    out = new_text
    for word, pipe in PIPE_BACK:
        # replace whole-word doc forms only where original contains that pipe
        if pipe in original_text:
            out = re.sub(rf"\b{re.escape(word)}\b", pipe, out, count=out.count(word))
    return out

def main(doc_path, qsf_path, out_path):
    edits = parse_doc(doc_path)
    data = json.load(open(qsf_path))
    changed, added, removed = 0, 0, 0

    for el in data["SurveyElements"]:
        if el["Element"] != "SQ":
            continue
        p = el["Payload"]
        qid = p["QuestionID"]
        if qid not in edits:
            continue
        e = edits[qid]

        # question text
        orig = p.get("QuestionText", "")
        new_text = e["text"]
        if new_text and new_text != doc_form(orig):
            p["QuestionText"] = restore_pipes(new_text, orig)
            p["QuestionDescription"] = re.sub(r"\$\{e://Field/[a-z]+\}", "", new_text)[:100].strip()
            el["SecondaryAttribute"] = p["QuestionDescription"]
            changed += 1

        # choices (only when fully listed in the doc)
        if e["choices"] is not None and p.get("Choices"):
            order = [str(c) for c in p.get("ChoiceOrder", [])] or sorted(p["Choices"], key=int)
            order = [c for c in order if c in p["Choices"]]
            new_choices, new_order = {}, []
            next_id = int(p.get("NextChoiceId", max((int(c) for c in p["Choices"]), default=0) + 1))
            # pass 1: keep IDs stable for bullets whose text is unchanged
            unmatched_cids = list(order)
            assign = {}
            for idx, b in enumerate(e["choices"]):
                for cid in unmatched_cids:
                    if b["display"] == doc_form(p["Choices"][cid].get("Display", "")):
                        assign[idx] = cid
                        unmatched_cids.remove(cid)
                        break
            # pass 2: pair remaining bullets with remaining IDs in order (renames)
            for idx, b in enumerate(e["choices"]):
                if idx not in assign and unmatched_cids:
                    assign[idx] = unmatched_cids.pop(0)
            for idx, b in enumerate(e["choices"]):
                if idx in assign:
                    cid = assign[idx]
                    ch = p["Choices"][cid]
                    if b["display"] != doc_form(ch.get("Display", "")):
                        ch["Display"] = restore_pipes(b["display"], ch.get("Display", ""))
                        changed += 1
                else:
                    cid = str(next_id); next_id += 1
                    ch = {"Display": b["display"]}
                    added += 1
                if b["textentry"]:
                    ch["TextEntry"] = "true"
                else:
                    ch.pop("TextEntry", None)
                if b["exclusive"]:
                    ch["ExclusiveAnswer"] = True
                else:
                    ch.pop("ExclusiveAnswer", None)
                new_choices[cid] = ch
                new_order.append(int(cid) if cid.isdigit() else cid)
            removed += len(unmatched_cids)
            p["Choices"] = new_choices
            p["ChoiceOrder"] = new_order
            p["NextChoiceId"] = next_id

    with open(out_path, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"Wrote {out_path}: {changed} text change(s), {added} option(s) added, {removed} option(s) removed")

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2], sys.argv[3])
