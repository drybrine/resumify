import type { ApplicationKit, CvData } from "@/lib/types";

/**
 * Cover letter drafting and job-ad keyword matching.
 *
 * Everything here is **deterministic and derived from the CV the user actually
 * wrote**. No text is invented: the letter names the real employer, the real
 * school, and the real skills that are already in the document. That is a
 * deliberate constraint — a cover letter that claims experience the CV does not
 * have is worse than no cover letter, and this environment has no LLM key to
 * generate prose with anyway.
 */

/* ------------------------------------------------------------------ matching */

/** Words too common to be a skill: Indonesian and English mixed, as ads use both. */
const STOPWORDS = new Set([
  // Indonesian
  "dan", "atau", "yang", "untuk", "dengan", "dari", "pada", "akan", "tidak", "bisa",
  "dapat", "juga", "serta", "adalah", "oleh", "ini", "itu", "para", "saat", "agar",
  "kami", "kita", "anda", "saya", "mereka", "kamu", "sebagai", "secara", "terhadap",
  "dalam", "antara", "setelah", "sebelum", "selama", "minimal", "maksimal", "lebih",
  "kurang", "memiliki", "mempunyai", "melakukan", "membuat", "menggunakan", "kerja",
  "kandidat", "pelamar", "posisi", "lowongan", "perusahaan", "tim", "divisi",
  "tanggung", "jawab", "persyaratan", "kualifikasi", "deskripsi", "pekerjaan",
  "gaji", "bonus", "thr", "lokasi", "penempatan", "jenis", "waktu", "hari", "bulan",
  "tahun", "jam", "pria", "wanita", "usia", "pendidikan", "sma", "smk", "d3", "s1",
  "baru", "lulusan", "berpengalaman", "diutamakan", "wajib", "mampu", "baik",
  "tinggi", "rendah", "aktif", "domisili", "bersedia", "lain", "lainnya", "dsb",
  // English
  "the", "and", "for", "with", "you", "your", "our", "are", "will", "have", "has",
  "this", "that", "from", "not", "can", "able", "work", "working", "job", "role",
  "position", "company", "team", "candidate", "candidates", "applicant", "apply",
  "application", "requirements", "requirement", "qualification", "qualifications",
  "responsibilities", "description", "about", "who", "what", "when", "where", "why",
  "how", "all", "any", "new", "must", "should", "would", "could", "been",
  "they", "them", "their", "its", "into", "also", "more", "than", "other",
  "such", "using", "use", "used", "well", "good", "strong", "plus", "etc",
]);

/**
 * Trim punctuation off the edges of a token while keeping the punctuation that is
 * part of a name. A trailing sentence period (`kubernetes.`) must go, but the dots
 * inside `next.js` and the `+`/`#` in `c++`, `c#` must stay.
 */
const clean = (word: string) =>
  word.replace(/^[^\p{L}\p{N}+#]+/u, "").replace(/[^\p{L}\p{N}+#]+$/u, "");

/** Every piece of text in the CV, lowercased, for containment checks. */
export function cvText(cv: CvData): string {
  const parts: string[] = [
    cv.summary,
    ...Object.values(cv.personal),
    ...cv.education.flatMap((e) => [e.school, e.degree, e.period, e.location, ...e.bullets]),
    ...cv.experience.flatMap((e) => [e.company, e.role, e.period, e.location, ...e.bullets]),
    ...cv.projects.flatMap((p) => [p.name, p.link, p.period, ...p.bullets]),
    ...cv.publications.map((p) => p.text),
    ...cv.skills.flatMap((s) => [s.category, s.items]),
    ...cv.languages.map((l) => `${l.name} ${l.level}`),
  ];
  return parts.filter(Boolean).join(" \n ").toLowerCase();
}

/**
 * Keywords worth checking, most-mentioned first.
 *
 * A job ad repeats what it cares about, so frequency is the signal. Tokens with a
 * digit, `+`, `#` or `.` survive (`c++`, `c#`, `next.js`, `3d`) because those are
 * exactly the ones that matter and naive splitting destroys them.
 */
export function extractKeywords(jobAd: string, limit = 24): string[] {
  const counts = new Map<string, number>();

  for (const raw of jobAd.toLowerCase().split(/[^\p{L}\p{N}+#.]+/u)) {
    const word = clean(raw);
    // Short tokens are usually noise ("di", "ke", "pt"), but `c#`, `3d` and `go`
    // are real skills, so a `+`/`#`/digit earns a two-character token a pass.
    const meaningful = word.length >= 3 || /[+#\d]/.test(word);
    if (!meaningful || word.length > 30) continue;
    if (STOPWORDS.has(word)) continue;
    if (/^[+.#]+$/.test(word)) continue;
    // A bare number is not a skill.
    if (/^\d+$/.test(word)) continue;
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([word]) => word);
}

export type MatchResult = {
  /** Ad keywords the CV already covers. */
  matched: string[];
  /** Ad keywords the CV never mentions — the gaps worth closing. */
  missing: string[];
  /** matched / (matched + missing), 0 when there is no ad to compare against. */
  score: number;
};

export function matchKeywords(jobAd: string, cv: CvData): MatchResult {
  const keywords = extractKeywords(jobAd);
  if (!keywords.length) return { matched: [], missing: [], score: 0 };

  const haystack = cvText(cv);
  const matched: string[] = [];
  const missing: string[] = [];

  for (const word of keywords) {
    // `\b` is unreliable next to `+`/`#`, so match on the plain substring.
    if (haystack.includes(word)) matched.push(word);
    else missing.push(word);
  }

  const total = matched.length + missing.length;
  return { matched, missing, score: total ? Math.round((matched.length / total) * 100) : 0 };
}

/* -------------------------------------------------------------------- letter */

const listJoin = (items: string[], conj: string): string => {
  const clean = items.map((i) => i.trim()).filter(Boolean);
  if (clean.length <= 1) return clean[0] ?? "";
  return `${clean.slice(0, -1).join(", ")} ${conj} ${clean[clean.length - 1]}`;
};

const topSkills = (cv: CvData, n: number): string[] =>
  cv.skills
    .flatMap((s) => s.items.split(",").map((i) => i.trim()))
    .filter(Boolean)
    .slice(0, n);

/**
 * The CV's own bullets, quoted **verbatim** under a short lead-in.
 *
 * They are never glued into a sentence of the letter. A CV written in English
 * against a letter written in Indonesian would otherwise produce hybrids like
 * "Di sana saya supported media production operations", and rewriting a bullet
 * would mean inventing a claim the CV does not make.
 */
function bulletLines(items: string[] | undefined, lead: string): string {
  const list = (items ?? []).map((b) => b.trim()).filter(Boolean);
  if (!list.length) return "";
  return `${lead}\n${list.map((b) => `\u2022 ${b}`).join("\n")}`;
}

function buildIndonesian(cv: CvData, kit: ApplicationKit): string {
  const name = cv.personal.fullName || "\u2026\u2026\u2026\u2026\u2026\u2026";
  const role = kit.role || "posisi yang ditawarkan";
  const company = kit.company || "\u2026\u2026\u2026\u2026\u2026\u2026";
  const latest = cv.experience[0];
  const project = cv.projects[0];
  const skills = topSkills(cv, 4);
  const education = cv.education[0];

  const opening = [
    `Dengan hormat,`,
    ``,
    `Saya ${name}, dan saya ingin melamar posisi ${role} di ${company}.`,
    kit.source ? `Lowongan ini saya temukan melalui ${kit.source}.` : "",
  ]
    .filter((l) => l !== "")
    .join("\n");

  const experiencePara = latest
    ? [
        `Saat ini saya ${latest.role ? `bekerja sebagai ${latest.role}` : "bekerja"}${
          latest.company ? ` di ${latest.company}` : ""
        }${latest.period ? ` (${latest.period})` : ""}.`,
        bulletLines(latest.bullets, "Beberapa hal yang saya kerjakan di sana:"),
      ]
        .filter(Boolean)
        .join("\n\n")
    : "";

  const projectPara = project
    ? [
        `Selain itu, saya mengerjakan ${project.name}.`,
        bulletLines(project.bullets, "Yang saya kerjakan di proyek itu:"),
      ]
        .filter(Boolean)
        .join("\n\n")
    : "";

  const skillsPara = skills.length
    ? `Keahlian saya mencakup ${listJoin(skills, "dan")}, yang menurut saya relevan dengan kebutuhan posisi ini.`
    : "";

  const educationPara = education
    ? `Latar belakang pendidikan saya adalah ${[education.degree, education.school]
        .filter(Boolean)
        .join(" di ")}${education.period ? ` (${education.period})` : ""}.`
    : "";

  const closing = [
    `Saya bersedia mengikuti proses seleksi dan wawancara pada waktu yang Bapak/Ibu tentukan. Terima kasih atas perhatiannya.`,
    ``,
    `Hormat saya,`,
    ``,
    name,
    [cv.personal.email, cv.personal.phone].filter(Boolean).join(" | "),
  ].join("\n");

  return [opening, experiencePara, projectPara, skillsPara, educationPara, closing]
    .filter((block) => block.trim())
    .join("\n\n");
}

function buildEnglish(cv: CvData, kit: ApplicationKit): string {
  const name = cv.personal.fullName || "\u2026\u2026\u2026\u2026\u2026\u2026";
  const role = kit.role || "the advertised role";
  const company = kit.company || "\u2026\u2026\u2026\u2026\u2026\u2026";
  const latest = cv.experience[0];
  const project = cv.projects[0];
  const skills = topSkills(cv, 4);
  const education = cv.education[0];

  const opening = [
    `Dear Hiring Manager,`,
    ``,
    `I am writing to apply for the ${role} position at ${company}.${
      kit.source ? ` I found the posting on ${kit.source}.` : ""
    }`,
  ].join("\n");

  const experiencePara = latest
    ? [
        `I currently work as ${latest.role || "a professional"} at ${
          latest.company || "my current company"
        }${latest.period ? ` (${latest.period})` : ""}.`,
        bulletLines(latest.bullets, "What I did there:"),
      ]
        .filter(Boolean)
        .join("\n\n")
    : "";

  const projectPara = project
    ? [
        `I also built ${project.name}.`,
        bulletLines(project.bullets, "Highlights from that project:"),
      ]
        .filter(Boolean)
        .join("\n\n")
    : "";

  const skillsPara = skills.length
    ? `My day-to-day toolkit includes ${listJoin(skills, "and")}, which maps onto what this role asks for.`
    : "";

  const educationPara = education
    ? `I hold ${[education.degree, education.school].filter(Boolean).join(" from ")}${
        education.period ? ` (${education.period})` : ""
      }.`
    : "";

  const closing = [
    `I would welcome the chance to discuss how I can help. Thank you for your time.`,
    ``,
    `Sincerely,`,
    ``,
    name,
    [cv.personal.email, cv.personal.phone].filter(Boolean).join(" | "),
  ].join("\n");

  return [opening, experiencePara, projectPara, skillsPara, educationPara, closing]
    .filter((block) => block.trim())
    .join("\n\n");
}

/** Draft a cover letter from the CV and the application data. Never invents facts. */
export function buildLetter(cv: CvData, kit: ApplicationKit): string {
  const body = kit.language === "en" ? buildEnglish(cv, kit) : buildIndonesian(cv, kit);
  const place = cv.personal.location.split(",")[0].trim();
  const date = new Date().toLocaleDateString(kit.language === "en" ? "en-GB" : "id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return `${place || "\u2014"}, ${date}\n\n${body}`;
}
