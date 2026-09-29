import "server-only";

import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  Packer,
  Paragraph,
  TabStopType,
  TextRun,
  convertInchesToTwip,
} from "docx";
import { normalizeCvData } from "@/lib/cv-data";
import { attachmentFilename } from "@/lib/server/attachment-filename";
import { isTemplateId, type CvData, type TemplateId } from "@/lib/types";
import { ensureUrl } from "@/lib/utils";

/**
 * Word (.docx) export.
 *
 * DOCX is a flow-document format, not a page-layout one. The 20 HTML templates
 * are built from CSS grids, rails and magazine spreads; pretending to reproduce
 * those in Word produces overflowing tables and floating messes that break exactly
 * where a .docx is needed most — ATS parsers and recruiters editing the file.
 *
 * So this renders one deliberate thing: a clean, single-column, ATS-safe document
 * that carries every section faithfully, dressed with the chosen template's
 * typography — its font, accent colour, header alignment and heading rule. Layout
 * the format cannot honestly support (columns, rails, drop caps) is dropped on
 * purpose rather than faked.
 */

export type DocxProfile = {
  /** A font Word actually ships with, so the file never falls back silently. */
  font: string;
  /** 6-digit hex, no leading '#'. */
  accent: string;
  headerAlign: "left" | "center";
  /** Rule under each section heading. */
  headingRule: boolean;
  /** Name size in half-points (docx measures type in half-points). */
  nameSize: number;
};

const SERIF = "Georgia";
const SANS = "Arial";

/**
 * Per-template typography, taken from the real values in
 * `src/lib/templates/styles.ts` (font-family, accent colour, header text-align),
 * with CSS-only font stacks mapped onto fonts Word has on both Windows and macOS.
 */
export const DOCX_PROFILES: Record<TemplateId, DocxProfile> = {
  jake: { font: "Times New Roman", accent: "1A1A1A", headerAlign: "center", headingRule: true, nameSize: 44 },
  modern: { font: SANS, accent: "0F172A", headerAlign: "left", headingRule: true, nameSize: 40 },
  compact: { font: SANS, accent: "333333", headerAlign: "left", headingRule: true, nameSize: 38 },
  elegant: { font: SERIF, accent: "B45309", headerAlign: "center", headingRule: true, nameSize: 44 },
  sidebar: { font: SANS, accent: "1E293B", headerAlign: "left", headingRule: true, nameSize: 40 },
  corporate: { font: "Calibri", accent: "1E3A5F", headerAlign: "left", headingRule: true, nameSize: 42 },
  tech: { font: "Courier New", accent: "047857", headerAlign: "left", headingRule: true, nameSize: 36 },
  minimal: { font: SANS, accent: "44403C", headerAlign: "left", headingRule: false, nameSize: 40 },
  harvard: { font: "Garamond", accent: "800000", headerAlign: "center", headingRule: true, nameSize: 44 },
  executive: { font: SERIF, accent: "0F172A", headerAlign: "left", headingRule: true, nameSize: 44 },
  creative: { font: SANS, accent: "4338CA", headerAlign: "left", headingRule: true, nameSize: 42 },
  // The preview uses #00FF66 on a near-black page. That green is invisible on white
  // paper, so the document uses the same palette's dark companion instead.
  terminal: { font: "Courier New", accent: "047857", headerAlign: "left", headingRule: true, nameSize: 36 },
  swiss: { font: SANS, accent: "CF312B", headerAlign: "left", headingRule: true, nameSize: 40 },
  scholar: { font: "Garamond", accent: "762F38", headerAlign: "center", headingRule: true, nameSize: 42 },
  timeline: { font: SANS, accent: "126B67", headerAlign: "left", headingRule: true, nameSize: 42 },
  mono: { font: "Courier New", accent: "1A1A1A", headerAlign: "left", headingRule: true, nameSize: 36 },
  atlas: { font: SANS, accent: "153A5B", headerAlign: "left", headingRule: true, nameSize: 44 },
  editorial: { font: SERIF, accent: "A14B36", headerAlign: "center", headingRule: true, nameSize: 48 },
  orbit: { font: SANS, accent: "6752A3", headerAlign: "center", headingRule: false, nameSize: 42 },
  "mono-grid": { font: "Courier New", accent: "191919", headerAlign: "left", headingRule: true, nameSize: 36 },
};

// Letter, matching the PDF's 8.5in × 11in sheet.
const PAGE = { widthIn: 8.5, heightIn: 11 };
const MARGIN = { topIn: 0.45, bottomIn: 0.45, leftIn: 0.55, rightIn: 0.55 };
const CONTENT_RIGHT_TAB = convertInchesToTwip(PAGE.widthIn - MARGIN.leftIn - MARGIN.rightIn);

const BODY_SIZE = 20; // 10pt
const META_SIZE = 18; // 9pt
const MUTED = "595959";

/** Resolve a stored template id the same way the HTML renderer does. */
function safeTemplate(template: unknown): TemplateId {
  return isTemplateId(template) ? template : "jake";
}

function heading(text: string, profile: DocxProfile): Paragraph {
  return new Paragraph({
    spacing: { before: 240, after: 80 },
    ...(profile.headingRule
      ? {
          border: {
            bottom: {
              style: BorderStyle.SINGLE,
              size: 6, // eighths of a point
              color: profile.accent,
              space: 2,
            },
          },
        }
      : {}),
    children: [
      new TextRun({
        text: text.toUpperCase(),
        bold: true,
        size: BODY_SIZE,
        font: profile.font,
        color: profile.accent,
      }),
    ],
  });
}

/** One entry line: left label, optional right-aligned meta (dates), via a tab stop. */
function entryLine(
  left: string,
  right: string,
  profile: DocxProfile,
  opts: { bold?: boolean; size?: number } = {},
): Paragraph {
  const runs: TextRun[] = [
    new TextRun({
      text: left,
      bold: opts.bold ?? false,
      size: opts.size ?? BODY_SIZE,
      font: profile.font,
    }),
  ];
  if (right) {
    runs.push(
      new TextRun({
        // A right tab keeps the dates on the same line without a table — tables are
        // what trip up ATS parsers.
        text: `\t${right}`,
        size: META_SIZE,
        font: profile.font,
        color: MUTED,
      }),
    );
  }
  return new Paragraph({
    tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_RIGHT_TAB }],
    spacing: { after: 20 },
    children: runs,
  });
}

function body(text: string, profile: DocxProfile, opts: { italics?: boolean } = {}): Paragraph {
  return new Paragraph({
    spacing: { after: 40 },
    children: [
      new TextRun({
        text,
        size: BODY_SIZE,
        font: profile.font,
        italics: opts.italics,
        color: MUTED,
      }),
    ],
  });
}

function bullet(text: string, profile: DocxProfile): Paragraph {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 20 },
    children: [new TextRun({ text, size: BODY_SIZE, font: profile.font })],
  });
}

function bullets(items: string[], profile: DocxProfile): Paragraph[] {
  return items.filter((t) => (t || "").trim()).map((t) => bullet(t.trim(), profile));
}

function linkRun(text: string, href: string, profile: DocxProfile): ExternalHyperlink {
  return new ExternalHyperlink({
    link: href,
    children: [
      new TextRun({ text, size: META_SIZE, font: profile.font, color: MUTED }),
    ],
  });
}

/** "Location | email | phone | github | website | linkedin", mirroring the PDF. */
function contactChildren(
  personal: CvData["personal"],
  profile: DocxProfile,
): (TextRun | ExternalHyperlink)[] {
  const out: (TextRun | ExternalHyperlink)[] = [];
  const sep = () => new TextRun({ text: " | ", size: META_SIZE, font: profile.font, color: MUTED });
  const plain = (t: string) => new TextRun({ text: t, size: META_SIZE, font: profile.font, color: MUTED });

  const push = (node: TextRun | ExternalHyperlink) => {
    if (out.length) out.push(sep());
    out.push(node);
  };

  if (personal.location) push(plain(personal.location));
  if (personal.email) push(linkRun(personal.email, `mailto:${personal.email}`, profile));
  if (personal.phone) push(plain(personal.phone));
  if (personal.github) push(linkRun(personal.github, ensureUrl(personal.github), profile));
  if (personal.website) push(linkRun(personal.website, ensureUrl(personal.website), profile));
  if (personal.linkedin) push(linkRun(personal.linkedin, ensureUrl(personal.linkedin), profile));
  return out;
}

/** Build the Word document. Kept separate from packing so tests can inspect it. */
export function buildDocxDocument(
  data: CvData,
  template: TemplateId,
  title?: string | null,
): Document {
  // Same normalize-then-render contract as renderResumeHtml: a null `data` column
  // must produce an empty CV, not a crash.
  const cv = normalizeCvData(data);
  const id = safeTemplate(template);
  const profile = DOCX_PROFILES[id];
  const align =
    profile.headerAlign === "center" ? AlignmentType.CENTER : AlignmentType.LEFT;

  const children: Paragraph[] = [];

  children.push(
    new Paragraph({
      alignment: align,
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: cv.personal.fullName || "Your Name",
          bold: true,
          size: profile.nameSize,
          font: profile.font,
          color: profile.accent,
        }),
      ],
    }),
  );

  const contacts = contactChildren(cv.personal, profile);
  if (contacts.length) {
    children.push(
      new Paragraph({ alignment: align, spacing: { after: 60 }, children: contacts }),
    );
  }

  if (cv.summary.trim()) {
    children.push(heading("Professional Summary", profile));
    children.push(body(cv.summary.trim(), profile));
  }

  if (cv.education.length) {
    children.push(heading("Education", profile));
    for (const e of cv.education) {
      children.push(entryLine(e.school || "", e.location || "", profile, { bold: true }));
      children.push(entryLine(e.degree || "", e.period || "", profile, { size: META_SIZE }));
      children.push(...bullets(e.bullets ?? [], profile));
    }
  }

  if (cv.experience.length) {
    children.push(heading("Experience", profile));
    for (const e of cv.experience) {
      children.push(entryLine(e.company || "", e.location || "", profile, { bold: true }));
      children.push(entryLine(e.role || "", e.period || "", profile, { size: META_SIZE }));
      children.push(...bullets(e.bullets ?? [], profile));
    }
  }

  if (cv.projects.length) {
    children.push(heading("Projects", profile));
    for (const e of cv.projects) {
      const name = e.name || "";
      if (e.link) {
        const href = ensureUrl(e.link);
        children.push(
          new Paragraph({
            tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_RIGHT_TAB }],
            spacing: { after: 20 },
            children: [
              new TextRun({
                text: `${name} — `,
                bold: true,
                size: BODY_SIZE,
                font: profile.font,
              }),
              linkRun(e.link, href, profile),
              new TextRun({
                text: `\t${e.period || ""}`,
                size: META_SIZE,
                font: profile.font,
                italics: true,
                color: MUTED,
              }),
            ],
          }),
        );
      } else {
        children.push(entryLine(name, e.period || "", profile, { bold: true }));
      }
      children.push(...bullets(e.bullets ?? [], profile));
    }
  }

  if (cv.publications.length) {
    children.push(heading("Publications", profile));
    for (const p of cv.publications) {
      const text = (p.text || "").trim();
      if (!text) continue;
      if (p.url) {
        const href = ensureUrl(p.url);
        children.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({ text: `${text} `, size: BODY_SIZE, font: profile.font }),
              linkRun(href.replace(/^https?:\/\//, ""), href, profile),
            ],
          }),
        );
      } else {
        children.push(body(text, profile));
      }
    }
  }

  const skills = cv.skills.filter((s) => (s.category || s.items || "").trim());
  if (skills.length) {
    children.push(heading("Technical Skills", profile));
    for (const s of skills) {
      children.push(
        new Paragraph({
          spacing: { after: 20 },
          children: [
            ...(s.category
              ? [
                  new TextRun({
                    text: `${s.category}: `,
                    bold: true,
                    size: BODY_SIZE,
                    font: profile.font,
                  }),
                ]
              : []),
            new TextRun({ text: s.items || "", size: BODY_SIZE, font: profile.font }),
          ],
        }),
      );
    }
  }

  const langs = cv.languages.filter((l) => (l.name || "").trim());
  if (langs.length) {
    children.push(heading("Languages", profile));
    children.push(
      new Paragraph({
        spacing: { after: 20 },
        children: langs.flatMap((l, i) => [
          ...(i
            ? [new TextRun({ text: " · ", size: BODY_SIZE, font: profile.font, color: MUTED })]
            : []),
          new TextRun({ text: l.name, bold: true, size: BODY_SIZE, font: profile.font }),
          ...(l.level
            ? [new TextRun({ text: `: ${l.level}`, size: BODY_SIZE, font: profile.font })]
            : []),
        ]),
      }),
    );
  }

  return new Document({
    creator: "Resumify",
    title: cv.personal.fullName || title || "Resume",
    description: "CV diekspor dari Resumify",
    styles: {
      default: {
        document: { run: { font: profile.font, size: BODY_SIZE } },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              width: convertInchesToTwip(PAGE.widthIn),
              height: convertInchesToTwip(PAGE.heightIn),
            },
            margin: {
              top: convertInchesToTwip(MARGIN.topIn),
              bottom: convertInchesToTwip(MARGIN.bottomIn),
              left: convertInchesToTwip(MARGIN.leftIn),
              right: convertInchesToTwip(MARGIN.rightIn),
            },
          },
        },
        children,
      },
    ],
  });
}

export async function generateDocx(
  data: CvData,
  template: TemplateId,
  title?: string | null,
): Promise<Buffer> {
  // No headless browser involved, so unlike the PDF path this cannot fail on a
  // missing Chromium — Word export works wherever the app runs.
  return Packer.toBuffer(buildDocxDocument(data, template, title));
}

export function docxFilename(title: string | null | undefined): string {
  return attachmentFilename(title, "docx");
}
