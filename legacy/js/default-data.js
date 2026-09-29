window.DEFAULT_CV = {
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
        "Studied computer assembly, OS installation, software deployment, and basic system administration for Windows/Linux workstations.",
        "Practiced LAN/WAN design, structured cabling, IP addressing, routing/switching basics, and network troubleshooting.",
        "Learned server fundamentals, network security concepts, wireless configuration, and client-server services (DHCP, DNS, file sharing).",
        "Built hands-on skills in hardware/software maintenance, PC troubleshooting, and IT support for end-user environments.",
      ],
    },
  ],
  experience: [
    {
      company: "Acme Media Productions",
      location: "Springfield, USA",
      role: "Technician (Internship / Field Work Practice)",
      period: "2020 – 2021",
      bullets: [
        "Completed a vocational internship supporting media production operations through hardware maintenance and troubleshooting.",
        "Assisted with network connectivity, device setup, and basic system configuration for staff workstations.",
        "Performed preventive maintenance and resolved technical issues to minimize downtime for creative and media workflows.",
      ],
    },
  ],
  projects: [
    {
      name: "Inventory Tracker — IoT Stock Recording & Forecasting",
      link: "github.com/johndoe/inventory-tracker",
      period: "2025 – 2026",
      bullets: [
        "Built an end-to-end inventory platform (microcontroller scanner + web dashboard + forecasting model) for a warehouse workflow.",
        "Developed microcontroller firmware with a barcode scanner, display UI, battery monitoring, and multiple input/output modes.",
        "Implemented a dashboard with realtime subscriptions and role-based admin access (admin/operator/viewer).",
        "Designed atomic multi-path stock updates via database increments plus transaction logs to prevent race conditions.",
        "Built a serverless forecasting API (linear regression on cumulative daily consumption) with MAE/RMSE/R2 holdout metrics.",
        "Shipped to production with hosted deployment, device credential provisioning, and a signed firmware release pipeline.",
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
    { category: "Languages", items: "TypeScript, JavaScript, Python, C/C++ (Arduino/ESP-IDF)" },
    { category: "Frontend", items: "Next.js (App Router), React, Tailwind CSS, shadcn/ui, Framer Motion" },
    { category: "Backend & Cloud", items: "Firebase Auth, Realtime Database, Admin SDK, serverless functions (Node.js + Python)" },
    { category: "Machine Learning", items: "Simple Linear Regression (OLS), time-series forecasting, MAE/RMSE/R2" },
    { category: "Embedded / IoT", items: "ESP32, barcode scanner modules, OLED, UART/I2C, ADC, WiFi, signed OTA" },
    { category: "Tools", items: "Git, GitHub Actions, ESLint, Playwright, pnpm/npm, REST APIs" },
    { category: "Networking", items: "Network Engineering (LAN/WAN, routing, switching, troubleshooting)" },
    { category: "IT Support", items: "Computer installation & setup, OS reinstall, software installation, system configuration, hardware troubleshooting" },
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
