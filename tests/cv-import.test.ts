import assert from "node:assert/strict";
import { test } from "node:test";
import type { CvLine } from "../src/lib/import/extract";
import { parseCvLines } from "../src/lib/import/parse";

/**
 * The parser is heuristic, so these tests pin the specific mis-reads that showed up
 * on a real CV rather than testing the happy path in the abstract. Every fixture is
 * synthetic — a placeholder person on a placeholder street.
 */

const line = (text: string, indent = 0, width = 0): CvLine => ({ text, indent, width });

/** The column is this wide; wrapped lines come in a word short of it. */
const COLUMN = 500;

test("a tabbed two-column row keeps its fields apart", () => {
  const { data } = parseCvLines([
    line("JOHN DOE", 60, 120),
    line("john.doe@example.com", 80, 200),
    line("EDUCATION", 40, 90),
    line("Acme University\tSpringfield, USA", 40, COLUMN),
    line("BSc Computer Science\t2016 – 2020", 40, COLUMN),
  ]);

  assert.equal(data.education.length, 1);
  assert.equal(data.education[0].school, "Acme University");
  assert.equal(data.education[0].location, "Springfield, USA");
  assert.equal(data.education[0].degree, "BSc Computer Science");
  assert.equal(data.education[0].period, "2016 – 2020");
});

test("a tabbed row is never swallowed by a wrapped line above it", () => {
  // Both rows are full width and the first does not end in punctuation, so only
  // the tab rule stands between this and scrambled fields.
  const { data } = parseCvLines([
    line("JOHN DOE", 60, 120),
    line("EXPERIENCE", 40, 90),
    line("Acme Corp\tSpringfield, USA", 40, COLUMN),
    line("Backend Engineer\t2020 – 2023", 40, COLUMN),
    line("Shipped the billing service to every region we operate in", 54, COLUMN),
  ]);

  assert.equal(data.experience.length, 1);
  assert.equal(data.experience[0].company, "Acme Corp");
  assert.equal(data.experience[0].location, "Springfield, USA");
  assert.equal(data.experience[0].role, "Backend Engineer");
  assert.equal(data.experience[0].period, "2020 – 2023");
});

test("a bullet wrapped across two lines becomes one bullet", () => {
  const { data } = parseCvLines([
    line("JOHN DOE", 60, 120),
    line("EXPERIENCE", 40, 90),
    line("Acme Corp\tSpringfield, USA", 40, COLUMN),
    line("Backend Engineer\t2020 – 2023", 40, COLUMN),
    line("Shipped the billing service and cut checkout latency in half for", 54, 490),
    line("every customer in the region.", 54, 200),
  ]);

  assert.deepEqual(data.experience[0].bullets, [
    "Shipped the billing service and cut checkout latency in half for every customer in the region.",
  ]);
});

test("a finished bullet is not merged into the next one", () => {
  // The second bullet is also full width, so only the full stop above it stops the
  // merge — and the line before *that* is a short tail, which used to break the
  // lookahead and was how two separate bullets ended up glued together.
  const { data } = parseCvLines([
    line("JOHN DOE", 60, 120),
    line("EXPERIENCE", 40, 90),
    line("Acme Corp\tSpringfield, USA", 40, COLUMN),
    line("Backend Engineer\t2020 – 2023", 40, COLUMN),
    line("Shipped the billing service to every region we operate in", 54, 490),
    line("and halved checkout latency.", 54, 180),
    line("Owned the on-call rotation for two years running", 54, 480),
    line("across three services.", 54, 150),
  ]);

  assert.deepEqual(data.experience[0].bullets, [
    "Shipped the billing service to every region we operate in and halved checkout latency.",
    "Owned the on-call rotation for two years running across three services.",
  ]);
});

test("a heading is never merged into the line below it", () => {
  const { data, found } = parseCvLines([
    line("JOHN DOE", 60, 120),
    line("EXPERIENCE", 40, 90),
    line("Acme Corp\tSpringfield, USA", 40, COLUMN),
    line("Backend Engineer\t2020 – 2023", 40, COLUMN),
    line("Shipped the billing service to every region we operate in", 54, 490),
    line("EDUCATION", 54, 100),
    line("Acme University\tSpringfield, USA", 40, COLUMN),
  ]);

  assert.deepEqual(found.sections, ["EXPERIENCE", "EDUCATION"]);
  assert.equal(data.experience[0].bullets.length, 1);
  assert.equal(data.education[0].school, "Acme University");
});

test("skills on one line split into one row per category", () => {
  const { data } = parseCvLines([
    line("JOHN DOE", 60, 120),
    line("TECHNICAL SKILLS", 40, 90),
    line("Languages: TypeScript, Go, Python", 40, 300),
    line("Backend: Node.js, PostgreSQL, Redis", 40, 480),
    line("Frontend: React, Tailwind", 40, 250),
  ]);

  assert.deepEqual(
    data.skills.map((s) => [s.category, s.items]),
    [
      ["Languages", "TypeScript, Go, Python"],
      ["Backend", "Node.js, PostgreSQL, Redis"],
      ["Frontend", "React, Tailwind"],
    ],
  );
});

test("a label does not swallow the value before it", () => {
  // The leftmost `Label:` match starts at "Native" and runs to the colon after
  // "English", which left the first value empty and the first language missing.
  const { data } = parseCvLines([
    line("JOHN DOE", 60, 120),
    line("LANGUAGES", 40, 90),
    line("Indonesian: Native English: Technical writing", 40, 400),
  ]);

  assert.deepEqual(
    data.languages.map((l) => [l.name, l.level]),
    [
      ["Indonesian", "Native"],
      ["English", "Technical writing"],
    ],
  );
});

test("a citation's link on its own line stays in the same publication", () => {
  const { data } = parseCvLines([
    line("JOHN DOE", 60, 120),
    line("PUBLICATIONS", 40, 90),
    line("J. Doe, “A Study of Things,” Journal of Things, vol. 1, 2024.", 54, 480),
    line("doi.example.org/10.1000/xyz", 54, 150),
  ]);

  assert.equal(data.publications.length, 1);
  assert.equal(data.publications[0].url, "https://doi.example.org/10.1000/xyz");
  assert.ok(!data.publications[0].text.includes("doi.example.org"));
});

test("Indonesian section headings are recognised", () => {
  const { found } = parseCvLines([
    line("JOHN DOE", 60, 120),
    line("PENDIDIKAN", 40, 90),
    line("Universitas Contoh\tKota Contoh", 40, COLUMN),
    line("PENGALAMAN", 40, 90),
    line("PT Contoh\tKota Contoh", 40, COLUMN),
    line("KEAHLIAN", 40, 90),
    line("TypeScript, Go", 40, 200),
  ]);

  assert.deepEqual(found.sections, ["PENDIDIKAN", "PENGALAMAN", "KEAHLIAN"]);
});

test("an all-caps name is title-cased", () => {
  const { data } = parseCvLines([
    line("JOHN DOE", 60, 120),
    line("Springfield, USA | john.doe@example.com", 80, 300),
  ]);

  assert.equal(data.personal.fullName, "John Doe");
  assert.equal(data.personal.email, "john.doe@example.com");
  assert.equal(data.personal.location, "Springfield, USA");
});

test("an empty document warns instead of throwing", () => {
  const { data, warnings } = parseCvLines([]);

  assert.equal(data.education.length, 0);
  assert.equal(data.experience.length, 0);
  assert.equal(data.personal.fullName, "");
  assert.ok(warnings.some((w) => w.includes("scan")), warnings.join(" | "));
});

test("prose with no headings is kept in the summary, not dropped", () => {
  const { data, warnings, found } = parseCvLines([
    line("JOHN DOE", 60, 120),
    line("john.doe@example.com", 80, 200),
    line("Ten years of backend work, mostly in Go and PostgreSQL.", 40, 480),
  ]);

  assert.equal(found.sections.length, 0);
  assert.match(data.summary, /Ten years of backend work/);
  assert.ok(warnings.some((w) => w.includes("Ringkasan")), warnings.join(" | "));
});

test("a missing name and email are reported, not invented", () => {
  const { data, warnings } = parseCvLines([
    line("EXPERIENCE", 40, 90),
    line("Acme Corp\tSpringfield, USA", 40, COLUMN),
    line("Backend Engineer\t2020 – 2023", 40, COLUMN),
  ]);

  assert.equal(data.personal.fullName, "");
  assert.equal(data.personal.email, "");
  assert.ok(warnings.some((w) => w.includes("Nama")), warnings.join(" | "));
  assert.ok(warnings.some((w) => w.includes("Email")), warnings.join(" | "));
});

test("DOCX lines (no width) are used as-is", () => {
  // DOCX paragraphs are already whole logical lines, so rejoining must stay off.
  const { data } = parseCvLines([
    line("JOHN DOE"),
    line("EXPERIENCE"),
    line("Acme Corp\tSpringfield, USA"),
    line("Backend Engineer\t2020 – 2023"),
    line("• Shipped the billing service to every region we operate in", 12),
    line("• Owned the on-call rotation.", 12),
  ]);

  assert.deepEqual(data.experience[0].bullets, [
    "Shipped the billing service to every region we operate in",
    "Owned the on-call rotation.",
  ]);
  assert.equal(data.experience[0].company, "Acme Corp");
});
