import type { CvData, TemplateId } from "./types";
import { ALL_TEMPLATES } from "./types";

export const EMPTY_CV: CvData = {
  personal: {
    fullName: "",
    location: "",
    email: "",
    phone: "",
    github: "",
    website: "",
    linkedin: "",
  },
  summary: "",
  education: [],
  experience: [],
  projects: [],
  publications: [],
  skills: [],
  languages: [],
};

export const SAMPLE_CV: CvData = {
  personal: {
    fullName: "Surya Alamsyah Putera Pratama",
    location: "Bandung, Indonesia",
    email: "aasurya.app@gmail.com",
    phone: "",
    github: "github.com/drybrine",
    website: "stokmanager.app",
    linkedin: "",
  },
  summary: "",
  education: [
    {
      school: "Universitas Komputer Indonesia (UNIKOM)",
      location: "Bandung, Indonesia",
      degree: "Sarjana (S1), Sistem Komputer",
      period: "Expected 2026",
      bullets: [
        "Thesis: Sistem Pencatatan dan Prediksi Inventory Produk Berbasis IoT dan Machine Learning. Advisor: Assoc. Prof. Hidayat, S.Kom., M.T.",
        "Faculty of Engineering and Computer Science (Fakultas Teknik dan Ilmu Komputer)",
      ],
    },
    {
      school: "SMK Negeri 13 Bandung",
      location: "Bandung, Indonesia",
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
      company: "PT Tristek Media Kreasindo",
      location: "Bandung, Indonesia",
      role: "Teknisi (Internship / PKL)",
      period: "2020 – 2021",
      bullets: [
        "Supported media production operations through hardware maintenance and troubleshooting.",
        "Assisted with network connectivity, device setup, and basic system configuration.",
      ],
    },
  ],
  projects: [
    {
      name: "StokManager — IoT Inventory & Stock Prediction",
      link: "github.com/drybrine/webinvesp32",
      period: "2025 – 2026",
      bullets: [
        "Built end-to-end warehouse inventory platform (ESP32 + Next.js + ML forecast); live at stokmanager.app.",
        "Implemented Next.js dashboard with Firebase RTDB realtime subscriptions and role-based admin.",
        "Shipped production on Vercel + Firebase Auth with signed OTA firmware pipeline.",
      ],
    },
  ],
  publications: [
    {
      text: 'S. A. P. Pratama et al., "IoT-Based Barcode Scanning System Implementation Using ESP32 for Enhancing Warehouse Stock Opname Efficiency," INJURATECH, vol. 5, no. 1, pp. 268–276, 2025.',
      url: "https://ojs.unikom.ac.id/index.php/injuratech/article/view/19200",
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
