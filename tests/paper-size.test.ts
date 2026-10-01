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
  const rule = css.slice(css.indexOf(".resume-preview {"), css.indexOf(".resume-preview {") + 600);
  const width = rule.match(/width:\s*([\d.]+)mm/);
  const minHeight = rule.match(/min-height:\s*([\d.]+)mm/);
  assert.ok(width, `no mm width in the .resume-preview rule:\n${rule}`);
  assert.ok(minHeight, `no mm min-height in the .resume-preview rule:\n${rule}`);
  assert.equal(Number(width[1]), PAPER.widthMm, "preview width drifted from PAPER");
  assert.equal(Number(minHeight[1]), PAPER.heightMm, "preview height drifted from PAPER");
  // The paper keeps the full A4 height, and the printer's vertical margin is
  // reproduced as padding so the on-screen sheet shows the same content box.
  assert.match(rule, /padding:\s*0\.35in\s+0/, "the preview should carry the print margin");
});

test("every template's preview padding matches its PDF padding", () => {
  // Two hand-mirrored stylesheets: the PDF sheet's vertical padding is reduced by
  // the print margin and the printer supplies it back, and the preview reproduces
  // both halves as padding. If they drift, the screen stops matching the download.
  const ts = read("src/lib/templates/styles.ts");
  const css = read("src/app/globals.css");
  const inches = (s: string | undefined) =>
    (s ?? "").match(/[\d.]+/g)?.map(Number) ?? [];

  const consts = new Map<string, string>();
  for (const m of ts.matchAll(/const ([A-Z0-9_]+) = `([\s\S]*?)`;/g)) consts.set(m[1], m[2]);

  const PAIRS: Array<[string, string]> = [
    ["jake", "BASE"],
    ["modern", "MODERN"],
    ["compact", "COMPACT"],
    ["elegant", "ELEGANT"],
    ["sidebar", "SIDEBAR"],
    ["corporate", "CORPORATE"],
    ["tech", "TECH"],
    ["minimal", "MINIMAL"],
    ["harvard", "HARVARD"],
    ["executive", "EXECUTIVE"],
    ["creative", "CREATIVE"],
    ["terminal", "TERMINAL"],
    ["swiss", "SWISS"],
    ["scholar", "SCHOLAR"],
    ["timeline", "TIMELINE"],
    ["mono", "MONO"],
    ["atlas", "ATLAS"],
    ["editorial", "EDITORIAL"],
    ["orbit", "ORBIT"],
    ["mono-grid", "MONO_GRID"],
  ];

  const mismatches: string[] = [];
  for (const [id, constName] of PAIRS) {
    const block = consts.get(constName);
    assert.ok(block, `styles.ts has no const ${constName}`);
    // Start at the sheet rule; BASE also contains a reset rule that has a padding.
    // The window has to clear the comments above `padding`, and `${PAPER.…}` inside
    // the rule means a naive `[^}]*` match would stop early.
    const at = block.indexOf(".resume {") >= 0 ? block.indexOf(".resume {") : block.indexOf(".resume{");
    assert.ok(at >= 0, `styles.ts: ${constName} has no .resume rule`);
    const pdfPad = block.slice(at, at + 1200).match(/padding:\s*([^;}]*)/)?.[1];

    const cssRule = css.match(new RegExp(`\\.resume-preview\\.template-${id}\\s*\\{([^}]*)\\}`))?.[1];
    assert.ok(cssRule !== undefined, `globals.css has no .resume-preview.template-${id} rule`);
    const previewPad = cssRule.match(/padding:\s*([^;}]*)/)?.[1];

    const a = inches(pdfPad);
    const b = inches(previewPad);
    if (a.length !== b.length || a.some((v, i) => Math.abs(v - b[i]) > 1e-6)) {
      mismatches.push(`${id}: pdf ${JSON.stringify(a)} vs preview ${JSON.stringify(b)}`);
    }
  }
  assert.deepEqual(mismatches, [], `preview and PDF padding drifted:\n${mismatches.join("\n")}`);
});

test("the PDF stylesheet takes its size from PAPER rather than a literal", () => {
  const ts = read("src/lib/templates/styles.ts");
  assert.match(ts, /\$\{PAPER\.widthCss\}/, "the .resume sheet should interpolate PAPER.widthCss");
  // The printed height is the page's content height, because the vertical space is
  // a page margin now (PAPER.printMarginCss) and repeats on every page.
  assert.match(
    ts,
    /\$\{PAPER\.contentHeightCss\}/,
    "the .resume sheet should interpolate PAPER.contentHeightCss",
  );
});

test("the vertical space is a page margin, so it repeats on every page", () => {
  const pdf = read("src/lib/server/pdf.ts");
  assert.match(pdf, /top:\s*PAPER\.printMarginCss/, "page.pdf() should set a top page margin");
  assert.match(pdf, /bottom:\s*PAPER\.printMarginCss/, "page.pdf() should set a bottom page margin");
  // Left/right stay 0 so the full-bleed side columns still reach the paper edge.
  assert.match(pdf, /left:\s*"0"/, "the horizontal margins must stay 0");
  assert.match(pdf, /right:\s*"0"/, "the horizontal margins must stay 0");
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
