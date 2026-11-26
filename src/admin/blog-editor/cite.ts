"use client";

// Scientific references, in the house style already used by the posts: inline
// links in the text plus a `## Sources` bullet list at the end
// (docs/BLOG_EDITOR_PHASE2_PLAN.md sections 3 and 4.5).
//
// parseCiteInput and formatSource are pure and testable; insertSource is the
// only part that touches the editor. The server re-runs the parsing rules for
// itself, so a doctored request cannot make it fetch anything else.

import type { Editor } from "@tiptap/react";

export type CiteData = {
  /** Display surnames, in order. */
  authors: string[];
  title: string;
  /** Journal name, or the publisher for a manual entry. */
  container: string;
  volume?: string;
  pages?: string;
  year?: string;
  doi?: string;
  pmid?: string;
  /** Manual entries without a DOI or PMID. */
  url?: string;
};

/** One inline run of the formatted entry. */
export type Piece = { text: string; italic?: boolean; href?: string };

const DOI_BARE = /^10\.\d{4,9}\/\S+$/;
const PMID_BARE = /^\d{1,9}$/;

/** Trailing sentence punctuation is almost always the pasted sentence, not the id. */
function trimTail(value: string): string {
  return value.replace(/[.,;)\]]+$/, "");
}

/**
 * Reads a paste into a DOI or a PMID. Accepts a bare DOI, `doi:` prefix, a
 * doi.org / dx.doi.org link, a PubMed link, `PMID: 123`, or bare digits.
 * Anything else (a publisher URL, say) returns null so the dialog can offer
 * manual entry instead.
 */
export function parseCiteInput(raw: string): { doi: string } | { pmid: string } | null {
  const value = raw.trim();
  if (!value) return null;

  const doiLink = value.match(/^https?:\/\/(?:dx\.)?doi\.org\/(.+)$/i);
  if (doiLink) {
    const doi = trimTail(decodeURIComponent(doiLink[1]).trim());
    return DOI_BARE.test(doi) ? { doi } : null;
  }

  const doiPrefix = value.match(/^doi:\s*(.+)$/i);
  if (doiPrefix) {
    const doi = trimTail(doiPrefix[1].trim());
    return DOI_BARE.test(doi) ? { doi } : null;
  }

  const pubmed = value.match(/^https?:\/\/(?:www\.)?pubmed\.ncbi\.nlm\.nih\.gov\/(\d{1,9})\/?/i);
  if (pubmed) return { pmid: pubmed[1] };

  const pmidPrefix = value.match(/^pmid:?\s*(\d{1,9})$/i);
  if (pmidPrefix) return { pmid: pmidPrefix[1] };

  if (DOI_BARE.test(trimTail(value))) return { doi: trimTail(value) };
  if (PMID_BARE.test(value)) return { pmid: value };
  return null;
}

/** "A & B" for two, "A, B & C" up to five, "A et al." beyond that. */
export function formatAuthors(authors: string[]): string {
  const named = authors.filter((name) => name.trim() !== "");
  if (named.length === 0) return "";
  if (named.length === 1) return named[0];
  if (named.length > 5) return `${named[0]} et al.`;
  return `${named.slice(0, -1).join(", ")} & ${named[named.length - 1]}`;
}

export function doiUrl(doi: string): string {
  return `https://doi.org/${doi}`;
}

export function pubmedUrl(pmid: string): string {
  return `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;
}

/** Where a link to this source should point. */
export function citeHref(cite: CiteData): string {
  if (cite.doi) return doiUrl(cite.doi);
  if (cite.pmid) return pubmedUrl(cite.pmid);
  return cite.url ?? "";
}

/**
 * The entry as inline pieces, so the editor inserts real nodes (Tiptap escapes
 * text for us) and the dialog can render a preview from the same source.
 *
 * Reproduces the existing house style exactly:
 * `Surname, Surname & Surname - *Title*, Journal Volume, first–last (Year) · [DOI](…)`
 */
export function formatSource(cite: CiteData): Piece[] {
  const pieces: Piece[] = [];

  const authors = formatAuthors(cite.authors);
  if (authors) pieces.push({ text: authors }, { text: " - " });

  pieces.push({ text: cite.title, italic: true });

  let rest = "";
  if (cite.container) rest += `, ${cite.container}`;
  if (cite.volume) rest += ` ${cite.volume}`;
  if (cite.pages) rest += `, ${cite.pages}`;
  if (cite.year) rest += ` (${cite.year})`;
  if (rest) pieces.push({ text: rest });

  if (cite.doi) pieces.push({ text: " · " }, { text: "DOI", href: doiUrl(cite.doi) });
  if (cite.pmid) pieces.push({ text: " · " }, { text: "PubMed", href: pubmedUrl(cite.pmid) });
  if (!cite.doi && cite.url) pieces.push({ text: " · " }, { text: "Link", href: cite.url });

  return pieces;
}

/** The Markdown an entry produces - used for tests and for copying. */
export function piecesToMarkdown(pieces: Piece[]): string {
  return pieces
    .map((piece) => {
      let text = piece.italic ? `*${piece.text}*` : piece.text;
      if (piece.href) text = `[${text}](${piece.href})`;
      return text;
    })
    .join("");
}

const SOURCES_HEADINGS = ["sources", "references"];

/** First level-2 heading called Sources or References. */
function findSourcesHeading(doc: Editor["state"]["doc"]): number | null {
  let found: number | null = null;
  doc.descendants((node, pos) => {
    if (found !== null) return false;
    if (
      node.type.name === "heading" &&
      node.attrs.level === 2 &&
      SOURCES_HEADINGS.includes(node.textContent.trim().toLowerCase())
    ) {
      found = pos;
      return false;
    }
    return true;
  });
  return found;
}

/**
 * True when this DOI or PMID is already in the Sources list (or anywhere, when
 * the post has no Sources heading yet).
 *
 * The DOI lives in the entry's link *href*, not in its text, so the text alone is
 * not enough - an entry written as `· [DOI](https://doi.org/…)` has no DOI
 * anywhere in the words. Both are checked.
 */
export function alreadyListed(editor: Editor, cite: CiteData): boolean {
  const doc = editor.state.doc;
  const needles = [cite.doi, cite.pmid].filter(Boolean) as string[];
  if (needles.length === 0) return false;
  const from = findSourcesHeading(doc) ?? 0;

  let found = false;
  doc.nodesBetween(from, doc.content.size, (node) => {
    if (found) return false;
    if (node.isText) {
      const href = node.marks.find((mark) => mark.type.name === "link")?.attrs.href;
      const haystack = `${node.text ?? ""} ${typeof href === "string" ? href : ""}`;
      if (needles.some((needle) => haystack.includes(needle))) found = true;
    }
    return true;
  });
  if (found) return true;

  // A DOI pasted as plain text rather than linked, and PMID-only entries.
  const text = doc.textBetween(from, doc.content.size, " ", " ");
  return needles.some((needle) => text.includes(needle));
}

/**
 * Appends the entry to the post's Sources list, creating the heading and list
 * when they are missing (section 4.5, "Insertion"). Optionally links the text
 * the user had selected.
 */
export function insertSource(
  editor: Editor,
  cite: CiteData,
  linkRange?: { from: number; to: number },
): "added" | "already-listed" {
  if (alreadyListed(editor, cite)) return "already-listed";

  const schema = editor.schema;
  const content = formatSource(cite).map((piece) => {
    const marks = [
      ...(piece.italic ? [schema.marks.italic.create()] : []),
      ...(piece.href ? [schema.marks.link.create({ href: piece.href })] : []),
    ];
    return schema.text(piece.text, marks);
  });
  const item = schema.nodes.listItem.create(null, schema.nodes.paragraph.create(null, content));

  const doc = editor.state.doc;
  const headingPos = findSourcesHeading(doc);
  let tr = editor.state.tr;

  // The mark goes on first: the insertion below only ever lands after the
  // selected text, so the range stays valid.
  const href = citeHref(cite);
  if (linkRange && href && linkRange.to > linkRange.from) {
    tr = tr.addMark(linkRange.from, linkRange.to, schema.marks.link.create({ href }));
  }

  if (headingPos !== null) {
    let listPos: number | null = null;
    doc.nodesBetween(headingPos, doc.content.size, (node, pos) => {
      if (listPos !== null) return false;
      if (node.type.name === "bulletList") {
        listPos = pos;
        return false;
      }
      // Stop at the next heading: the list must belong to this section.
      if (node.type.name === "heading" && pos > headingPos) return false;
      return true;
    });

    if (listPos !== null) {
      const list = doc.nodeAt(listPos);
      if (list) tr = tr.insert(listPos + list.nodeSize - 1, item);
    } else {
      const heading = doc.nodeAt(headingPos);
      if (heading) {
        tr = tr.insert(headingPos + heading.nodeSize, schema.nodes.bulletList.create(null, item));
      }
    }
  } else {
    const heading = schema.nodes.heading.create({ level: 2 }, schema.text("Sources"));
    const list = schema.nodes.bulletList.create(null, item);
    const end = doc.content.size;
    tr = tr.insert(end, heading).insert(end + heading.nodeSize, list);
  }

  editor.view.dispatch(tr);
  return "added";
}
