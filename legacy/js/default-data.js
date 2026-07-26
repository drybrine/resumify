window.DEFAULT_CV = {
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
        "Thesis: Sistem Pencatatan dan Prediksi Inventory Produk Berbasis IoT dan Machine Learning (IoT & ML-based inventory recording and stock prediction). Advisor: Assoc. Prof. Hidayat, S.Kom., M.T.",
        "Faculty of Engineering and Computer Science (Fakultas Teknik dan Ilmu Komputer)",
      ],
    },
    {
      school: "SMK Negeri 13 Bandung",
      location: "Bandung, Indonesia",
      degree: "Vocational High School Diploma in Computer and Network Engineering",
      period: "2018 – 2021",
      bullets: [
        "Studied computer assembly, OS installation, software deployment, and basic system administration for Windows/Linux workstations.",
        "Practiced LAN/WAN design, structured cabling, IP addressing, routing/switching basics, and network troubleshooting.",
        "Learned server fundamentals, network security concepts, wireless configuration, and client-server services (DHCP, DNS, file sharing).",
        "Built hands-on skills in hardware/software maintenance, PC troubleshooting, and IT support for end-user environments.",
      ],
    },
  ],
  experience: [
    {
      company: "PT Tristek Media Kreasindo",
      location: "Bandung, Indonesia",
      role: "Teknisi (Internship / Field Work Practice — PKL)",
      period: "2020 – 2021",
      bullets: [
        "Completed vocational internship (praktik kerja lapangan) supporting media production operations through hardware maintenance and troubleshooting.",
        "Assisted with network connectivity, device setup, and basic system configuration for staff workstations.",
        "Performed preventive maintenance and resolved technical issues to minimize downtime for creative and media workflows.",
      ],
    },
  ],
  projects: [
    {
      name: "StokManager — IoT Inventory & Stock Prediction",
      link: "github.com/drybrine/webinvesp32",
      period: "2025 – 2026",
      bullets: [
        "Built end-to-end warehouse inventory platform (ESP32 barcode scanner + Next.js dashboard + ML stockout forecast) for motorcycle sparepart warehouse; live at stokmanager.app; field case study: Bengkel AHASS Cinambo, Bandung.",
        "Developed ESP32 firmware (v6.5.x) with GM67 PDF417 scanner, OLED UI, EMA battery monitoring, Manual/Auto IN/Auto OUT modes, and secure HTTP-pull OTA (SHA-256 + ECDSA P-256 + boot rollback).",
        "Implemented Next.js 16 dashboard with Firebase RTDB realtime subscriptions (inventory, transactions, devices) and role-based admin (admin/operator/viewer).",
        "Designed atomic multi-path stock updates via Firebase increment() + transaction logs to prevent race conditions between dashboard and scanner operators.",
        "Built Python serverless prediction API (OLS linear regression on cumulative daily consumption) with MAE/RMSE/R² holdout metrics and SVG forecast charts; TypeScript fallback.",
        "Shipped production on Vercel + Firebase Auth/security rules, device credential provisioning (PDF417), and GitHub Actions firmware sign/release pipeline.",
      ],
    },
  ],
  publications: [
    {
      text: 'S. A. P. Pratama, Hidayat, W. G. E. Rahim, and M. A. Nugraha, "IoT-Based Barcode Scanning System Implementation Using ESP32 for Enhancing Warehouse Stock Opname Efficiency," International Journal of Research and Applied Technology (INJURATECH), vol. 5, no. 1, pp. 268–276, 2025.',
      url: "https://ojs.unikom.ac.id/index.php/injuratech/article/view/19200",
    },
  ],
  skills: [
    { category: "Languages", items: "TypeScript, JavaScript, Python, C/C++ (Arduino/ESP-IDF)" },
    { category: "Frontend", items: "Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS, shadcn/ui, Framer Motion" },
    { category: "Backend & Cloud", items: "Firebase Auth, Realtime Database, Admin SDK, Vercel Functions (Node.js + Python)" },
    { category: "Machine Learning", items: "Simple Linear Regression (OLS), time-series stock forecasting, MAE/RMSE/R²" },
    { category: "Embedded / IoT", items: "ESP32, GM67 PDF417 barcode, SSD1306 OLED, UART/I2C, ADC, WiFi, signed OTA" },
    { category: "Tools", items: "Git, GitHub Actions, ESLint, Playwright, pnpm/npm, REST APIs" },
    { category: "Networking", items: "Network Engineering (LAN/WAN, routing, switching, troubleshooting)" },
    { category: "IT Support", items: "Computer installation & setup, OS reinstall, software installation, system configuration, hardware troubleshooting" },
    { category: "Other", items: "Vibe Coding" },
  ],
  languages: [
    { name: "Indonesian", level: "Native" },
    { name: "English", level: "Technical / academic writing (abstracts, documentation)" },
  ],
};

window.EMPTY_CV = {
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
