import type { CvData, TemplateId } from "@/lib/types";
import { esc, ensureUrl } from "@/lib/utils";

function linkify(text: string, href?: string): string {
  if (!text) return "";
  if (!href) return esc(text);
  return `<a href="${esc(ensureUrl(href))}" target="_blank" rel="noopener">${esc(text)}</a>`;
}

function contactBits(p: CvData["personal"], sep = " | "): string {
  const bits: string[] = [];
  if (p.location) bits.push(esc(p.location));
  if (p.email) bits.push(`<a href="mailto:${esc(p.email)}">${esc(p.email)}</a>`);
  if (p.phone) bits.push(esc(p.phone));
  if (p.github) bits.push(linkify(p.github, p.github));
  if (p.website) bits.push(linkify(p.website, p.website));
  if (p.linkedin) bits.push(linkify(p.linkedin, p.linkedin));
  return bits.join(`<span class="sep">${sep}</span>`);
}

function contactList(p: CvData["personal"]): string {
  const rows: string[] = [];
  if (p.email) rows.push(`<div class="c-row"><span class="c-lab">Email</span><a href="mailto:${esc(p.email)}">${esc(p.email)}</a></div>`);
  if (p.phone) rows.push(`<div class="c-row"><span class="c-lab">Phone</span>${esc(p.phone)}</div>`);
  if (p.location) rows.push(`<div class="c-row"><span class="c-lab">Loc</span>${esc(p.location)}</div>`);
  if (p.github) rows.push(`<div class="c-row"><span class="c-lab">GitHub</span>${linkify(p.github, p.github)}</div>`);
  if (p.website) rows.push(`<div class="c-row"><span class="c-lab">Web</span>${linkify(p.website, p.website)}</div>`);
  if (p.linkedin) rows.push(`<div class="c-row"><span class="c-lab">LinkedIn</span>${linkify(p.linkedin, p.linkedin)}</div>`);
  return rows.join("");
}

function bulletsHtml(bullets: string[]): string {
  const items = (bullets || []).map((b) => String(b).trim()).filter(Boolean);
  if (!items.length) return "";
  return `<ul>${items.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>`;
}

function eduHtml(data: CvData, mode: "classic" | "role-first" = "classic"): string {
  if (!(data.education || []).length) return "";
  return data.education
    .map((e) => {
      if (mode === "role-first") {
        return `<div class="entry">
          <div class="entry-head"><span class="left"><strong>${esc(e.degree)}</strong></span><span class="right">${esc(e.period)}</span></div>
          <div class="entry-sub"><span class="left">${esc(e.school)}${e.location ? ` · ${esc(e.location)}` : ""}</span></div>
          ${bulletsHtml(e.bullets)}
        </div>`;
      }
      return `<div class="entry">
        <div class="entry-head"><span class="left">${esc(e.school)}</span><span class="right">${esc(e.location)}</span></div>
        <div class="entry-sub"><span class="left">${esc(e.degree)}</span><span class="right">${esc(e.period)}</span></div>
        ${bulletsHtml(e.bullets)}
      </div>`;
    })
    .join("");
}

function expHtml(data: CvData, mode: "company" | "role" = "company"): string {
  if (!(data.experience || []).length) return "";
  return data.experience
    .map((e) => {
      if (mode === "role") {
        return `<div class="entry">
          <div class="entry-head"><span class="left"><strong>${esc(e.role)}</strong> · ${esc(e.company)}</span><span class="right">${esc(e.period)}</span></div>
          <div class="entry-sub"><span class="left">${esc(e.location)}</span></div>
          ${bulletsHtml(e.bullets)}
        </div>`;
      }
      return `<div class="entry">
        <div class="entry-head"><span class="left">${esc(e.company)}</span><span class="right">${esc(e.location)}</span></div>
        <div class="entry-sub"><span class="left">${esc(e.role)}</span><span class="right">${esc(e.period)}</span></div>
        ${bulletsHtml(e.bullets)}
      </div>`;
    })
    .join("");
}

function projHtml(data: CvData): string {
  if (!(data.projects || []).length) return "";
  return data.projects
    .map((e) => {
      const title = e.link ? `${esc(e.name)} ${linkify(e.link, e.link)}` : esc(e.name);
      return `<div class="entry">
        <div class="entry-head"><span class="left">${title}</span><span class="right"><em>${esc(e.period)}</em></span></div>
        ${bulletsHtml(e.bullets)}
      </div>`;
    })
    .join("");
}

function pubHtml(data: CvData): string {
  if (!(data.publications || []).length) return "";
  return `<ul>${data.publications
    .map((pub) => {
      const link = pub.url
        ? ` <a href="${esc(pub.url)}" target="_blank" rel="noopener">${esc(pub.url.replace(/^https?:\/\//, "").slice(0, 40))}${pub.url.length > 48 ? "…" : ""}</a>`
        : "";
      return `<li class="pub-item">${esc(pub.text || "")}${link}</li>`;
    })
    .join("")}</ul>`;
}

function skillsRows(data: CvData): string {
  return (data.skills || [])
    .filter((s) => (s.category || s.items || "").trim())
    .map((s) => `<div class="row"><strong>${esc(s.category)}:</strong> ${esc(s.items)}</div>`)
    .join("");
}

function skillsTags(data: CvData): string {
  const tags: string[] = [];
  for (const s of data.skills || []) {
    const items = String(s.items || "")
      .split(/[,;|]/)
      .map((x) => x.trim())
      .filter(Boolean);
    tags.push(...items);
  }
  if (!tags.length) return "";
  return `<div class="tag-cloud">${tags.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>`;
}

function langsLine(data: CvData, sep = " · "): string {
  return (data.languages || [])
    .filter((l) => (l.name || "").trim())
    .map((l) => `<strong>${esc(l.name)}</strong>${l.level ? `: ${esc(l.level)}` : ""}`)
    .join(sep);
}

function section(title: string, body: string): string {
  if (!body?.trim()) return "";
  return `<section><h2>${title}</h2>${body}</section>`;
}

/* ---------- Templates ---------- */

function renderJake(data: CvData): string {
  const p = data.personal || {};
  const parts: string[] = [];
  parts.push(`<header><h1>${esc(p.fullName || "Your Name")}</h1><div class="contact">${contactBits(p) || "Add contact info"}</div></header>`);
  if ((data.summary || "").trim()) {
    parts.push(section("Professional Summary", `<p class="summary">${esc(data.summary.trim())}</p>`));
  }
  parts.push(section("Education", eduHtml(data)));
  parts.push(section("Experience", expHtml(data)));
  parts.push(section("Projects", projHtml(data)));
  parts.push(section("Publications", pubHtml(data)));
  const sk = skillsRows(data);
  if (sk) parts.push(section("Technical Skills", `<div class="skills-block">${sk}</div>`));
  const lg = langsLine(data, "&nbsp;&nbsp;&nbsp;");
  if (lg) parts.push(section("Languages", `<div class="langs">${lg}</div>`));
  return parts.join("");
}

function renderModern(data: CvData): string {
  const p = data.personal || {};
  const parts: string[] = [];
  parts.push(`<header class="modern-header"><div><h1>${esc(p.fullName || "Your Name")}</h1>${
    data.summary ? `<p class="tagline">${esc(data.summary.trim().slice(0, 160))}</p>` : ""
  }</div><div class="modern-contact">${contactBits(p, "<br/>")}</div></header>`);
  parts.push(section("Experience", expHtml(data, "role")));
  parts.push(section("Education", eduHtml(data, "role-first")));
  parts.push(section("Projects", projHtml(data)));
  const sk = (data.skills || [])
    .filter((s) => (s.items || "").trim())
    .map((s) => `<div class="chip-row"><span class="chip-label">${esc(s.category)}</span><span>${esc(s.items)}</span></div>`)
    .join("");
  if (sk) parts.push(section("Skills", `<div class="skills-chips">${sk}</div>`));
  const lg = langsLine(data);
  if (lg) parts.push(section("Languages", `<div class="langs">${lg}</div>`));
  parts.push(section("Publications", pubHtml(data)));
  return parts.join("");
}

function renderCompact(data: CvData): string {
  const p = data.personal || {};
  const parts: string[] = [];
  parts.push(`<header class="compact-header"><h1>${esc(p.fullName || "Your Name")}</h1><div class="contact">${contactBits(p, " · ")}</div></header>`);
  if ((data.summary || "").trim()) {
    parts.push(`<section><p class="summary">${esc(data.summary.trim())}</p></section>`);
  }
  parts.push(section("Experience", expHtml(data, "role")));
  parts.push(section("Education", eduHtml(data, "role-first")));
  parts.push(section("Projects", projHtml(data)));
  const sk = skillsRows(data);
  if (sk) parts.push(section("Skills", `<div class="skills-block">${sk}</div>`));
  return parts.join("");
}

/** Elegant — serif, gold accent, classic professional */
function renderElegant(data: CvData): string {
  const p = data.personal || {};
  const parts: string[] = [];
  parts.push(`<header class="elegant-header">
    <h1>${esc(p.fullName || "Your Name")}</h1>
    <div class="gold-line"></div>
    <div class="contact">${contactBits(p, "  ·  ")}</div>
  </header>`);
  if ((data.summary || "").trim()) {
    parts.push(section("Profile", `<p class="summary">${esc(data.summary.trim())}</p>`));
  }
  parts.push(section("Experience", expHtml(data, "role")));
  parts.push(section("Education", eduHtml(data, "role-first")));
  parts.push(section("Projects", projHtml(data)));
  const sk = skillsRows(data);
  if (sk) parts.push(section("Expertise", `<div class="skills-block">${sk}</div>`));
  const lg = langsLine(data);
  if (lg) parts.push(section("Languages", `<div class="langs">${lg}</div>`));
  parts.push(section("Publications", pubHtml(data)));
  return parts.join("");
}

/** Sidebar — left rail contact/skills, right main */
function renderSidebar(data: CvData): string {
  const p = data.personal || {};
  const side: string[] = [];
  side.push(`<div class="side-block"><h3>Contact</h3>${contactList(p) || "<p>—</p>"}</div>`);
  const sk = skillsRows(data);
  if (sk) side.push(`<div class="side-block"><h3>Skills</h3><div class="skills-block">${sk}</div></div>`);
  const lg = langsLine(data, "<br/>");
  if (lg) side.push(`<div class="side-block"><h3>Languages</h3><div class="langs">${lg}</div></div>`);

  const main: string[] = [];
  if ((data.summary || "").trim()) {
    main.push(section("Summary", `<p class="summary">${esc(data.summary.trim())}</p>`));
  }
  main.push(section("Experience", expHtml(data, "role")));
  main.push(section("Education", eduHtml(data, "role-first")));
  main.push(section("Projects", projHtml(data)));
  main.push(section("Publications", pubHtml(data)));

  return `<div class="sidebar-layout">
    <aside class="side">
      <div class="side-name">${esc(p.fullName || "Your Name")}</div>
      ${side.join("")}
    </aside>
    <div class="main">${main.join("")}</div>
  </div>`;
}

/** Corporate — navy bar, formal */
function renderCorporate(data: CvData): string {
  const p = data.personal || {};
  const parts: string[] = [];
  parts.push(`<header class="corp-header">
    <div class="corp-bar"></div>
    <h1>${esc(p.fullName || "Your Name")}</h1>
    <div class="contact">${contactBits(p)}</div>
  </header>`);
  if ((data.summary || "").trim()) {
    parts.push(section("Executive Summary", `<p class="summary">${esc(data.summary.trim())}</p>`));
  }
  parts.push(section("Professional Experience", expHtml(data, "role")));
  parts.push(section("Education", eduHtml(data, "role-first")));
  parts.push(section("Key Projects", projHtml(data)));
  const sk = skillsRows(data);
  if (sk) parts.push(section("Core Competencies", `<div class="skills-block">${sk}</div>`));
  const lg = langsLine(data);
  if (lg) parts.push(section("Languages", `<div class="langs">${lg}</div>`));
  parts.push(section("Publications", pubHtml(data)));
  return parts.join("");
}

/** Tech — dark accent, monospace labels, tag cloud */
function renderTech(data: CvData): string {
  const p = data.personal || {};
  const parts: string[] = [];
  parts.push(`<header class="tech-header">
    <div class="tech-prompt">~/resume</div>
    <h1>${esc(p.fullName || "developer")}</h1>
    <div class="contact">${contactBits(p, "  ·  ")}</div>
  </header>`);
  if ((data.summary || "").trim()) {
    parts.push(section("// about", `<p class="summary">${esc(data.summary.trim())}</p>`));
  }
  parts.push(section("// experience", expHtml(data, "role")));
  parts.push(section("// projects", projHtml(data)));
  parts.push(section("// education", eduHtml(data, "role-first")));
  const tags = skillsTags(data);
  if (tags) parts.push(section("// skills", tags));
  else {
    const sk = skillsRows(data);
    if (sk) parts.push(section("// skills", `<div class="skills-block">${sk}</div>`));
  }
  const lg = langsLine(data);
  if (lg) parts.push(section("// languages", `<div class="langs">${lg}</div>`));
  parts.push(section("// publications", pubHtml(data)));
  return parts.join("");
}

/** Minimal — airy, light, freelancers */
function renderMinimal(data: CvData): string {
  const p = data.personal || {};
  const parts: string[] = [];
  parts.push(`<header class="min-header">
    <h1>${esc(p.fullName || "Your Name")}</h1>
    <div class="contact">${contactBits(p, "  /  ")}</div>
  </header>`);
  if ((data.summary || "").trim()) {
    parts.push(`<section class="min-summary"><p class="summary">${esc(data.summary.trim())}</p></section>`);
  }
  parts.push(section("Work", expHtml(data, "role")));
  parts.push(section("Education", eduHtml(data, "role-first")));
  parts.push(section("Selected Work", projHtml(data)));
  const sk = skillsRows(data);
  if (sk) parts.push(section("Skills", `<div class="skills-block">${sk}</div>`));
  const lg = langsLine(data);
  if (lg) parts.push(section("Languages", `<div class="langs">${lg}</div>`));
  parts.push(section("Writing", pubHtml(data)));
  return parts.join("");
}

/** Harvard — Crimson serif, double bar header */
function renderHarvard(data: CvData): string {
  const p = data.personal || {};
  const parts: string[] = [];
  parts.push(`<header><h1>${esc(p.fullName || "Your Name")}</h1><div class="contact">${contactBits(p, "  ·  ")}</div></header>`);
  if ((data.summary || "").trim()) {
    parts.push(section("Summary", `<p class="summary">${esc(data.summary.trim())}</p>`));
  }
  parts.push(section("Education", eduHtml(data, "role-first")));
  parts.push(section("Experience", expHtml(data, "role")));
  parts.push(section("Projects", projHtml(data)));
  const sk = skillsRows(data);
  if (sk) parts.push(section("Skills & Interests", `<div class="skills-block">${sk}</div>`));
  const lg = langsLine(data);
  if (lg) parts.push(section("Languages", `<div class="langs">${lg}</div>`));
  parts.push(section("Publications", pubHtml(data)));
  return parts.join("");
}

/** Executive — Clean corporate serif header with right contact */
function renderExecutive(data: CvData): string {
  const p = data.personal || {};
  const parts: string[] = [];
  parts.push(`<header class="exec-header">
    <div><h1>${esc(p.fullName || "Your Name")}</h1></div>
    <div class="contact" style="text-align: right;">${contactBits(p, "<br/>")}</div>
  </header>`);
  if ((data.summary || "").trim()) {
    parts.push(section("Executive Summary", `<p class="summary">${esc(data.summary.trim())}</p>`));
  }
  parts.push(section("Experience & Achievements", expHtml(data, "role")));
  parts.push(section("Education", eduHtml(data, "role-first")));
  parts.push(section("Projects", projHtml(data)));
  const sk = skillsRows(data);
  if (sk) parts.push(section("Core Competencies", `<div class="skills-block">${sk}</div>`));
  return parts.join("");
}

/** Creative — Indigo rail sidebar, modern typography */
function renderCreative(data: CvData): string {
  const p = data.personal || {};
  const side: string[] = [];
  side.push(`<div class="side-block"><h3>Contact</h3>${contactList(p) || "<p>—</p>"}</div>`);
  const sk = skillsRows(data);
  if (sk) side.push(`<div class="side-block"><h3>Skills</h3><div class="skills-block">${sk}</div></div>`);
  const lg = langsLine(data, "<br/>");
  if (lg) side.push(`<div class="side-block"><h3>Languages</h3><div class="langs">${lg}</div></div>`);

  const main: string[] = [];
  if ((data.summary || "").trim()) {
    main.push(section("About Me", `<p class="summary">${esc(data.summary.trim())}</p>`));
  }
  main.push(section("Experience", expHtml(data, "role")));
  main.push(section("Education", eduHtml(data, "role-first")));
  main.push(section("Featured Projects", projHtml(data)));

  return `<div class="creative-layout">
    <aside class="side">
      <h1>${esc(p.fullName || "Your Name")}</h1>
      ${side.join("")}
    </aside>
    <div class="main">${main.join("")}</div>
  </div>`;
}

/** Terminal — Matrix dark theme green code terminal style */
function renderTerminal(data: CvData): string {
  const p = data.personal || {};
  const parts: string[] = [];
  parts.push(`<header>
    <h1>> ${esc(p.fullName || "sysadmin")}</h1>
    <div class="contact">${contactBits(p, " | ")}</div>
  </header>`);
  if ((data.summary || "").trim()) {
    parts.push(section("$ cat summary.txt", `<p class="summary">${esc(data.summary.trim())}</p>`));
  }
  parts.push(section("$ git log --experience", expHtml(data, "role")));
  parts.push(section("$ ./run_projects.sh", projHtml(data)));
  parts.push(section("$ cat education.log", eduHtml(data, "role-first")));
  const tags = skillsTags(data);
  if (tags) parts.push(section("$ env | grep SKILLS", tags));
  return parts.join("");
}

export function renderResumeHtml(data: CvData, template: TemplateId = "jake"): string {
  switch (template) {
    case "modern":
      return renderModern(data);
    case "compact":
      return renderCompact(data);
    case "elegant":
      return renderElegant(data);
    case "sidebar":
      return renderSidebar(data);
    case "corporate":
      return renderCorporate(data);
    case "tech":
      return renderTech(data);
    case "minimal":
      return renderMinimal(data);
    case "harvard":
      return renderHarvard(data);
    case "executive":
      return renderExecutive(data);
    case "creative":
      return renderCreative(data);
    case "terminal":
      return renderTerminal(data);
    case "jake":
    default:
      return renderJake(data);
  }
}

export const TEMPLATE_META: Record<
  TemplateId,
  { name: string; description: string; pro: boolean; category: string }
> = {
  jake: {
    name: "Jake",
    description: "Classic ATS single-column, Times New Roman",
    pro: false,
    category: "ATS",
  },
  modern: {
    name: "Modern",
    description: "Dark header band, clean sans-serif",
    pro: true,
    category: "Creative",
  },
  compact: {
    name: "Compact",
    description: "Dense one-page for long experience",
    pro: true,
    category: "ATS",
  },
  elegant: {
    name: "Elegant",
    description: "Serif + gold accent, polished professional",
    pro: true,
    category: "Professional",
  },
  sidebar: {
    name: "Sidebar",
    description: "Two-column: left rail contact & skills",
    pro: true,
    category: "Creative",
  },
  corporate: {
    name: "Corporate",
    description: "Navy formal bar for business roles",
    pro: true,
    category: "Professional",
  },
  tech: {
    name: "Tech",
    description: "Dev-style prompt header + skill tags",
    pro: true,
    category: "Tech",
  },
  minimal: {
    name: "Minimal",
    description: "Airy whitespace, freelancers & design",
    pro: false,
    category: "Creative",
  },
  harvard: {
    name: "Harvard",
    description: "Academic Crimson serif with double divider line",
    pro: true,
    category: "Academic",
  },
  executive: {
    name: "Executive",
    description: "High-level management layout with right-aligned contact",
    pro: true,
    category: "Professional",
  },
  creative: {
    name: "Creative Pro",
    description: "Vibrant indigo sidebar for designers & marketing",
    pro: true,
    category: "Creative",
  },
  terminal: {
    name: "Terminal",
    description: "Dark hacker terminal style for CLI & DevOps engineers",
    pro: true,
    category: "Tech",
  },
};
