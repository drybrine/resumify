import assert from "node:assert/strict";
import test from "node:test";
import { normalizeCvData, SAMPLE_CV } from "../src/lib/cv-data";
import { buildLetter, extractKeywords, matchKeywords } from "../src/lib/apply/letter";
import { EMPTY_KIT, normalizeApplicationKit } from "../src/lib/apply/kit";
import { renderLetterBody, wrapLetterDocument } from "../src/lib/apply/letter-document";
import { buildLetterDocument } from "../src/lib/server/letter-docx";
import type { CvData } from "../src/lib/types";
import { readZipEntry } from "./helpers/zip";

const kit = (over: Partial<typeof EMPTY_KIT> = {}) => ({ ...EMPTY_KIT, ...over });

const AD = `
Backend Engineer — PT Contoh Sejahtera
Kami mencari Backend Engineer dengan pengalaman TypeScript dan Node.js.
Tanggung jawab: membangun REST API, mengelola PostgreSQL, dan bekerja dengan Kubernetes.
Kualifikasi: minimal 2 tahun pengalaman, mampu bekerja dalam tim, bersedia bekerja di Jakarta.
Nilai tambah: pengalaman dengan Docker dan CI/CD.
`;

/* ------------------------------------------------------------------ keywords */

test("extractKeywords keeps signal and drops filler", () => {
  const words = extractKeywords(AD);
  // Repeated, meaningful terms survive.
  assert.ok(words.includes("backend"), JSON.stringify(words));
  assert.ok(words.includes("typescript"));
  assert.ok(words.includes("kubernetes"));
  // Filler does not.
  for (const noise of ["dan", "dengan", "yang", "kami", "untuk", "minimal", "tim"]) {
    assert.ok(!words.includes(noise), `stopword leaked: ${noise}`);
  }
  // A bare number is not a keyword.
  assert.ok(!words.includes("2"));
});

test("extractKeywords keeps punctuation that carries meaning", () => {
  const words = extractKeywords("Wajib: C++, C# dan Next.js. Bonus: Node.js dan 3D.");
  for (const want of ["c++", "c#", "next.js", "node.js"]) {
    assert.ok(words.includes(want), `lost ${want}: ${JSON.stringify(words)}`);
  }
});

test("extractKeywords is bounded and stable", () => {
  const many = Array.from({ length: 200 }, (_, i) => `skill${i}`).join(" ");
  assert.ok(extractKeywords(many).length <= 24);
  // Same input, same output: the ordering is what the UI shows.
  assert.deepEqual(extractKeywords(AD), extractKeywords(AD));
});

test("matchKeywords separates what the CV has from what it lacks", () => {
  const res = matchKeywords(AD, SAMPLE_CV);
  assert.ok(res.matched.includes("typescript"), JSON.stringify(res.matched));
  assert.ok(res.missing.includes("kubernetes"), JSON.stringify(res.missing));
  assert.equal(res.matched.length + res.missing.length > 0, true);
  assert.equal(res.score, Math.round((res.matched.length / (res.matched.length + res.missing.length)) * 100));
});

test("matchKeywords with no ad reports nothing rather than a false score", () => {
  const res = matchKeywords("", SAMPLE_CV);
  assert.deepEqual(res, { matched: [], missing: [], score: 0 });
});

/* -------------------------------------------------------------------- letter */

test("the letter uses only facts from the CV and the form", () => {
  const letter = buildLetter(
    SAMPLE_CV,
    kit({ company: "PT Contoh Sejahtera", role: "Backend Engineer", source: "LinkedIn" }),
  );

  // Every one of these exists in SAMPLE_CV or was typed by the user.
  for (const needle of [
    "John Doe",
    "PT Contoh Sejahtera",
    "Backend Engineer",
    "LinkedIn",
    "Acme Media Productions",
    "Springfield State University",
  ]) {
    assert.ok(letter.includes(needle), `letter is missing "${needle}"`);
  }

  // Nothing invented: no placeholder text leaks when the fields are filled.
  assert.ok(!letter.includes("………………"), "placeholder leaked into a filled letter");
  assert.ok(!/undefined|null|NaN/.test(letter), "a missing field leaked into the letter");
});

test("an empty CV still produces a usable letter", () => {
  const bare = normalizeCvData(null);
  const letter = buildLetter(bare, kit({ company: "Acme", role: "Engineer" }));

  assert.ok(letter.includes("Acme"));
  assert.ok(letter.includes("Engineer"));
  // The blanks are visible so the user knows what to fill in.
  assert.ok(letter.includes("………………"));
  assert.ok(!/undefined|null|NaN/.test(letter), "a missing field leaked into the letter");
});

test("the letter follows the requested language", () => {
  const id = buildLetter(SAMPLE_CV, kit({ role: "Engineer", language: "id" }));
  const en = buildLetter(SAMPLE_CV, kit({ role: "Engineer", language: "en" }));

  assert.match(id, /Dengan hormat/);
  assert.match(id, /Hormat saya/);
  assert.match(en, /Dear Hiring Manager/);
  assert.match(en, /Sincerely/);
});

test("CV bullets are quoted verbatim, never glued into a sentence", () => {
  // A CV in English against a letter in Indonesian used to produce hybrids like
  // "Di sana saya supported media production operations". The bullet is now quoted
  // on its own line instead of being grammaticalised into the prose.
  const cv: CvData = {
    ...SAMPLE_CV,
    experience: [
      { ...SAMPLE_CV.experience[0], bullets: ["Supported media production operations."] },
    ],
  };
  const id = buildLetter(cv, kit({ company: "Acme", role: "Engineer", language: "id" }));

  // The bullet survives exactly, with its own capital letter.
  assert.ok(id.includes("• Supported media production operations."), id);
  // And is not embedded in an Indonesian clause.
  assert.ok(
    !/saya\s+supported|saya\s+built|saya\s+implemented/i.test(id),
    `bullet was glued into the prose: ${id.slice(0, 200)}`,
  );
  // Either wording is acceptable as long as it is one of the two intros.
  assert.ok(id.includes("Beberapa hal yang saya kerjakan di sana:"));
});

/* ------------------------------------------------------------------ document */

test("renderLetterBody escapes everything it is given", () => {
  const body = renderLetterBody('<script>alert(1)</script>\nSecond line\n\nNext block & "quote"');
  assert.ok(!body.includes("<script"), "script tag survived");
  assert.ok(body.includes("&lt;script&gt;"));
  assert.ok(body.includes("&amp;"));
  // Two blocks -> two paragraphs; a single newline stays a line break.
  assert.equal((body.match(/<p/g) ?? []).length, 2);
  assert.ok(body.includes("<br />"));
});

test("wrapLetterDocument is a self-contained page", () => {
  const html = wrapLetterDocument(renderLetterBody("Halo"), "Surat");
  assert.ok(html.startsWith("<!DOCTYPE html>"));
  assert.ok(html.includes("<title>Surat</title>"));
  assert.ok(html.includes('class="letter"'));
  assert.ok(html.includes("Times New Roman"));
  // The title is escaped too.
  assert.ok(!wrapLetterDocument("<x>", "<b>").includes("<b>"));
});

test("the letter .docx is a valid document carrying the text", async () => {
  const letter = "Hormat saya,\n\nJohn Doe\njohn@example.com";
  const buf = await (await import("docx")).Packer.toBuffer(buildLetterDocument(letter, "Surat"));

  assert.equal(buf.subarray(0, 2).toString("latin1"), "PK");
  const xml = readZipEntry(buf, "word/document.xml") ?? "";
  assert.ok(xml.length > 0);
  const text = xml.replace(/<[^>]+>/g, "");
  assert.ok(text.includes("Hormat saya,"));
  assert.ok(text.includes("John Doe"));
  assert.ok(text.includes("john@example.com"));
});

/* ------------------------------------------------------------------ storage */

test("normalizeApplicationKit bounds and defaults every field", () => {
  assert.deepEqual(normalizeApplicationKit(null), EMPTY_KIT);
  assert.deepEqual(normalizeApplicationKit("nope"), EMPTY_KIT);
  assert.deepEqual(normalizeApplicationKit([]), EMPTY_KIT);

  const en = normalizeApplicationKit({ language: "en" });
  assert.equal(en.language, "en");
  // Anything but a known language falls back to Indonesian.
  assert.equal(normalizeApplicationKit({ language: "de" }).language, "id");

  // A pasted ad cannot blow up the row.
  const huge = normalizeApplicationKit({ jobAd: "x".repeat(50_000) });
  assert.equal(huge.jobAd.length, 20_000);
});

test("a cover letter survives a CV round-trip", () => {
  // The editor autosaves the whole `data` object, so normalizeCvData must carry
  // `apply` through or the letter would vanish on the next keystroke.
  const withKit: CvData = {
    ...SAMPLE_CV,
    apply: kit({ company: "Acme", role: "Engineer", jobAd: "Butuh TypeScript", letter: "Hormat saya," }),
  };
  const round = normalizeCvData(JSON.parse(JSON.stringify(withKit)));

  assert.equal(round.apply?.company, "Acme");
  assert.equal(round.apply?.role, "Engineer");
  assert.equal(round.apply?.letter, "Hormat saya,");
  assert.equal(round.apply?.jobAd, "Butuh TypeScript");
});

test("a CV without a kit gets an empty one, not undefined", () => {
  const bare = normalizeCvData(SAMPLE_CV);
  assert.ok(bare.apply, "apply should always be present after normalize");
  assert.equal(bare.apply?.company, "");
});

test("renderers ignore the application kit", async () => {
  // The kit rides in the same JSON as the CV; it must not change the document.
  const { renderResumeHtml } = await import("../src/lib/templates/render");
  const withKit: CvData = { ...SAMPLE_CV, apply: kit({ company: "Acme", letter: "rahasia" }) };
  assert.equal(renderResumeHtml(withKit, "jake"), renderResumeHtml(SAMPLE_CV, "jake"));
});
