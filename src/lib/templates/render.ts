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
      const safeUrl = pub.url ? ensureUrl(pub.url) : "";
      const link = safeUrl
        ? ` <a href="${esc(safeUrl)}" target="_blank" rel="noopener">${esc(safeUrl.replace(/^https?:\/\//, "").slice(0, 40))}${safeUrl.length > 48 ? "…" : ""}</a>`
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

function renderSwiss(data: CvData): string {
  const p = data.personal || {};
  // Asymmetric three-column grid: numeral | label | body, with full-width rules
  // spanning all three tracks — an International-Typographic page, not a stack.
  const rows: Array<[string, string, string]> = [
    ["01", "PROFILE", data.summary?.trim() ? `<p class="summary">${esc(data.summary.trim())}</p>` : ""],
    ["02", "EXPERIENCE", expHtml(data, "role")],
    ["03", "EDUCATION", eduHtml(data, "role-first")],
    ["04", "SELECTED WORK", projHtml(data)],
    ["05", "SKILLS", skillsRows(data) ? `<div class="skills-block">${skillsRows(data)}</div>` : ""],
    ["06", "PUBLICATIONS", pubHtml(data)],
  ];
  const body = rows
    .filter(([, , html]) => Boolean(html && html.trim()))
    .map(
      ([num, label, html]) =>
        `<section class="swiss-row"><div class="swiss-num">${num}</div><h2 class="swiss-label">${label}</h2><div class="swiss-body">${html}</div></section>`,
    )
    .join("");
  return `<header class="swiss-header"><div class="swiss-kicker">CURRICULUM VITAE / ${esc(p.location || "PROFILE")}</div><h1>${esc(p.fullName || "Your Name")}</h1><div class="contact">${contactBits(p)}</div></header><div class="swiss-grid">${body}</div>`;
}

/** Academic CV: the date sits in the margin, entries hang off it. */
function scholarRefs(data: CvData): string {
  if (!(data.publications || []).length) return "";
  return `<ol class="scholar-refs">${data.publications
    .map((pub) => {
      const safeUrl = pub.url ? ensureUrl(pub.url) : "";
      const link = safeUrl
        ? ` <a href="${esc(safeUrl)}" target="_blank" rel="noopener">${esc(safeUrl.replace(/^https?:\/\//, "").slice(0, 40))}${safeUrl.length > 48 ? "…" : ""}</a>`
        : "";
      return `<li class="pub-item">${esc(pub.text || "")}${link}</li>`;
    })
    .join("")}</ol>`;
}

function renderScholar(data: CvData): string {
  const p = data.personal || {};
  const entries = [
    ...(data.education || []).map((e) => ({
      heading: e.degree || e.school,
      sub: [e.school, e.location].filter(Boolean).join(" · "),
      period: e.period,
      bullets: e.bullets,
    })),
    ...(data.experience || []).map((e) => ({
      heading: e.role || e.company,
      sub: [e.company, e.location].filter(Boolean).join(" · "),
      period: e.period,
      bullets: e.bullets,
    })),
  ];
  // The date owns a real margin column, separated from the entry by a rule —
  // the classic academic CV reading, not another full-width stack.
  const list = `<div class="scholar-list">${entries
    .map(
      (e) =>
        `<div class="scholar-entry"><div class="scholar-year">${esc(e.period)}</div><div class="scholar-body"><h3>${esc(e.heading)}</h3>${e.sub ? `<p class="scholar-sub">${esc(e.sub)}</p>` : ""}${bulletsHtml(e.bullets)}</div></div>`,
    )
    .join("")}</div>`;
  const parts = [
    `<header class="scholar-header"><div class="scholar-kicker">ACADEMIC CURRICULUM VITAE</div><h1>${esc(p.fullName || "Your Name")}</h1><div class="contact">${contactBits(p)}</div></header>`,
  ];
  if (data.summary?.trim()) {
    parts.push(section("Research Profile", `<p class="summary">${esc(data.summary.trim())}</p>`));
  }
  parts.push(section("Appointments & Education", list));
  parts.push(section("Selected Publications", scholarRefs(data)));
  parts.push(section("Research Projects", projHtml(data)));
  const skills = skillsRows(data);
  if (skills) parts.push(section("Methods & Expertise", `<div class="skills-block">${skills}</div>`));
  const langs = langsLine(data);
  if (langs) parts.push(section("Languages", `<div class="langs">${langs}</div>`));
  return parts.join("");
}

function renderTimeline(data: CvData): string {
  const p = data.personal || {};
  const entries = [...(data.experience || []).map((e) => ({ heading: e.role || e.company, org: e.company, location: e.location, period: e.period, bullets: e.bullets })), ...(data.education || []).map((e) => ({ heading: e.degree || e.school, org: e.school, location: e.location, period: e.period, bullets: e.bullets }))];
  const timeline = entries.map((item) => `<div class="timeline-entry"><div class="timeline-date">${esc(item.period)}</div><div class="timeline-content"><h3>${esc(item.heading)}</h3><p class="timeline-org">${esc(item.org)}${item.location ? ` · ${esc(item.location)}` : ""}</p>${bulletsHtml(item.bullets)}</div></div>`).join("");
  const parts = [`<header class="timeline-header"><p class="timeline-kicker">EXPERIENCE / EDUCATION</p><h1>${esc(p.fullName || "Your Name")}</h1><div class="contact">${contactBits(p)}</div></header>`];
  if (data.summary?.trim()) parts.push(section("Profile", `<p class="summary">${esc(data.summary.trim())}</p>`));
  parts.push(section("Career timeline", `<div class="timeline">${timeline}</div>`));
  parts.push(section("Selected Projects", projHtml(data)));
  const skills = skillsRows(data);
  if (skills) parts.push(section("Skills", `<div class="skills-block">${skills}</div>`));
  return parts.join("");
}

/** Typewriter: each section is a listing block ruled down its left edge. */
/** Typewriter: the page is a monospace listing, every section ruled and numbered. */
function renderMono(data: CvData): string {
  const p = data.personal || {};
  const blocks: Array<[string, string]> = [
    ["profile", data.summary?.trim() ? `<p class="summary">${esc(data.summary.trim())}</p>` : ""],
    ["experience", expHtml(data, "role")],
    ["education", eduHtml(data, "role-first")],
    ["projects", projHtml(data)],
    ["skills", skillsRows(data) ? `<div class="skills-block">${skillsRows(data)}</div>` : ""],
    ["publications", pubHtml(data)],
  ];
  const body = blocks
    .filter(([, html]) => Boolean(html && html.trim()))
    .map(
      ([fn, html], i) =>
        `<div class="mono-block"><div class="mono-gutter">${String(i + 1).padStart(2, "0")}</div><div class="mono-body"><div class="mono-fn">${fn}</div><div class="mono-code">${html}</div></div></div>`,
    )
    .join("");
  return `<header class="mono-header"><h1>${esc(p.fullName || "Your Name")}</h1><div class="contact">${contactBits(p)}</div></header>${body}`;
}

function renderAtlas(data: CvData): string {
  const p = data.personal || {};
  const main: string[] = [];
  if (data.summary?.trim()) main.push(section("Overview", `<p class="summary">${esc(data.summary.trim())}</p>`));
  main.push(section("Experience", expHtml(data, "role")));
  main.push(section("Education", eduHtml(data, "role-first")));
  main.push(section("Selected Projects", projHtml(data)));

  const rail: string[] = [];
  const tags = skillsTags(data);
  if (tags) rail.push(`<div class="atlas-block"><h3>Toolkit</h3>${tags}</div>`);
  const langs = langsLine(data, "<br/>");
  if (langs) rail.push(`<div class="atlas-block"><h3>Languages</h3><div class="langs">${langs}</div></div>`);
  const pubs = pubHtml(data);
  if (pubs) rail.push(`<div class="atlas-block"><h3>Publications</h3>${pubs}</div>`);

  const aside = rail.length ? `<aside class="atlas-rail">${rail.join("")}</aside>` : "";
  return `<header class="atlas-header"><div class="atlas-place">${esc(p.location || "AVAILABLE WORLDWIDE")}</div><h1>${esc(p.fullName || "Your Name")}</h1><div class="contact">${contactBits(p)}</div></header><div class="atlas-layout"><div class="atlas-main">${main.join("")}</div>${aside}</div>`;
}

/** Magazine: a drop-cap lede and the short sections flow in two columns. */
function renderEditorial(data: CvData): string {
  const p = data.personal || {};
  const spread: string[] = [];
  if (data.summary?.trim()) spread.push(`<p class="editorial-lede">${esc(data.summary.trim())}</p>`);
  const edu = eduHtml(data, "role-first");
  if (edu) spread.push(section("Education", edu));
  const skills = skillsRows(data);
  if (skills) spread.push(section("Capabilities", `<div class="skills-block">${skills}</div>`));
  const langs = langsLine(data);
  if (langs) spread.push(section("Languages", `<div class="langs">${langs}</div>`));

  const wide: string[] = [];
  wide.push(section("Selected experience", expHtml(data, "role")));
  wide.push(section("Selected work", projHtml(data)));
  wide.push(section("Publications", pubHtml(data)));

  return `<header class="editorial-header"><p class="editorial-index">PORTFOLIO / CV</p><h1>${esc(p.fullName || "Your Name")}</h1><div class="editorial-bottom"><span>${esc(p.location || "")}</span><span class="contact">${contactBits(p)}</span></div></header><div class="editorial-spread">${spread.join("")}</div><div class="editorial-wide">${wide.join("")}</div>`;
}

/** Orbit: a centred narrow measure under the ring — the page reads as a column. */
/** Orbit: centred ring header, then the page opens into a two-block grid. */
function renderOrbit(data: CvData): string {
  const p = data.personal || {};
  const blk = (title: string, body: string, span = false) =>
    body && body.trim()
      ? `<section class="orbit-block${span ? " orbit-span" : ""}"><h2>${title}</h2>${body}</section>`
      : "";
  const top: string[] = [];
  if (data.summary?.trim()) top.push(blk("Summary", `<p class="summary">${esc(data.summary.trim())}</p>`, true));
  top.push(blk("Experience", expHtml(data, "role"), true));

  const grid: string[] = [];
  grid.push(blk("Education", eduHtml(data, "role-first")));
  grid.push(blk("Projects", projHtml(data)));
  const skills = skillsRows(data);
  if (skills) grid.push(blk("Skills", `<div class="skills-block">${skills}</div>`));
  const langs = langsLine(data);
  if (langs) grid.push(blk("Languages", `<div class="langs">${langs}</div>`));

  return `<header class="orbit-header"><div class="orbit-orbit" aria-hidden="true"></div><p class="orbit-label">CAREER PROFILE</p><h1>${esc(p.fullName || "Your Name")}</h1><div class="contact">${contactBits(p)}</div></header><div class="orbit-body">${top.join("")}</div><div class="orbit-grid">${grid.join("")}</div>`;
}

function renderMonoGrid(data: CvData): string {
  const p = data.personal || {};
  const rows = [["PROFILE", data.summary?.trim() ? `<p class="summary">${esc(data.summary.trim())}</p>` : ""], ["EXPERIENCE", expHtml(data, "role")], ["EDUCATION", eduHtml(data, "role-first")], ["PROJECTS", projHtml(data)], ["SKILLS", skillsRows(data)], ["PUBLICATIONS", pubHtml(data)]] as const;
  return `<header class="monogrid-header"><h1>${esc(p.fullName || "Your Name")}</h1><div class="contact">${contactBits(p)}</div></header>${rows.map(([label, body]) => body.trim() ? `<section class="monogrid-row"><h2>${label}</h2><div>${body}</div></section>` : "").join("")}`;
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
    case "swiss":
      return renderSwiss(data);
    case "scholar":
      return renderScholar(data);
    case "timeline":
      return renderTimeline(data);
    case "mono":
      return renderMono(data);
    case "atlas":
      return renderAtlas(data);
    case "editorial":
      return renderEditorial(data);
    case "orbit":
      return renderOrbit(data);
    case "mono-grid":
      return renderMonoGrid(data);
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
  swiss: { name: "Swiss", description: "Grid asimetris: nomor, label, dan isi dalam tiga kolom", pro: true, category: "ATS / Editorial" },
  scholar: { name: "Scholar", description: "CV akademik: tahun di margin kiri, publikasi bernomor", pro: true, category: "Academic" },
  timeline: { name: "Timeline", description: "Perjalanan karier dengan tanggal dalam satu garis", pro: true, category: "Professional" },
  mono: { name: "Mono", description: "Typewriter: tiap seksi blok bergaris kiri, ala listing kode", pro: true, category: "Professional" },
  atlas: { name: "Atlas", description: "Masthead penuh dengan body dua kolom dan rail kanan", pro: true, category: "Professional" },
  editorial: { name: "Editorial", description: "Majalah: nama display, ringkasan dua kolom ber-drop cap", pro: true, category: "Creative" },
  orbit: { name: "Orbit", description: "Kolom terpusat di bawah ring dengan marker kiri", pro: true, category: "Creative" },
  "mono-grid": { name: "Mono Grid", description: "Grid label teknis dalam palet hitam-putih", pro: true, category: "Tech" },
};
