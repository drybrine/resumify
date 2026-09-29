import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

// `@types/node` here is ^20, which predates `fs.globSync`, and Next runs `tsc`
// during `next build` — so this file has to stay type-clean with a hand-rolled walk.
const ROOT = fileURLToPath(new URL("..", import.meta.url));

/** Every .ts/.tsx under src/, as repo-relative POSIX paths. */
function walkSource(dir = join(ROOT, "src")): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkSource(full));
    } else if (/\.tsx?$/.test(entry.name)) {
      out.push(relative(ROOT, full).split(sep).join("/"));
    }
  }
  return out;
}

const read = (rel: string): string => readFileSync(join(ROOT, rel), "utf8");

/**
 * The Pro price and period are admin-editable (plan_settings, via
 * `getProPricing()`). Copy that states a price must read it from there: a
 * hardcoded "Rp 49.000" keeps showing after the admin changes the price, which is
 * exactly the bug this guards.
 *
 * The check is for a *formatted* rupiah literal (thousands separator), i.e. copy —
 * `formatIdr()` output, not arithmetic. `src/lib/plans.ts` holds the documented
 * build-time fallback and is excluded deliberately.
 */
const PRICE_COPY = /Rp\s?\d{1,3}[.\u00a0]\d{3}/;

/**
 * Rupiah literals that are NOT the Pro price, each with the reason it is allowed.
 * Kept deliberately tiny and asserted below: an open-ended allow-list would let
 * the guard rot.
 */
const NON_PRICE_LITERALS: Record<string, string> = {
  // Wallet/test-mode threshold, compared against 10_000 in lib/qris.ts and against
  // the pending amount — not a price anybody is charged.
  "src/app/pricing/checkout-button.tsx": "test-mode wallet threshold (Rp 10.000)",
  // Bounds of the admin number input, mirroring the schema CHECK (1 .. 10_000_000).
  "src/app/admin/plan-settings-form.tsx": "admin field bounds (min Rp 1, maks Rp 10.000.000)",
};

test("no user-facing source hardcodes a formatted rupiah price", () => {
  const files = walkSource().filter((f) => f !== "src/lib/plans.ts");
  assert.ok(files.length > 20, `expected to scan the app source, got ${files.length} files`);

  const offenders = files
    .filter((f: string) => PRICE_COPY.test(read(f)))
    .filter((f: string) => !(f in NON_PRICE_LITERALS));

  assert.deepEqual(
    offenders,
    [],
    `hardcoded price copy — read getProPricing() instead: ${offenders.join(", ")}`,
  );
  assert.ok(
    Object.keys(NON_PRICE_LITERALS).length <= 3,
    "the non-price allow-list is growing; re-check whether those literals are really not prices",
  );
});

test("the surfaces that show a price actually read it from the database", () => {
  // Every place the old literals lived. If one stops calling getProPricing() it is
  // free to drift from what the checkout charges.
  for (const rel of [
    "src/app/page.tsx",
    "src/app/pricing/page.tsx",
    "src/app/dashboard/page.tsx",
    "src/app/(auth)/signup/page.tsx",
    "src/app/layout.tsx",
    "src/app/opengraph-image.tsx",
  ]) {
    assert.match(
      read(rel),
      /getProPricing/,
      `${rel} must read the admin-set pricing`,
    );
  }
});

test("the template dialog declares an explicit base column count", () => {
  // With no `grid-cols-*` at the mobile breakpoint the grid has a single implicit
  // `auto` track, whose minimum is the item's min-content size. Each card embeds
  // an 8.5in (816px) sheet, so the track resolved to 844px inside a 364px dialog:
  // cards and the sheet preview spilled horizontally and the preview measured its
  // own overflowing width, rendering at scale 1 instead of as a thumbnail.
  // `grid-cols-1` (repeat(1, minmax(0,1fr))) lets the track shrink.
  const source = read("src/components/editor/cv-editor.tsx");
  const gridLines = source
    .split(/\r?\n/)
    .filter((line) => line.includes("sm:grid-cols-2") && line.includes("lg:grid-cols-3"));

  assert.equal(gridLines.length, 1, "expected exactly one responsive template grid");
  assert.match(
    gridLines[0],
    /(^|\s)grid-cols-1(\s|$)/,
    `template grid needs an explicit grid-cols-1 base: ${gridLines[0].trim()}`,
  );
});

test("the landing-page gallery keeps the same explicit base", () => {
  // The gallery already had this right — recorded so a future cleanup does not
  // "tidy" the two grids into disagreeing again.
  const source = read("src/components/template-showcase.tsx");
  const gridLine = source
    .split(/\r?\n/)
    .find((line) => line.includes("sm:grid-cols-2") && line.includes("lg:grid-cols-3"));
  assert.ok(gridLine, "gallery grid not found");
  assert.match(gridLine, /(^|\s)grid-cols-1(\s|$)/, `gallery grid: ${gridLine.trim()}`);
});
