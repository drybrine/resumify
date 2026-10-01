import assert from "node:assert/strict";
import test from "node:test";
import { normalizeCvData, SAMPLE_CV } from "../src/lib/cv-data";
import { PHOTO_MAX_CHARS, safePhoto } from "../src/lib/photo";
import { renderResumeHtml } from "../src/lib/templates/render";
import { generateDocx } from "../src/lib/server/docx";
import { ALL_TEMPLATES, type CvData, type TemplateId } from "../src/lib/types";
import { listZipEntries } from "../src/lib/zip";

// A real 1×1 PNG, so the bytes are genuinely a decodable image.
const PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

const withPhoto = (photo: string): CvData => ({
  ...SAMPLE_CV,
  personal: { ...SAMPLE_CV.personal, photo },
});

test("safePhoto accepts only small raster data URLs", () => {
  assert.equal(safePhoto(PNG), PNG);
  assert.equal(safePhoto("data:image/jpeg;base64,AAAA"), "data:image/jpeg;base64,AAAA");
  assert.equal(safePhoto("data:image/webp;base64,AAAA"), "data:image/webp;base64,AAAA");
  // jpg is a real, if unusual, spelling.
  assert.equal(safePhoto("data:image/jpg;base64,AAAA"), "data:image/jpg;base64,AAAA");
  // whitespace around a valid value is tolerated.
  assert.equal(safePhoto(`  ${PNG}  `), PNG);
});

test("safePhoto refuses anything that could be script or is not an image", () => {
  for (const bad of [
    undefined,
    null,
    42,
    "",
    "   ",
    // SVG can carry <script>, and this string ends up in an `src` attribute of a
    // document rendered by a headless browser on the server.
    "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=",
    'data:image/svg+xml,<svg onload="alert(1)"></svg>',
    // Not a data URL at all.
    "https://example.com/me.png",
    "/uploads/me.png",
    "javascript:alert(1)",
    'data:image/png;base64,AAA" onerror="alert(1)',
    "data:text/html;base64,PHNjcmlwdD4=",
    "data:image/png,notbase64",
    `data:image/png;base64,${"A".repeat(PHOTO_MAX_CHARS)}`,
  ]) {
    assert.equal(safePhoto(bad), "", `should have been refused: ${String(bad).slice(0, 60)}`);
  }
});

test("normalizeCvData keeps a valid photo and drops an invalid one", () => {
  assert.equal(normalizeCvData(withPhoto(PNG)).personal.photo, PNG);
  assert.equal(normalizeCvData(withPhoto("https://x/y.png")).personal.photo, "");
  assert.equal(normalizeCvData({}).personal.photo, "");
});

test("every template renders the photo, and nothing else changes", () => {
  for (const id of ALL_TEMPLATES as TemplateId[]) {
    const plain = renderResumeHtml(SAMPLE_CV, id);
    const photoTag = `<img class="cv-photo" src="${PNG}" alt="" />`;
    const withIt = renderResumeHtml(withPhoto(PNG), id);

    assert.equal(
      (withIt.match(/class="cv-photo"/g) ?? []).length,
      1,
      `${id}: expected exactly one photo`,
    );
    assert.ok(withIt.includes(photoTag), `${id}: photo tag not found verbatim`);

    // Removing the tag must reproduce the photo-less render exactly — i.e. adding a
    // photo cannot disturb anything else in the document.
    assert.equal(
      withIt.replace(photoTag, ""),
      plain,
      `${id}: the photo changed more than the photo`,
    );
  }
});

test("no template renders an image when there is no photo", () => {
  for (const id of ALL_TEMPLATES as TemplateId[]) {
    const html = renderResumeHtml(SAMPLE_CV, id);
    assert.ok(!html.includes("cv-photo"), `${id}: rendered a photo-less image element`);
    assert.ok(!html.includes("<img"), `${id}: rendered an unexpected <img>`);
  }
});

test("an invalid photo is not rendered anywhere", () => {
  for (const id of ALL_TEMPLATES as TemplateId[]) {
    const html = renderResumeHtml(withPhoto("data:image/svg+xml,<svg/>"), id);
    assert.ok(!html.includes("cv-photo"), `${id}: rendered a refused photo`);
    assert.ok(!html.includes("<svg"), `${id}: leaked markup from the photo field`);
  }
});

test("Word embeds the photo for formats Word supports", async () => {
  const buf = await generateDocx(withPhoto(PNG), "jake", "CV");
  const media = listZipEntries(buf).filter((n) => n.startsWith("word/media/"));
  assert.ok(media.length > 0, "no image part in the .docx");
});

test("Word skips formats it cannot decode instead of embedding a broken image", async () => {
  // Word has no webp decoder; a broken image in the file is worse than no image.
  const webp = "data:image/webp;base64,AAAA";
  const buf = await generateDocx(withPhoto(webp), "jake", "CV");
  const media = listZipEntries(buf).filter((n) => n.startsWith("word/media/"));
  assert.equal(media.length, 0, `unexpected image part: ${media.join(", ")}`);
});

test("without a photo, Word stays a photo-less document", async () => {
  const buf = await generateDocx(SAMPLE_CV, "jake", "CV");
  const media = listZipEntries(buf).filter((n) => n.startsWith("word/media/"));
  assert.equal(media.length, 0, `unexpected image part: ${media.join(", ")}`);
});
