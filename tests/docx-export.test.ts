import assert from "node:assert/strict";
import test from "node:test";
import { inflateRawSync } from "node:zlib";
import { SAMPLE_CV } from "../src/lib/cv-data";
import { DOCX_PROFILES, docxFilename, generateDocx } from "../src/lib/server/docx";
import { ALL_TEMPLATES, type CvData, type TemplateId } from "../src/lib/types";

/**
 * Minimal ZIP reader: a .docx is a ZIP of OOXML parts, and Node ships no zip
 * reader, so this walks the central directory and inflates the entry asked for.
 * Only what the assertions need — no dependency added for a test.
 */
function readZipEntry(zip: Buffer, want: string): string | null {
  // End of central directory: scan back for its signature.
  let eocd = -1;
  for (let i = zip.length - 22; i >= 0; i--) {
    if (zip.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) return null;
  const count = zip.readUInt16LE(eocd + 10);
  let p = zip.readUInt32LE(eocd + 16);

  for (let n = 0; n < count; n++) {
    if (zip.readUInt32LE(p) !== 0x02014b50) return null;
    const method = zip.readUInt16LE(p + 10);
    const compressedSize = zip.readUInt32LE(p + 20);
    const nameLen = zip.readUInt16LE(p + 28);
    const extraLen = zip.readUInt16LE(p + 30);
    const commentLen = zip.readUInt16LE(p + 32);
    const localOffset = zip.readUInt32LE(p + 42);
    const name = zip.subarray(p + 46, p + 46 + nameLen).toString("utf8");

    if (name === want) {
      // Local header repeats name/extra lengths, which may differ from the
      // central directory — read them from the local header.
      const lNameLen = zip.readUInt16LE(localOffset + 26);
      const lExtraLen = zip.readUInt16LE(localOffset + 28);
      const start = localOffset + 30 + lNameLen + lExtraLen;
      const data = zip.subarray(start, start + compressedSize);
      return (method === 0 ? data : inflateRawSync(data)).toString("utf8");
    }
    p += 46 + nameLen + extraLen + commentLen;
  }
  return null;
}

const isZip = (b: Buffer) => b.subarray(0, 2).toString("latin1") === "PK";

/** Fonts Word ships on Windows and macOS. A CSS-only name would fall back silently. */
const WORD_SAFE_FONTS = new Set([
  "Arial",
  "Calibri",
  "Courier New",
  "Garamond",
  "Georgia",
  "Times New Roman",
]);

test("every template has a Word profile", () => {
  for (const id of ALL_TEMPLATES) {
    const p = DOCX_PROFILES[id];
    assert.ok(p, `${id} has no DOCX profile — Word export would render unstyled`);
  }
  // and no strays
  assert.deepEqual(
    Object.keys(DOCX_PROFILES).sort(),
    [...ALL_TEMPLATES].sort(),
    "DOCX_PROFILES and ALL_TEMPLATES disagree",
  );
});

test("profiles only use fonts Word actually ships", () => {
  for (const [id, p] of Object.entries(DOCX_PROFILES)) {
    assert.ok(
      WORD_SAFE_FONTS.has(p.font),
      `${id} uses "${p.font}", which Word may not have — it would fall back silently`,
    );
  }
});

test("profile accents are 6-digit hex", () => {
  // docx writes w:color w:val="…": anything else (a named colour, #fff, an
  // 8-digit hex) produces a file Word reports as corrupt.
  for (const [id, p] of Object.entries(DOCX_PROFILES)) {
    assert.match(p.accent, /^[0-9A-F]{6}$/, `${id} accent "${p.accent}" is not 6-digit hex`);
  }
});

test("every template produces a structurally valid .docx", async () => {
  for (const id of ALL_TEMPLATES) {
    const buf = await generateDocx(SAMPLE_CV, id, "John Doe CV");
    assert.ok(isZip(buf), `${id}: not a ZIP (docx) container`);

    const contentTypes = readZipEntry(buf, "[Content_Types].xml");
    const document = readZipEntry(buf, "word/document.xml");
    const styles = readZipEntry(buf, "word/styles.xml");
    assert.ok(contentTypes, `${id}: missing [Content_Types].xml`);
    assert.match(contentTypes, /wordprocessingml\.document\.main\+xml/, `${id}: content type wrong`);
    assert.ok(document, `${id}: missing word/document.xml`);
    assert.ok(styles, `${id}: missing word/styles.xml`);
    assert.ok(document.startsWith("<?xml"), `${id}: document.xml is not XML`);
  }
});

test("the chosen template's typography reaches the document", async () => {
  // Which font/colour is on the page, not just in the profile map: this catches a
  // profile that exists but is never actually applied.
  for (const id of ALL_TEMPLATES) {
    const buf = await generateDocx(SAMPLE_CV, id, "CV");
    const document = readZipEntry(buf, "word/document.xml") ?? "";
    const p = DOCX_PROFILES[id];

    assert.ok(document.includes(`w:ascii="${p.font}"`), `${id}: font ${p.font} not applied`);
    assert.ok(
      document.includes(`w:val="${p.accent}"`),
      `${id}: accent ${p.accent} not applied`,
    );
    const align = p.headerAlign === "center" ? "center" : "left";
    assert.ok(document.includes(`w:val="${align}"`), `${id}: header alignment not applied`);
  }
});

test("the document carries the CV's content, in order", async () => {
  const buf = await generateDocx(SAMPLE_CV, "jake", "John Doe CV");
  const xml = readZipEntry(buf, "word/document.xml") ?? "";
  // Text runs are split across elements; strip tags to read what a human sees.
  const text = xml.replace(/<[^>]+>/g, "");

  for (const needle of [
    "John Doe",
    "john.doe@example.com",
    "EDUCATION",
    "EXPERIENCE",
    "PROJECTS",
    "PUBLICATIONS",
    "TECHNICAL SKILLS",
    "LANGUAGES",
    "Springfield State University",
    "Acme Media Productions",
  ]) {
    assert.ok(text.includes(needle), `document is missing "${needle}"`);
  }

  // Reading order: the name comes before Education, which comes before Experience.
  const at = (s: string) => text.indexOf(s);
  assert.ok(at("John Doe") < at("EDUCATION"), "name should precede EDUCATION");
  assert.ok(at("EDUCATION") < at("EXPERIENCE"), "EDUCATION should precede EXPERIENCE");
  assert.ok(at("EXPERIENCE") < at("PROJECTS"), "EXPERIENCE should precede PROJECTS");
});

test("a null or junk data column still yields a valid document", async () => {
  // The same failure that broke PDF export: renderers reading straight into
  // `data.personal`. Word export must degrade, not throw.
  for (const junk of [null, undefined, {}, { personal: null, experience: [null, "x"] }]) {
    const buf = await generateDocx(junk as unknown as CvData, "swiss", "CV");
    assert.ok(isZip(buf), `junk data ${JSON.stringify(junk)} produced an invalid file`);
    const xml = readZipEntry(buf, "word/document.xml") ?? "";
    assert.ok(xml.length > 0, "empty document.xml");
    // The junk summary `7` and the literal string "undefined" must not leak in.
    assert.ok(!xml.includes("undefined"), "leaked the string 'undefined'");
  }
});

test("docxFilename is a safe .docx attachment header", () => {
  const good = docxFilename("CV Surya");
  assert.match(good, /^attachment; filename="[^"]+\.docx"/);
  assert.match(good, /filename\*=UTF-8''/);

  for (const nasty of ["", "   ", "...", null, undefined, "../../etc/passwd"]) {
    const h = docxFilename(nasty);
    assert.ok(!/[\r\n]/.test(h), `CR/LF survived: ${JSON.stringify(h)}`);
    const ascii = h.match(/filename="([^"]*)"/)?.[1] ?? "";
    assert.ok(ascii.endsWith(".docx"), `no .docx suffix: ${ascii}`);
    assert.ok(!/[/\\]/.test(ascii), `path separator survived: ${ascii}`);
  }
});

test("an unknown template id falls back instead of rendering unstyled", async () => {
  const buf = await generateDocx(SAMPLE_CV, "not-a-template" as TemplateId, "CV");
  const xml = readZipEntry(buf, "word/document.xml") ?? "";
  assert.ok(xml.includes(`w:ascii="${DOCX_PROFILES.jake.font}"`), "did not fall back to jake");
});
