import "server-only";

import { AlignmentType, Document, Packer, Paragraph, TextRun } from "docx";
import { attachmentFilename } from "@/lib/server/attachment-filename";
import { PAPER } from "@/lib/paper";

/**
 * The cover letter as .docx.
 *
 * Same reasoning as the CV export: a letter is a flow document, so it is emitted
 * as straight paragraphs — no tables, no columns, nothing an ATS or a mail merge
 * could trip over.
 */

const FONT = "Times New Roman";
const SIZE = 23; // 11.5pt in half-points

export function buildLetterDocument(letter: string, title?: string | null): Document {
  const blocks = letter
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  const children: Paragraph[] = blocks.map((block) => {
    const lines = block.split("\n").map((l) => l.trim());
    const isSignature = /^hormat saya|^sincerely/i.test(block);
    return new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: isSignature ? 60 : 180, before: isSignature ? 260 : 0 },
      children: lines.flatMap((line, i) => [
        ...(i
          ? [new TextRun({ text: "", break: 1, font: FONT, size: SIZE })]
          : []),
        new TextRun({
          text: line,
          font: FONT,
          size: SIZE,
          // The name line under the sign-off carries the emphasis.
          bold: isSignature && i >= 2,
        }),
      ]),
    });
  });

  return new Document({
    creator: "Resumify",
    title: title || "Surat Lamaran",
    description: "Surat lamaran dibuat di Resumify",
    styles: { default: { document: { run: { font: FONT, size: SIZE } } } },
    sections: [
      {
        properties: {
          page: {
            // Stated explicitly: without it `docx` falls back to its own Letter
            // default while the PDF of the same letter is A4.
            size: {
              width: PAPER.widthTwip,
              height: PAPER.heightTwip,
            },
            margin: {
              top: 1296, // 0.9in in twips
              bottom: 1296,
              left: 1440, // 1in
              right: 1440,
            },
          },
        },
        children,
      },
    ],
  });
}

export async function generateLetterDocx(
  letter: string,
  title?: string | null,
): Promise<Buffer> {
  return Packer.toBuffer(buildLetterDocument(letter, title));
}

export function letterDocxFilename(title: string | null | undefined): string {
  return attachmentFilename(title, "docx");
}
