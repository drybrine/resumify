import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { PAPER } from "../src/lib/paper";

/**
 * One paper size, everywhere.
 *
 * Letter used to be hardcoded in sixteen places — the PDF print options, both
 * stylesheets, the preview scaler, the editor's fit calculation, the Word section
 * properties and the cover-letter sheet — so a CV laid out for 8.5in x 11in went
 * to people who print on A4. These checks exist so it cannot drift back: one
 * module owns the number, every consumer reads it, and the one file that cannot
 * import it (a real stylesheet) has to agree numerically.
 */

const root = new URL("../", import.meta.url);
const read = (rel: string) => readFileSync(new URL(rel, root), "utf8");

test("PAPER is A4, in every unit the code needs", () => {
  assert.equal(PAPER.widthMm, 210);
  assert.equal(PAPER.heightMm, 297);
  // 595.28 x 841.89 pt is A4; 612 x 792 is Letter.
  assert.ok(Math.abs(PAPER.widthPt - 595.28) < 0.01, `widthPt=${PAPER.widthPt}`);
  assert.ok(Math.abs(PAPER.heightPt - 841.89) < 0.01, `heightPt=${PAPER.heightPt}`);
  // Word writes A4 as exactly these twips.
  assert.equal(PAPER.widthTwip, 11906);
  assert.equal(PAPER.heightTwip, 16838);
  assert.equal(PAPER.printFormat, "A4");
});

test("the preview stylesheet agrees with PAPER numerically", () => {
  const css = read("src/app/globals.css");
  const rule = css.slice(css.indexOf(".resume-preview {"), css.indexOf(".resume-preview {") + 400);
  const width = rule.match(/width:\s*([\d.]+)mm/);
  const minHeight = rule.match(/min-height:\s*([\d.]+)mm/);
  assert.ok(width, `no mm width in the .resume-preview rule:\n${rule}`);
  assert.ok(minHeight, `no mm min-height in the .resume-preview rule:\n${rule}`);
  assert.equal(Number(width[1]), PAPER.widthMm, "preview width drifted from PAPER");
  assert.equal(Number(minHeight[1]), PAPER.heightMm, "preview height drifted from PAPER");
});

test("the PDF stylesheet takes its size from PAPER rather than a literal", () => {
  const ts = read("src/lib/templates/styles.ts");
  assert.match(ts, /\$\{PAPER\.widthCss\}/, "the .resume sheet should interpolate PAPER.widthCss");
  assert.match(ts, /\$\{PAPER\.heightCss\}/, "the .resume sheet should interpolate PAPER.heightCss");
});

test("the PDF print options and both Word documents use PAPER", () => {
  assert.match(read("src/lib/server/pdf.ts"), /format:\s*PAPER\.printFormat/, "page.pdf() should use PAPER.printFormat");
  assert.match(read("src/lib/server/docx.ts"), /PAPER\.widthTwip/, "the CV .docx should use PAPER's twips");
  assert.match(read("src/lib/server/letter-docx.ts"), /PAPER\.widthTwip/, "the letter .docx should use PAPER's twips");
});

test("nothing anywhere hardcodes Letter again", () => {
  // Walk the tree by hand: @types/node ^20 has no fs.globSync.
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.(ts|tsx|css)$/.test(name)) files.push(full);
    }
  };
  walk(new URL("src", root).pathname.replace(/^\/([A-Za-z]:)/, "$1"));

  const offenders: string[] = [];
  for (const file of files) {
    // paper.ts describes the change and names Letter on purpose.
    if (file.endsWith("paper.ts")) continue;
    const text = readFileSync(file, "utf8");
    for (const line of text.split("\n")) {
      if (/\b8\.5in\b|\b11in\b|format:\s*"Letter"|widthIn:\s*8\.5/.test(line)) {
        offenders.push(`${file.split(/[\\/]src[\\/]/)[1]}: ${line.trim()}`);
      }
    }
  }
  assert.deepEqual(offenders, [], `Letter dimensions reappeared:\n${offenders.join("\n")}`);
});
