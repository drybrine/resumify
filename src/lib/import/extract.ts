import "server-only";

import { getDocumentProxy } from "unpdf";
import { isZip, readZipEntry } from "@/lib/zip";

/**
 * Pull readable lines out of an uploaded CV.
 *
 * Both formats are reduced to the same shape: `{ text, indent }` where a **tab** in
 * `text` marks a column break and `indent` is the left offset of the line.
 *
 * Two details matter, and both come from looking at real exports:
 *
 * 1. **Column breaks.** A CV is full of two-column rows ("University … Location",
 *    "Degree … 2018–2021"). Flattened, they read "Bandung, IndonesiaSarjana (S1),
 *    Sistem Komputer". The tab keeps the fields apart.
 * 2. **Indentation.** There are no bullet glyphs in the extracted text (the marker
 *    is drawn outside the text flow), so the only reliable way to tell a bullet
 *    from an entry heading is that bullets sit further right — 14pt further in our
 *    own templates, matching `ul { margin-left: 14pt }`.
 */

export type CvLine = {
  text: string;
  /** Left offset in points (PDF) or a stand-in (DOCX, where lists get 12). */
  indent: number;
  /**
   * Rendered width in points, used to tell a wrapped line from a finished one.
   * **0 means unknown** (DOCX), which switches that detection off — a DOCX
   * paragraph is already a complete logical line, so nothing needs rejoining.
   */
  width: number;
};

export type ExtractResult = {
  lines: CvLine[];
  pageCount: number;
  charCount: number;
};

/** A gap wider than this many ems is a column break rather than a word space. */
const COLUMN_GAP_EMS = 1.6;
/** Any gap wider than this fraction of the font size is a word space. */
const WORD_GAP_EMS = 0.12;

type TextItem = { str: string; x: number; y: number; width: number; size: number };

/** Group one page's text runs into lines, splitting columns on wide gaps. */
function pageToLines(items: TextItem[]): CvLine[] {
  if (!items.length) return [];

  const rows = new Map<number, TextItem[]>();
  for (const it of items) {
    // Positions are floats; quarter-point buckets keep one visual line together.
    const key = Math.round(it.y * 4);
    const bucket = rows.get(key);
    if (bucket) bucket.push(it);
    else rows.set(key, [it]);
  }

  const out: CvLine[] = [];
  for (const key of [...rows.keys()].sort((a, b) => b - a)) {
    const row = rows.get(key)!.slice().sort((a, b) => a.x - b.x);
    let text = "";
    let end: number | null = null;
    let size = 10;

    for (const it of row) {
      if (end !== null) {
        const gap = it.x - end;
        if (gap > Math.max(6, size * COLUMN_GAP_EMS)) text += "\t";
        // Chrome's PDFs often carry no explicit space glyph, so a word gap has to
        // be inferred from the offset. Too high a threshold glues words together
        // ("TECHNICALSKILLS"); too low a one splits words apart.
        else if (gap > size * WORD_GAP_EMS) text += " ";
      }
      text += it.str;
      end = it.x + it.width;
      size = it.size || size;
    }

    const trimmed = text.replace(/[ \t]+$/, "");
    if (trimmed.trim()) {
      out.push({
        text: trimmed,
        indent: Math.round(row[0].x * 10) / 10,
        width: Math.round(((end ?? row[0].x) - row[0].x) * 10) / 10,
      });
    }
  }
  return out;
}

async function fromPdf(bytes: Buffer): Promise<ExtractResult> {
  const pdf = await getDocumentProxy(new Uint8Array(bytes));
  const lines: CvLine[] = [];

  for (let n = 1; n <= pdf.numPages; n++) {
    const page = await pdf.getPage(n);
    const content = await page.getTextContent();
    const items: TextItem[] = [];

    for (const raw of content.items as unknown[]) {
      const it = raw as {
        str?: string;
        transform?: number[];
        width?: number;
        height?: number;
      };
      if (typeof it.str !== "string" || !it.str.trim()) continue;
      const t = it.transform ?? [1, 0, 0, 1, 0, 0];
      items.push({
        str: it.str,
        x: t[4],
        y: t[5],
        width: it.width ?? 0,
        // The y-scale of the text matrix is the effective font size.
        size: Math.abs(t[3] || it.height || 10),
      });
    }

    lines.push(...pageToLines(items));
  }

  return {
    lines,
    pageCount: pdf.numPages,
    charCount: lines.map((l) => l.text).join("\n").length,
  };
}

/* --------------------------------------------------------------------- docx */

const decodeXml = (s: string): string =>
  s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCharCode(Number(d)))
    .replace(/&amp;/g, "&");

/** Text of one `<w:p>`, with tabs and breaks preserved. */
function paragraphText(xml: string): string {
  let out = "";
  const tokens =
    xml.match(/<w:t(?:\s[^>]*)?>[\s\S]*?<\/w:t>|<w:tab\b[^>]*\/?>|<w:br\b[^>]*\/?>/g) ?? [];
  for (const tok of tokens) {
    if (tok.startsWith("<w:t")) {
      out += decodeXml(tok.slice(tok.indexOf(">") + 1, tok.lastIndexOf("</w:t>")));
    } else if (tok.startsWith("<w:tab")) {
      out += "\t";
    } else {
      out += "\n";
    }
  }
  return out;
}

/** A DOCX list level gives no points; this stand-in just has to read as "indented". */
const DOCX_LIST_INDENT = 12;

async function fromDocx(bytes: Buffer): Promise<ExtractResult> {
  const xml = readZipEntry(bytes, "word/document.xml");
  if (!xml) return { lines: [], pageCount: 0, charCount: 0 };

  const lines: CvLine[] = [];
  const push = (text: string, indent: number) => {
    for (const part of text.split("\n")) {
      const line = part.replace(/[ \t]+$/, "").trim();
      if (line) lines.push({ text: line, indent, width: 0 });
    }
  };

  // Tables first: a table row is a two-column row in disguise, so its cells become
  // tab-separated fields.
  for (const block of xml.split(/(?=<w:tbl[\s>])/)) {
    if (/^<w:tbl[\s>]/.test(block)) {
      const end = block.indexOf("</w:tbl>");
      const table = end < 0 ? block : block.slice(0, end + 8);
      for (const row of table.match(/<w:tr[\s>][\s\S]*?<\/w:tr>/g) ?? []) {
        const cells = (row.match(/<w:tc[\s>][\s\S]*?<\/w:tc>/g) ?? []).map((c) =>
          paragraphText(c).replace(/\s*\n\s*/g, " ").trim(),
        );
        const line = cells.filter(Boolean).join("\t");
        if (line) lines.push({ text: line, indent: 0, width: 0 });
      }
      continue;
    }

    for (const p of block.match(/<w:p[\s>][\s\S]*?<\/w:p>/g) ?? []) {
      const isList = /<w:numPr[\s>]/.test(p);
      const text = paragraphText(p);
      if (isList) {
        push(`• ${text.replace(/\s*\n\s*/g, " ").trim()}`, DOCX_LIST_INDENT);
      } else {
        push(text, 0);
      }
    }
  }

  return { lines, pageCount: 0, charCount: lines.map((l) => l.text).join("\n").length };
}

/* -------------------------------------------------------------------- entry */

export const MAX_IMPORT_BYTES = 8 * 1024 * 1024;

export type ImportFile = { name: string; type: string; bytes: Buffer };

/**
 * Extract lines from an uploaded CV, choosing the reader by content rather than by
 * the browser-supplied MIME type (often empty or wrong).
 */
export async function extractCvLines(file: ImportFile): Promise<ExtractResult> {
  if (file.bytes.byteLength > MAX_IMPORT_BYTES) {
    throw new Error("File-nya lebih dari 8 MB. Kirim versi yang lebih kecil.");
  }

  const head = file.bytes.subarray(0, 5).toString("latin1");
  const lower = file.name.toLowerCase();

  if (head.startsWith("%PDF")) return fromPdf(file.bytes);
  if (isZip(file.bytes) || lower.endsWith(".docx")) return fromDocx(file.bytes);

  throw new Error("Format belum didukung. Kirim PDF atau Word (.docx) saja.");
}
