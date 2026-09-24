export type Plan = "free" | "pro" | "admin";

export type TemplateId =
  | "jake"
  | "modern"
  | "compact"
  | "elegant"
  | "sidebar"
  | "corporate"
  | "tech"
  | "minimal"
  | "harvard"
  | "executive"
  | "creative"
  | "terminal"
  | "swiss"
  | "scholar"
  | "timeline"
  | "mono"
  | "atlas"
  | "editorial"
  | "orbit"
  | "mono-grid";

export const ALL_TEMPLATES: TemplateId[] = [
  "jake",
  "modern",
  "compact",
  "elegant",
  "sidebar",
  "corporate",
  "tech",
  "minimal",
  "harvard",
  "executive",
  "creative",
  "terminal",
  "swiss",
  "scholar",
  "timeline",
  "mono",
  "atlas",
  "editorial",
  "orbit",
  "mono-grid",
];

export function isTemplateId(value: unknown): value is TemplateId {
  return typeof value === "string" && (ALL_TEMPLATES as readonly string[]).includes(value);
}

export interface PersonalInfo {
  fullName: string;
  location: string;
  email: string;
  phone: string;
  github: string;
  website: string;
  linkedin: string;
}

export interface EducationItem {
  school: string;
  location: string;
  degree: string;
  period: string;
  bullets: string[];
}

export interface ExperienceItem {
  company: string;
  location: string;
  role: string;
  period: string;
  bullets: string[];
}

export interface ProjectItem {
  name: string;
  link: string;
  period: string;
  bullets: string[];
}

export interface PublicationItem {
  text: string;
  url: string;
}

export interface SkillItem {
  category: string;
  items: string;
}

export interface LanguageItem {
  name: string;
  level: string;
}

export interface CvData {
  personal: PersonalInfo;
  summary: string;
  education: EducationItem[];
  experience: ExperienceItem[];
  projects: ProjectItem[];
  publications: PublicationItem[];
  skills: SkillItem[];
  languages: LanguageItem[];
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  plan: Plan;
  plan_expires_at: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export type PaymentStatus = "pending" | "paid" | "expired" | "cancelled";

export interface Payment {
  id: string;
  user_id: string;
  plan: "pro";
  amount_idr: number;
  base_amount_idr: number;
  reference: string;
  qris_payload: string;
  status: PaymentStatus;
  expires_at: string;
  paid_at: string | null;
  confirmed_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Cv {
  id: string;
  user_id: string;
  title: string;
  template: TemplateId;
  data: CvData;
  share_slug: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface CvListItem {
  id: string;
  title: string;
  template: TemplateId;
  share_slug: string | null;
  is_public: boolean;
  updated_at: string;
  created_at: string;
}
