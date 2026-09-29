import type { CvData, PersonalInfo, TemplateId } from "./types";
import { ALL_TEMPLATES } from "./types";
import { safePhoto } from "./photo";
import { EMPTY_KIT, normalizeApplicationKit } from "./apply/kit";

export const EMPTY_CV: CvData = {
  personal: {
    fullName: "",
    location: "",
    email: "",
    phone: "",
    github: "",
    website: "",
    linkedin: "",
    // Present-but-empty rather than absent: normalizeCvData() always returns this
    // exact shape, and a CV with no photo is the normal case.
    photo: "",
  },
  summary: "",
  education: [],
  experience: [],
  projects: [],
  publications: [],
  skills: [],
  languages: [],
  // Like photo: normalizeCvData() always returns this shape, so the seed has to
  // match it exactly.
  apply: EMPTY_KIT,
};

const PERSONAL_KEYS: (keyof PersonalInfo)[] = [
  "fullName",
  "location",
  "email",
  "phone",
  "github",
  "website",
  "linkedin",
];

const LIST_KEYS: (keyof CvData)[] = [
  "education",
  "experience",
  "projects",
  "publications",
  "skills",
  "languages",
];

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function asStringList(value: unknown): string[] {
  return Array.isArray(value) ? value.map(asString).filter((s) => s.length > 0) : [];
}

/**
 * Coerce whatever is in the database (or in an unsaved client draft) into a shape
 * the renderers can walk without guarding. A CV row written by an older schema,
 * a partially loaded draft, or a null `data` column would otherwise blow up deep
 * inside a template with "Cannot read properties of undefined" — a blank 500 with
 * no message for the user, and no clue in the log about which field was missing.
 */
export function normalizeCvData(input: unknown): CvData {
  const raw = asRecord(input);
  const personal = asRecord(raw.personal);

  const out: CvData = {
    personal: PERSONAL_KEYS.reduce(
      (acc, key) => ({ ...acc, [key]: asString(personal[key]) }),
      {} as PersonalInfo,
    ),
    summary: asString(raw.summary),
    education: [],
    experience: [],
    projects: [],
    publications: [],
    skills: [],
    languages: [],
  };

  // The photo is a data URL, not free text: validate it instead of running it
  // through asString, and drop anything that is not a small raster image.
  out.personal.photo = safePhoto(personal.photo);

  for (const key of LIST_KEYS) {
    const items = Array.isArray(raw[key]) ? (raw[key] as unknown[]) : [];
    // Drop non-object entries: a stray null/string in the array would crash the
    // per-item field reads just as hard as a missing array would.
    (out[key] as unknown[]) = items
      .filter((item) => item && typeof item === "object")
      .map((item) => {
        const rec = asRecord(item);
        const shaped: Record<string, unknown> = {};
        for (const [field, value] of Object.entries(rec)) {
          shaped[field] = Array.isArray(value) ? asStringList(value) : asString(value);
        }
        return shaped;
      });
  }

  // The per-application workspace rides along in the same JSON, so editing a CV
  // never silently drops the cover letter attached to it.
  out.apply = normalizeApplicationKit(raw.apply);

  return out;
}

export const SAMPLE_CV: CvData = {
  personal: {
    fullName: "John Doe",
    location: "Springfield, USA",
    email: "john.doe@example.com",
    phone: "",
    github: "github.com/johndoe",
    website: "johndoe.dev",
    linkedin: "",
  },
  summary: "",
  education: [
    {
      school: "Springfield State University",
      location: "Springfield, USA",
      degree: "Bachelor of Science in Computer Science",
      period: "Expected 2026",
      bullets: [
        "Thesis: Placeholder topic combining embedded systems and applied machine learning. Advisor: Prof. Jane Example.",
        "Faculty of Engineering and Computer Science",
      ],
    },
    {
      school: "Springfield Vocational High School",
      location: "Springfield, USA",
      degree: "Vocational High School Diploma in Computer and Network Engineering",
      period: "2018 – 2021",
      bullets: [
        "Studied computer assembly, OS installation, software deployment, and basic system administration.",
        "Practiced LAN/WAN design, structured cabling, IP addressing, and network troubleshooting.",
      ],
    },
  ],
  experience: [
    {
      company: "Acme Media Productions",
      location: "Springfield, USA",
      role: "Technician (Internship)",
      period: "2020 – 2021",
      bullets: [
        "Supported media production operations through hardware maintenance and troubleshooting.",
        "Assisted with network connectivity, device setup, and basic system configuration.",
      ],
    },
  ],
  projects: [
    {
      name: "Inventory Tracker — IoT Stock Recording & Forecasting",
      link: "github.com/johndoe/inventory-tracker",
      period: "2025 – 2026",
      bullets: [
        "Built an end-to-end inventory platform (microcontroller scanner + web dashboard + forecasting model).",
        "Implemented a dashboard with realtime subscriptions and role-based admin access.",
        "Shipped to production with hosted deployment and a signed over-the-air firmware pipeline.",
      ],
    },
  ],
  publications: [
    {
      text: 'J. Doe et al., "A Placeholder Study on Automated Inventory Recording," Journal of Example Studies, vol. 5, no. 1, pp. 268–276, 2025.',
      url: "https://example.com/publication",
    },
  ],
  skills: [
    { category: "Languages", items: "TypeScript, JavaScript, Python, C/C++" },
    { category: "Frontend", items: "Next.js, React, Tailwind CSS" },
    { category: "Backend & Cloud", items: "Firebase, Supabase, Vercel, REST APIs" },
    { category: "Embedded / IoT", items: "ESP32, barcode scanners, OTA, WiFi" },
  ],
  languages: [
    { name: "Indonesian", level: "Native" },
    { name: "English", level: "Technical / academic writing" },
  ],
};

export const PLAN_LIMITS: Record<
  "free" | "pro" | "admin",
  { maxCvs: number; templates: TemplateId[]; pdf: boolean; share: boolean }
> = {
  free: { maxCvs: 1, templates: ["jake", "minimal"], pdf: true, share: false },
  pro: {
    maxCvs: 50,
    templates: [...ALL_TEMPLATES],
    pdf: true,
    share: true,
  },
  admin: {
    maxCvs: 999,
    templates: [...ALL_TEMPLATES],
    pdf: true,
    share: true,
  },
};
