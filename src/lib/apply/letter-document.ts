import { esc } from "@/lib/utils";

/**
 * A cover letter as a standalone document, for the PDF export.
 *
 * Deliberately plain: a letter is correspondence, not a designed artifact. One
 * column, generous margins, nothing that a mail client or a print dialog could
 * mangle.
 */

const LETTER_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: "Times New Roman", Times, Georgia, serif;
    font-size: 11.5pt;
    line-height: 1.5;
    color: #111;
    background: #fff;
  }
  .letter {
    width: 8.5in;
    min-height: 11in;
    padding: 0.9in 1in;
  }
  .letter p { margin-bottom: 10pt; text-align: justify; }
  .letter .sig { margin-top: 18pt; }
  .letter .sig-name { font-weight: 700; }
  .letter .sig-meta { font-size: 10pt; color: #444; }
`;

/**
 * Blank-line-separated blocks become paragraphs; single newlines inside a block
 * stay as line breaks (that is how an address block or a signature is written).
 */
export function renderLetterBody(letter: string): string {
  const blocks = letter
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  return blocks
    .map((block) => {
      const lines = block.split("\n").map((l) => esc(l.trim()));
      const cls = /^hormat saya|^sincerely/i.test(block) ? ' class="sig"' : "";
      return `<p${cls}>${lines.join("<br />")}</p>`;
    })
    .join("");
}

export function wrapLetterDocument(bodyHtml: string, title = "Surat Lamaran"): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${esc(title)}</title>
  <style>${LETTER_CSS}</style>
</head>
<body>
  <article class="letter">${bodyHtml}</article>
</body>
</html>`;
}
