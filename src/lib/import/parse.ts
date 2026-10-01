import { normalizeCvData } from "@/lib/cv-data";
import type { CvData } from "@/lib/types";
import type { CvLine } from "./extract";

/**
 * Turn extracted CV lines into structured CvData.
 *
 * This is **heuristic and deliberately conservative**: it fills in what it can
 * recognise and stays silent about anything it cannot, rather than guessing a
 * field into the wrong place. Every import is meant to be reviewed — the caller
 * carries `warnings` through to the UI so the user knows what to check.
 *
 * Two signals do the real work, both derived from how CVs actually lay out:
 *
 * - **Tabs** mark column breaks, so "University ⟶ Location" stays two fields.
 * - **Indentation** separates entry headings from bullets, because the extracted
 *   text carries no bullet glyph.
 */

export type ParseResult = {
  data: CvData;
  warnings: string[];
  found: {
    sections: string[];
    entries: number;
    contact: string[];
  };
};

/* ------------------------------------------------------------------ helpers */

const BULLET = /^\s*[•▪◦‣·*]\s*/;

const segments = (line: CvLine): string[] =>
  line.text
    .split("\t")
    .map((s) => s.replace(BULLET, "").trim())
    .filter(Boolean);

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
const URL = /(?:https?:\/\/|www\.)[^\s,;]+|(?:[\w-]+\.)+(?:com|id|io|dev|net|org|app|ac\.id|co\.id)(?:\/[^\s,;]*)?/i;

/** A date range, "Expected 2026", or a bare year — but never a random number. */
const PERIOD_RANGE = /(?:19|20)\d{2}\s*(?:[–—−-]|to|hingga|s\/d)\s*(?:(?:19|20)\d{2}|present|sekarang|now|current|kini)/i;
const PERIOD_EXPECTED = /(?:expected|perkiraan|estimasi|sampai)\s*(?:19|20)\d{2}/i;

function looksLikePeriod(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  if (PERIOD_RANGE.test(v)) return true;
  if (PERIOD_EXPECTED.test(v)) return true;
  return /^(?:19|20)\d{2}$/.test(v) || /^(?:19|20)\d{2}\s*[-–]\s*(?:19|20)\d{2}$/.test(v);
}

/** Places in a CV that are visibly two-column: "Bandung, Indonesia". */
function looksLikePlace(value: string): boolean {
  const v = value.trim();
  return /^\p{Lu}[\p{L}.\-' ]*,\s*\p{L}[\p{L}.\-' ]+$/u.test(v) && v.length <= 48;
}

const squash = (s: string) => s.replace(/\s+/g, "");
const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z&/\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/* ----------------------------------------------------------------- sections */

type Bucket =
  | "summary"
  | "education"
  | "experience"
  | "projects"
  | "publications"
  | "skills"
  | "languages";

const SECTION_WORDS: Array<{ id: Bucket; words: string[] }> = [
  {
    id: "summary",
    words: ["summary", "ringkasan", "professional summary", "about me", "profile", "profil", "tentang saya", "objective", "career profile"],
  },
  {
    id: "education",
    words: ["education", "pendidikan", "riwayat pendidikan", "academic background", "akademik", "education background"],
  },
  {
    id: "experience",
    words: ["experience", "pengalaman", "pengalaman kerja", "work experience", "employment", "riwayat pekerjaan", "career history", "professional experience"],
  },
  {
    id: "projects",
    words: ["projects", "project", "proyek", "portofolio", "portfolio", "featured projects"],
  },
  {
    id: "publications",
    words: ["publications", "publication", "publikasi", "research", "penelitian", "papers"],
  },
  {
    id: "skills",
    words: ["skills", "skill", "technical skills", "keahlian", "keterampilan", "kemampuan", "tech stack", "technologies"],
  },
  { id: "languages", words: ["languages", "language", "bahasa", "bahasa asing"] },
];

const HEADING_MAX = 46;

/**
 * Recognise a section heading. Requires a short line that **exactly** matches a
 * known heading after normalising — a loose match would fire on any bullet that
 * happens to mention "experience".
 */
function headingOf(line: CvLine): { id: Bucket; label: string } | null {
  if (line.text.includes("\t")) return null;
  const raw = line.text.replace(BULLET, "").trim();
  if (!raw || raw.length > HEADING_MAX) return null;
  // Headings are not sentences; a trailing period means it is prose.
  if (/[.!?]$/.test(raw)) return null;

  const n = norm(raw);
  if (!n) return null;
  const sq = squash(n);

  for (const { id, words } of SECTION_WORDS) {
    for (const w of words) {
      if (n === w || sq === squash(w)) return { id, label: raw };
    }
  }
  return null;
}

/* ------------------------------------------------------------- header block */

function parseHeader(block: CvLine[]): { personal: CvData["personal"]; contact: string[] } {
  const tokens: string[] = [];
  for (const line of block) {
    for (const seg of line.text.split("\t")) {
      // Separators used in one-line contact rows.
      for (const part of seg.split(/\s*(?:\||·|•|▪|◦|‣)\s*/)) {
        const t = part.trim();
        if (t) tokens.push(t);
      }
    }
  }

  const personal: CvData["personal"] = {
    fullName: "",
    location: "",
    email: "",
    phone: "",
    github: "",
    website: "",
    linkedin: "",
    photo: "",
  };
  const contact: string[] = [];
  const leftovers: string[] = [];

  for (const token of tokens) {
    const email = token.match(EMAIL)?.[0];
    if (email && !personal.email) {
      personal.email = email;
      contact.push("email");
      continue;
    }

    const url = token.match(URL)?.[0];
    if (url) {
      const lower = url.toLowerCase();
      const value = url.replace(/^https?:\/\//, "").replace(/\/$/, "");
      if (lower.includes("linkedin") && !personal.linkedin) personal.linkedin = value;
      else if (lower.includes("github") && !personal.github) personal.github = value;
      else if (!personal.website) personal.website = value;
      contact.push("link");
      continue;
    }

    // A phone: enough digits to be a number, and nothing that reads as a year range.
    const digits = token.replace(/\D/g, "");
    if (digits.length >= 9 && digits.length <= 16 && !PERIOD_RANGE.test(token) && /^[\d+()\-.\s]+$/.test(token)) {
      if (!personal.phone) {
        personal.phone = token.trim();
        contact.push("telepon");
      }
      continue;
    }

    if (looksLikePlace(token) && !personal.location) {
      personal.location = token.trim();
      contact.push("domisili");
      continue;
    }

    leftovers.push(token);
  }

  // The name is the first leftover that reads like a person's name.
  for (const candidate of leftovers) {
    const words = candidate.split(/\s+/);
    if (words.length < 2 || words.length > 7) continue;
    if (/[@/\d]/.test(candidate)) continue;
    if (!/^\p{L}[\p{L}.'\- ]+$/u.test(candidate)) continue;
    if (candidate.length > 60) continue;
    personal.fullName = candidate;
    contact.push("nama");
    break;
  }

  return { personal, contact };
}

/** "SURYA ALAMSYAH PUTERA PRATAMA" → "Surya Alamsyah Putera Pratama". */
function titleCase(name: string): string {
  if (name !== name.toUpperCase()) return name;
  return name
    .split(/\s+/)
    .map((w) => (w.length > 1 ? w.charAt(0) + w.slice(1).toLowerCase() : w))
    .join(" ");
}

/* ------------------------------------------------------------ entry grouping */

type Entry = { rows: string[][]; bullets: string[] };

/**
 * Group a section's lines into entries.
 *
 * A non-indented line opens an entry; a second consecutive one is its second row
 * (the grade/role line); anything indented — or carrying a bullet marker — is a
 * bullet of the entry above it.
 */
function groupEntries(lines: CvLine[], baseIndent: number): Entry[] {
  const entries: Entry[] = [];
  let current: Entry | null = null;
  let previousWasRow = false;

  for (const line of lines) {
    const marked = BULLET.test(line.text);
    const indented = line.indent > baseIndent + 8;

    if (marked || indented) {
      const text = line.text.replace(BULLET, "").trim();
      if (!text) continue;
      if (!current) {
        current = { rows: [], bullets: [] };
        entries.push(current);
      }
      current.bullets.push(text);
      previousWasRow = false;
      continue;
    }

    const segs = segments(line);
    if (segs.length === 0) continue;
    // Start a new entry unless this is the second row of the one above.
    if (!current || !previousWasRow || current.rows.length >= 2) {
      current = { rows: [], bullets: [] };
      entries.push(current);
    }
    current.rows.push(segs);
    previousWasRow = true;
  }

  return entries;
}

/* ------------------------------------------------------------- per-section */

function buildEducation(entries: Entry[]): CvData["education"] {
  return entries.map((e) => {
    const head = e.rows[0] ?? [];
    const second = e.rows[1] ?? [];

    const school = head[0] ?? "";
    let location = "";
    let degree = second[0] ?? "";
    let period = second[1] ?? "";

    // Two fields on the head row: either a place or a date.
    if (head[1]) {
      if (looksLikePeriod(head[1])) period = period || head[1];
      else location = head[1];
    }
    // Nothing on the second row: the first row may carry school + degree.
    if (!second.length && head[1] && !looksLikePeriod(head[1]) && !looksLikePlace(head[1])) {
      degree = head[1];
      location = "";
    }
    if (!period && second[1] && !looksLikePeriod(second[1])) {
      // Leftover text where a date was expected is more likely a place.
      location = location || second[1];
    }

    return {
      school: school.trim(),
      location: location.trim(),
      degree: degree.trim(),
      period: period.trim(),
      bullets: e.bullets,
    };
  });
}

function buildExperience(entries: Entry[]): CvData["experience"] {
  return entries.map((e) => {
    const head = e.rows[0] ?? [];
    const second = e.rows[1] ?? [];

    const company = head[0] ?? "";
    let location = "";
    let role = second[0] ?? "";
    let period = second[1] ?? "";

    if (head[1]) {
      if (looksLikePeriod(head[1])) period = period || head[1];
      else location = head[1];
    }
    if (!second.length && head[1] && !looksLikePeriod(head[1]) && !looksLikePlace(head[1])) {
      role = head[1];
      location = "";
    }
    if (!period && second[1] && !looksLikePeriod(second[1])) {
      location = location || second[1];
    }

    return {
      company: company.trim(),
      location: location.trim(),
      role: role.trim(),
      period: period.trim(),
      bullets: e.bullets,
    };
  });
}

function buildProjects(entries: Entry[]): CvData["projects"] {
  return entries.map((e) => {
    const head = e.rows[0] ?? [];
    const second = e.rows[1] ?? [];

    // The name and its link often share one field, and the period is right-aligned.
    let name = head[0] ?? "";
    let period = head[1] ?? second[0] ?? "";

    const link = name.match(URL)?.[0] ?? "";
    if (link) name = name.replace(link, "").replace(/[\s—–-]+$/, "").trim();
    if (!looksLikePeriod(period)) {
      // A period glued to the end of the name field.
      const tail = name.match(new RegExp(`${PERIOD_RANGE.source}\\s*$`, "i"))?.[0];
      if (tail) {
        period = tail.trim();
        name = name.slice(0, name.length - tail.length).replace(/[\s—–-]+$/, "").trim();
      } else {
        period = looksLikePeriod(period) ? period : "";
      }
    }

    return {
      name: name.trim(),
      link: link.replace(/^https?:\/\//, "").replace(/\/$/, "").trim(),
      period: period.trim(),
      bullets: e.bullets,
    };
  });
}

function buildPublications(lines: CvLine[]): CvData["publications"] {
  const out: CvData["publications"] = [];
  let buffer = "";

  const flush = () => {
    const text = buffer.trim();
    buffer = "";
    if (!text || text.length < 12) return;
    const url = text.match(URL)?.[0] ?? "";
    out.push({
      text: url ? text.replace(url, "").trim() : text,
      url: url ? (url.startsWith("http") ? url : `https://${url}`) : "",
    });
  };

  for (const line of lines) {
    const text = line.text.replace(BULLET, "").trim();
    if (!text) continue;
    // A citation ending in a year or full stop is complete — unless the next line
    // is just its link, which belongs to the same entry. Treating the URL as a new
    // entry is how one publication turned into two, one of them empty.
    const isLink = URL_ONLY.test(text);
    if (!isLink && buffer && /[.!?]\s*$|\d{4}\.?\s*$/.test(buffer)) flush();
    buffer = buffer ? `${buffer} ${text}` : text;
  }
  flush();
  return out;
}

/**
 * "Languages: TypeScript, … Frontend: Next.js …" → one pair per category.
 *
 * Scanning for `Label:` with a leftmost regex means a label can swallow the
 * *previous* pair's value: in "Indonesian: Native English: Technical …" the second
 * match starts at "Native" and runs to the colon after "English", leaving the first
 * value empty. That is repaired below by handing the leading word back.
 */
function splitPairs(text: string): Array<{ label: string; value: string }> {
  const re = /([A-Z][A-Za-z &/+#.-]{2,28}?)\s*:\s*/g;
  const marks: Array<{ label: string; labelStart: number; valueStart: number; valueEnd: number }> = [];

  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    marks.push({
      label: m[1].trim(),
      labelStart: m.index,
      valueStart: re.lastIndex,
      valueEnd: text.length,
    });
  }
  if (!marks.length) return [];

  for (let i = 0; i + 1 < marks.length; i++) marks[i].valueEnd = marks[i + 1].labelStart;

  for (let i = 0; i + 1 < marks.length; i++) {
    if (marks[i].valueEnd > marks[i].valueStart) continue;
    const words = marks[i + 1].label.split(/\s+/);
    if (words.length < 2) continue;
    const give = words[0];
    marks[i].valueEnd = marks[i + 1].labelStart + give.length;
    marks[i + 1].labelStart += give.length + 1;
    marks[i + 1].label = words.slice(1).join(" ");
  }

  return marks
    .map((mk) => ({ label: mk.label, value: text.slice(mk.valueStart, mk.valueEnd).trim() }))
    .filter((p) => p.label && p.value);
}

function buildSkills(lines: CvLine[]): CvData["skills"] {
  const out: CvData["skills"] = [];
  for (const line of lines) {
    const text = line.text.replace(BULLET, "").trim();
    if (!text) continue;

    const pairs = splitPairs(text);
    if (pairs.length) {
      for (const p of pairs) out.push({ category: p.label, items: p.value });
      continue;
    }
    // A skill row with no "Category:" label still carries information.
    out.push({ category: "Keahlian", items: text.replace(/^[:\-\s]+/, "") });
  }
  return out;
}

function buildLanguages(lines: CvLine[]): CvData["languages"] {
  const out: CvData["languages"] = [];
  for (const line of lines) {
    const text = line.text.replace(BULLET, "").trim();
    if (!text) continue;
    for (const pair of splitPairs(text)) {
      out.push({ name: pair.label, level: pair.value });
    }
  }
  return out;
}

/* ------------------------------------------------------------------ parsing */

/** A whole line that is nothing but a link — a citation's URL on its own line. */
const URL_ONLY = /^(?:https?:\/\/\S+|(?:[\w-]+\.)+[a-z]{2,}(?:\/\S*)?)$/i;

/** A line that opens a "Label: value" row, e.g. "Backend & Cloud: Firebase…". */
const STARTS_PAIR = /^[A-Z][A-Za-z &/+#.-]{2,28}\s*:/;

/**
 * Rejoin lines a PDF wrapped mid-sentence.
 *
 * A wrapped bullet arrives as two or more lines ("Studied computer assembly, …
 * administration" / "for Windows/Linux workstations."), and left alone each one
 * becomes its own bullet. Width is the signal: a line that fills the measure and
 * does not end in terminal punctuation was cut by the layout, not by the author.
 *
 * Five guards, each earned from a real mis-merge:
 * - a line ending in `.`/`!`/`?` finished a thought;
 * - the next line must sit at the same indent (a wrapped line aligns with itself);
 * - a heading never merges, whatever its width;
 * - **neither line may contain a tab**, because a tabbed line is a two-column
 *   field row ("University ‖ Location"), not wrapped prose. Without this, an
 *   education head merged with its degree line and the fields ended up scrambled;
 * - the incoming line must not itself open a `Label: value` row, which would
 *   otherwise be swallowed into the previous row's value.
 *
 * Comparisons use the last *original* line rather than the merged blob: a merged
 * bullet ends with its final short fragment, and measuring that would stop the
 * next bullet from rejoining properly.
 */
function joinWrapped(lines: CvLine[]): CvLine[] {
  const widths = lines.map((l) => l.width).filter((w) => w > 0).sort((a, b) => a - b);
  if (widths.length < 4) return lines;
  // 90th percentile, not the max: one oversized line should not set the measure.
  const measure = widths[Math.floor(widths.length * 0.9)];
  // A wrapped line ends at the last whole word that fit, so it can be a word short
  // of the measure. Measured on a real CV: the column is 533pt and wrapped lines
  // land at 453–516pt, which is why 0.88 missed two of them and 0.80 catches them.
  const full = measure * 0.8;

  const out: CvLine[] = [];
  let previous: CvLine | null = null;

  for (const line of lines) {
    const joins =
      previous !== null &&
      previous.width > 0 &&
      previous.width >= full &&
      Math.abs(previous.indent - line.indent) <= 2 &&
      !previous.text.includes("\t") &&
      !line.text.includes("\t") &&
      !/[.!?]["')\]]?$/.test(previous.text.trim()) &&
      !STARTS_PAIR.test(line.text.trim()) &&
      !headingOf(line);

    if (joins) {
      const target = out[out.length - 1];
      target.text = `${target.text} ${line.text.trim()}`;
    } else {
      out.push({ ...line });
    }
    previous = line;
  }
  return out;
}

const firstIndent = (lines: CvLine[]): number =>
  lines.length ? Math.min(...lines.map((l) => l.indent)) : 0;

/** A CV header is a name and a line or two of contact details — never six lines. */
const MAX_HEADER_LINES = 6;

/**
 * How far the header reaches when no section heading was found.
 *
 * Without this the whole document counts as the header, so a CV whose headings are
 * absent or unrecognised lost its entire body text: it was offered to the name
 * matcher, rejected for being too long, and dropped on the floor. The header is the
 * short run of name/contact lines at the top, and the first line that reads like a
 * sentence ends it.
 */
function headerScanEnd(lines: CvLine[]): number {
  let i = 0;
  for (; i < lines.length && i < MAX_HEADER_LINES; i++) {
    const text = lines[i].text.trim();
    const words = text.split(/\s+/).length;
    if (/[.!?]$/.test(text) && words > 6) break;
    if (words > 14) break;
  }
  return i;
}

export function parseCvLines(lines: CvLine[]): ParseResult {
  const warnings: string[] = [];
  const found = { sections: [] as string[], entries: 0, contact: [] as string[] };

  const clean = joinWrapped(lines.filter((l) => l.text.trim()));
  if (!clean.length) {
    warnings.push("Tidak ada teks yang terbaca. Kalau CV-nya hasil scan, teksnya perlu di-OCR dulu.");
    return { data: normalizeCvData({}), warnings, found };
  }

  // Locate the section headings.
  const marks: Array<{ at: number; id: Bucket; label: string }> = [];
  clean.forEach((line, i) => {
    const h = headingOf(line);
    if (h) marks.push({ at: i, id: h.id, label: h.label });
  });

  const headerEnd = marks.length ? marks[0].at : headerScanEnd(clean);
  const { personal, contact } = parseHeader(clean.slice(0, headerEnd));
  personal.fullName = titleCase(personal.fullName);
  found.contact = contact;

  const data: CvData = {
    ...normalizeCvData({}),
    personal,
  };

  if (!personal.fullName) warnings.push("Nama belum ketemu — isi sendiri di editor ya.");
  if (!personal.email) warnings.push("Email belum ketemu.");

  if (!marks.length) {
    // No recognisable headings: keep the prose rather than throwing it away.
    const rest = clean
      .slice(headerEnd)
      .map((l) => l.text)
      .join(" ")
      .trim();
    data.summary = rest;
    warnings.push(
      "Judul bagian (Pendidikan, Pengalaman, dst.) tidak dikenali, jadi isinya gua taruh di Ringkasan. Rapikan di editor ya.",
    );
    return { data: normalizeCvData(data), warnings, found };
  }

  marks.forEach((mark, i) => {
    const end = i + 1 < marks.length ? marks[i + 1].at : clean.length;
    const body = clean.slice(mark.at + 1, end);
    if (!body.length) return;
    found.sections.push(mark.label);

    switch (mark.id) {
      case "summary":
        data.summary = body.map((l) => l.text.replace(BULLET, "")).join(" ").trim();
        break;
      case "education": {
        const entries = buildEducation(groupEntries(body, firstIndent(body))).filter(
          (e) => e.school || e.degree,
        );
        found.entries += entries.length;
        data.education.push(...entries);
        break;
      }
      case "experience": {
        const entries = buildExperience(groupEntries(body, firstIndent(body))).filter(
          (e) => e.company || e.role,
        );
        found.entries += entries.length;
        data.experience.push(...entries);
        break;
      }
      case "projects": {
        const entries = buildProjects(groupEntries(body, firstIndent(body))).filter((e) => e.name);
        found.entries += entries.length;
        data.projects.push(...entries);
        break;
      }
      case "publications":
        data.publications.push(...buildPublications(body));
        break;
      case "skills":
        data.skills.push(...buildSkills(body));
        break;
      case "languages":
        data.languages.push(...buildLanguages(body));
        break;
    }
  });

  if (!data.education.length && !data.experience.length && !data.projects.length && !data.skills.length) {
    warnings.push("Isinya belum berhasil dipecah per bagian. Cek dan rapikan di editor ya.");
  }
  if (found.entries === 0 && (data.education.length || data.experience.length)) {
    warnings.push("Beberapa entri mungkin perlu dirapikan.");
  }

  return { data: normalizeCvData(data), warnings, found };
}
