(() => {
  const STORAGE_KEY = "cv-builder-v1";
  const uid = () => Math.random().toString(36).slice(2, 9);

  let state = loadState();
  let zoom = 1;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return clone(window.DEFAULT_CV);
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      setStatus("Auto-saved locally", "ok");
    } catch (_) {
      setStatus("Could not save (storage full?)", "warn");
    }
  }

  function setStatus(msg, kind = "") {
    const el = $("#status");
    el.textContent = msg;
    el.className = "status" + (kind ? " " + kind : "");
  }

  function setByPath(obj, path, value) {
    const parts = path.split(".");
    let cur = obj;
    for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]];
    cur[parts[parts.length - 1]] = value;
  }

  function getByPath(obj, path) {
    return path.split(".").reduce((a, k) => (a == null ? a : a[k]), obj);
  }

  // ---------- Preview ----------
  function esc(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function linkify(text, href) {
    if (!text) return "";
    if (!href) return esc(text);
    const url = href.startsWith("http") ? href : "https://" + href.replace(/^\/\//, "");
    return `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(text)}</a>`;
  }

  function contactBits(p) {
    const bits = [];
    if (p.location) bits.push(esc(p.location));
    if (p.email) bits.push(`<a href="mailto:${esc(p.email)}">${esc(p.email)}</a>`);
    if (p.phone) bits.push(esc(p.phone));
    if (p.github) bits.push(linkify(p.github, p.github));
    if (p.website) bits.push(linkify(p.website, p.website));
    if (p.linkedin) bits.push(linkify(p.linkedin, p.linkedin));
    return bits.join('<span class="sep">|</span>');
  }

  function bulletsHtml(bullets) {
    const items = (bullets || []).map((b) => String(b).trim()).filter(Boolean);
    if (!items.length) return "";
    return `<ul>${items.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>`;
  }

  function renderPreview() {
    const p = state.personal || {};
    const parts = [];

    parts.push(`
      <header>
        <h1>${esc(p.fullName || "Your Name")}</h1>
        <div class="contact">${contactBits(p) || "Add contact info"}</div>
      </header>
    `);

    if ((state.summary || "").trim()) {
      parts.push(`
        <section>
          <h2>Professional Summary</h2>
          <p class="summary">${esc(state.summary.trim())}</p>
        </section>
      `);
    }

    if ((state.education || []).length) {
      parts.push(`<section><h2>Education</h2>${state.education
        .map(
          (e) => `
        <div class="entry">
          <div class="entry-head">
            <span class="left">${esc(e.school)}</span>
            <span class="right">${esc(e.location)}</span>
          </div>
          <div class="entry-sub">
            <span class="left">${esc(e.degree)}</span>
            <span class="right">${esc(e.period)}</span>
          </div>
          ${bulletsHtml(e.bullets)}
        </div>`
        )
        .join("")}</section>`);
    }

    if ((state.experience || []).length) {
      parts.push(`<section><h2>Experience</h2>${state.experience
        .map(
          (e) => `
        <div class="entry">
          <div class="entry-head">
            <span class="left">${esc(e.company)}</span>
            <span class="right">${esc(e.location)}</span>
          </div>
          <div class="entry-sub">
            <span class="left">${esc(e.role)}</span>
            <span class="right">${esc(e.period)}</span>
          </div>
          ${bulletsHtml(e.bullets)}
        </div>`
        )
        .join("")}</section>`);
    }

    if ((state.projects || []).length) {
      parts.push(`<section><h2>Projects</h2>${state.projects
        .map((e) => {
          const title = e.link
            ? `${esc(e.name)} ${linkify(e.link, e.link)}`
            : esc(e.name);
          return `
        <div class="entry">
          <div class="entry-head">
            <span class="left">${title}</span>
            <span class="right"><em>${esc(e.period)}</em></span>
          </div>
          ${bulletsHtml(e.bullets)}
        </div>`;
        })
        .join("")}</section>`);
    }

    if ((state.publications || []).length) {
      parts.push(`<section><h2>Publications</h2><ul>${state.publications
        .map((pub) => {
          const body = esc(pub.text || "");
          const link = pub.url
            ? ` <a href="${esc(pub.url)}" target="_blank" rel="noopener">${esc(pub.url.replace(/^https?:\/\//, "").slice(0, 40))}${pub.url.length > 48 ? "…" : ""}</a>`
            : "";
          return `<li class="pub-item">${body}${link}</li>`;
        })
        .join("")}</ul></section>`);
    }

    if ((state.skills || []).length) {
      parts.push(`<section><h2>Technical Skills</h2><div class="skills-block">${state.skills
        .filter((s) => (s.category || s.items || "").trim())
        .map(
          (s) =>
            `<div class="row"><strong>${esc(s.category)}:</strong> ${esc(s.items)}</div>`
        )
        .join("")}</div></section>`);
    }

    if ((state.languages || []).length) {
      const line = state.languages
        .filter((l) => (l.name || "").trim())
        .map((l) => `<strong>${esc(l.name)}:</strong> ${esc(l.level || "")}`)
        .join("&nbsp;&nbsp;&nbsp;");
      if (line) {
        parts.push(`<section><h2>Languages</h2><div class="langs">${line}</div></section>`);
      }
    }

    $("#resumePreview").innerHTML = parts.join("");
  }

  // ---------- List editors ----------
  function emptyCard(msg) {
    return `<div class="empty">${esc(msg)}</div>`;
  }

  function bulletEditor(section, index, bullets) {
    const rows = (bullets || [""])
      .map(
        (b, bi) => `
      <div class="bullet-row">
        <textarea data-list="${section}" data-index="${index}" data-bullet="${bi}" rows="2" placeholder="Impact bullet...">${esc(b)}</textarea>
        <button type="button" class="btn btn-ghost btn-sm btn-danger" data-del-bullet="${section}:${index}:${bi}" title="Remove">×</button>
      </div>`
      )
      .join("");
    return `
      <div class="bullets-box">
        <label>Bullets</label>
        ${rows}
        <button type="button" class="btn btn-sm" data-add-bullet="${section}:${index}">+ Bullet</button>
      </div>`;
  }

  function renderEducationList() {
    const root = $("#list-education");
    const items = state.education || [];
    if (!items.length) {
      root.innerHTML = emptyCard("Belum ada education. Klik + Add.");
      return;
    }
    root.innerHTML = items
      .map(
        (e, i) => `
      <div class="card" data-card="education:${i}">
        <div class="card-head">
          <span class="card-title">#${i + 1} Education</span>
          <div class="card-actions">
            <button type="button" class="btn btn-ghost btn-sm" data-move="education:${i}:-1" ${i === 0 ? "disabled" : ""}>↑</button>
            <button type="button" class="btn btn-ghost btn-sm" data-move="education:${i}:1" ${i === items.length - 1 ? "disabled" : ""}>↓</button>
            <button type="button" class="btn btn-ghost btn-sm btn-danger" data-del="education:${i}">Delete</button>
          </div>
        </div>
        <div class="field-row">
          <label>School / University<input type="text" data-list="education" data-index="${i}" data-field="school" value="${esc(e.school)}" /></label>
          <label>Location<input type="text" data-list="education" data-index="${i}" data-field="location" value="${esc(e.location)}" /></label>
          <label class="field-full">Degree / Program<input type="text" data-list="education" data-index="${i}" data-field="degree" value="${esc(e.degree)}" /></label>
          <label>Period<input type="text" data-list="education" data-index="${i}" data-field="period" value="${esc(e.period)}" /></label>
        </div>
        ${bulletEditor("education", i, e.bullets)}
      </div>`
      )
      .join("");
  }

  function renderExperienceList() {
    const root = $("#list-experience");
    const items = state.experience || [];
    if (!items.length) {
      root.innerHTML = emptyCard("Belum ada experience. Klik + Add.");
      return;
    }
    root.innerHTML = items
      .map(
        (e, i) => `
      <div class="card" data-card="experience:${i}">
        <div class="card-head">
          <span class="card-title">#${i + 1} Experience</span>
          <div class="card-actions">
            <button type="button" class="btn btn-ghost btn-sm" data-move="experience:${i}:-1" ${i === 0 ? "disabled" : ""}>↑</button>
            <button type="button" class="btn btn-ghost btn-sm" data-move="experience:${i}:1" ${i === items.length - 1 ? "disabled" : ""}>↓</button>
            <button type="button" class="btn btn-ghost btn-sm btn-danger" data-del="experience:${i}">Delete</button>
          </div>
        </div>
        <div class="field-row">
          <label>Company<input type="text" data-list="experience" data-index="${i}" data-field="company" value="${esc(e.company)}" /></label>
          <label>Location<input type="text" data-list="experience" data-index="${i}" data-field="location" value="${esc(e.location)}" /></label>
          <label class="field-full">Role / Title<input type="text" data-list="experience" data-index="${i}" data-field="role" value="${esc(e.role)}" /></label>
          <label>Period<input type="text" data-list="experience" data-index="${i}" data-field="period" value="${esc(e.period)}" /></label>
        </div>
        ${bulletEditor("experience", i, e.bullets)}
      </div>`
      )
      .join("");
  }

  function renderProjectsList() {
    const root = $("#list-projects");
    const items = state.projects || [];
    if (!items.length) {
      root.innerHTML = emptyCard("Belum ada project. Klik + Add.");
      return;
    }
    root.innerHTML = items
      .map(
        (e, i) => `
      <div class="card" data-card="projects:${i}">
        <div class="card-head">
          <span class="card-title">#${i + 1} Project</span>
          <div class="card-actions">
            <button type="button" class="btn btn-ghost btn-sm" data-move="projects:${i}:-1" ${i === 0 ? "disabled" : ""}>↑</button>
            <button type="button" class="btn btn-ghost btn-sm" data-move="projects:${i}:1" ${i === items.length - 1 ? "disabled" : ""}>↓</button>
            <button type="button" class="btn btn-ghost btn-sm btn-danger" data-del="projects:${i}">Delete</button>
          </div>
        </div>
        <div class="field-row">
          <label class="field-full">Project Name<input type="text" data-list="projects" data-index="${i}" data-field="name" value="${esc(e.name)}" /></label>
          <label>Link<input type="text" data-list="projects" data-index="${i}" data-field="link" value="${esc(e.link)}" placeholder="github.com/..." /></label>
          <label>Period<input type="text" data-list="projects" data-index="${i}" data-field="period" value="${esc(e.period)}" /></label>
        </div>
        ${bulletEditor("projects", i, e.bullets)}
      </div>`
      )
      .join("");
  }

  function renderPublicationsList() {
    const root = $("#list-publications");
    const items = state.publications || [];
    if (!items.length) {
      root.innerHTML = emptyCard("Belum ada publication. Klik + Add.");
      return;
    }
    root.innerHTML = items
      .map(
        (e, i) => `
      <div class="card" data-card="publications:${i}">
        <div class="card-head">
          <span class="card-title">#${i + 1} Publication</span>
          <div class="card-actions">
            <button type="button" class="btn btn-ghost btn-sm" data-move="publications:${i}:-1" ${i === 0 ? "disabled" : ""}>↑</button>
            <button type="button" class="btn btn-ghost btn-sm" data-move="publications:${i}:1" ${i === items.length - 1 ? "disabled" : ""}>↓</button>
            <button type="button" class="btn btn-ghost btn-sm btn-danger" data-del="publications:${i}">Delete</button>
          </div>
        </div>
        <label>Citation<textarea data-list="publications" data-index="${i}" data-field="text" rows="4">${esc(e.text)}</textarea></label>
        <label>URL<input type="text" data-list="publications" data-index="${i}" data-field="url" value="${esc(e.url)}" placeholder="https://..." /></label>
      </div>`
      )
      .join("");
  }

  function renderSkillsList() {
    const root = $("#list-skills");
    const items = state.skills || [];
    if (!items.length) {
      root.innerHTML = emptyCard("Belum ada skill category. Klik + Add.");
      return;
    }
    root.innerHTML = items
      .map(
        (e, i) => `
      <div class="card" data-card="skills:${i}">
        <div class="card-head">
          <span class="card-title">#${i + 1} Skill Group</span>
          <div class="card-actions">
            <button type="button" class="btn btn-ghost btn-sm" data-move="skills:${i}:-1" ${i === 0 ? "disabled" : ""}>↑</button>
            <button type="button" class="btn btn-ghost btn-sm" data-move="skills:${i}:1" ${i === items.length - 1 ? "disabled" : ""}>↓</button>
            <button type="button" class="btn btn-ghost btn-sm btn-danger" data-del="skills:${i}">Delete</button>
          </div>
        </div>
        <div class="field-row">
          <label>Category<input type="text" data-list="skills" data-index="${i}" data-field="category" value="${esc(e.category)}" placeholder="Languages" /></label>
          <label class="field-full">Items (comma-separated)<input type="text" data-list="skills" data-index="${i}" data-field="items" value="${esc(e.items)}" /></label>
        </div>
      </div>`
      )
      .join("");
  }

  function renderLanguagesList() {
    const root = $("#list-languages");
    const items = state.languages || [];
    if (!items.length) {
      root.innerHTML = emptyCard("Belum ada language. Klik + Add.");
      return;
    }
    root.innerHTML = items
      .map(
        (e, i) => `
      <div class="card" data-card="languages:${i}">
        <div class="card-head">
          <span class="card-title">#${i + 1} Language</span>
          <div class="card-actions">
            <button type="button" class="btn btn-ghost btn-sm" data-move="languages:${i}:-1" ${i === 0 ? "disabled" : ""}>↑</button>
            <button type="button" class="btn btn-ghost btn-sm" data-move="languages:${i}:1" ${i === items.length - 1 ? "disabled" : ""}>↓</button>
            <button type="button" class="btn btn-ghost btn-sm btn-danger" data-del="languages:${i}">Delete</button>
          </div>
        </div>
        <div class="field-row">
          <label>Language<input type="text" data-list="languages" data-index="${i}" data-field="name" value="${esc(e.name)}" /></label>
          <label>Level<input type="text" data-list="languages" data-index="${i}" data-field="level" value="${esc(e.level)}" placeholder="Native / Fluent / ..." /></label>
        </div>
      </div>`
      )
      .join("");
  }

  function renderAllLists() {
    renderEducationList();
    renderExperienceList();
    renderProjectsList();
    renderPublicationsList();
    renderSkillsList();
    renderLanguagesList();
  }

  function bindPersonalFields() {
    $$("[data-path]").forEach((el) => {
      const path = el.dataset.path;
      const val = getByPath(state, path);
      if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") {
        el.value = val == null ? "" : val;
      }
    });
  }

  function refresh() {
    bindPersonalFields();
    renderAllLists();
    renderPreview();
    saveState();
  }

  // ---------- Mutations ----------
  const templates = {
    education: () => ({
      school: "",
      location: "",
      degree: "",
      period: "",
      bullets: [""],
      _id: uid(),
    }),
    experience: () => ({
      company: "",
      location: "",
      role: "",
      period: "",
      bullets: [""],
      _id: uid(),
    }),
    projects: () => ({
      name: "",
      link: "",
      period: "",
      bullets: [""],
      _id: uid(),
    }),
    publications: () => ({ text: "", url: "", _id: uid() }),
    skills: () => ({ category: "", items: "", _id: uid() }),
    languages: () => ({ name: "", level: "", _id: uid() }),
  };

  function addItem(section) {
    if (!state[section]) state[section] = [];
    state[section].push(templates[section]());
    refresh();
  }

  function delItem(section, index) {
    state[section].splice(index, 1);
    refresh();
  }

  function moveItem(section, index, dir) {
    const arr = state[section];
    const j = index + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[index], arr[j]] = [arr[j], arr[index]];
    refresh();
  }

  function addBullet(section, index) {
    if (!state[section][index].bullets) state[section][index].bullets = [];
    state[section][index].bullets.push("");
    refresh();
  }

  function delBullet(section, index, bi) {
    state[section][index].bullets.splice(bi, 1);
    if (!state[section][index].bullets.length) state[section][index].bullets = [""];
    refresh();
  }

  // ---------- Events ----------
  function onInput(e) {
    const t = e.target;

    if (t.dataset.path) {
      setByPath(state, t.dataset.path, t.value);
      renderPreview();
      saveState();
      return;
    }

    if (t.dataset.list != null && t.dataset.field != null) {
      const section = t.dataset.list;
      const index = Number(t.dataset.index);
      state[section][index][t.dataset.field] = t.value;
      renderPreview();
      saveState();
      return;
    }

    if (t.dataset.list != null && t.dataset.bullet != null) {
      const section = t.dataset.list;
      const index = Number(t.dataset.index);
      const bi = Number(t.dataset.bullet);
      if (!state[section][index].bullets) state[section][index].bullets = [];
      state[section][index].bullets[bi] = t.value;
      renderPreview();
      saveState();
    }
  }

  function onClick(e) {
    const t = e.target.closest("[data-section],[data-add],[data-del],[data-move],[data-add-bullet],[data-del-bullet]");
    if (!t) return;

    if (t.dataset.section) {
      $$(".nav-item").forEach((n) => n.classList.toggle("active", n === t));
      $$(".panel").forEach((p) =>
        p.classList.toggle("active", p.dataset.panel === t.dataset.section)
      );
      return;
    }

    if (t.dataset.add) {
      addItem(t.dataset.add);
      return;
    }

    if (t.dataset.del) {
      const [section, index] = t.dataset.del.split(":");
      delItem(section, Number(index));
      return;
    }

    if (t.dataset.move) {
      const [section, index, dir] = t.dataset.move.split(":");
      moveItem(section, Number(index), Number(dir));
      return;
    }

    if (t.dataset.addBullet) {
      const [section, index] = t.dataset.addBullet.split(":");
      addBullet(section, Number(index));
      return;
    }

    if (t.dataset.delBullet) {
      const [section, index, bi] = t.dataset.delBullet.split(":");
      delBullet(section, Number(index), Number(bi));
    }
  }

  // Toolbar
  $("#btnLoadSample").addEventListener("click", () => {
    if (!confirm("Load sample data (profil Surya)? Data saat ini akan diganti.")) return;
    state = clone(window.DEFAULT_CV);
    refresh();
    setStatus("Sample data loaded", "ok");
  });

  $("#btnClear").addEventListener("click", () => {
    if (!confirm("Reset semua field? Data lokal akan dihapus.")) return;
    state = clone(window.EMPTY_CV);
    refresh();
    setStatus("Reset complete", "warn");
  });

  $("#btnExportJson").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    const name = (state.personal.fullName || "resume").replace(/\s+/g, "_");
    a.download = `${name}_CV.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setStatus("JSON exported", "ok");
  });

  $("#btnImport").addEventListener("click", () => $("#importFile").click());
  $("#importFile").addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      state = { ...clone(window.EMPTY_CV), ...data, personal: { ...window.EMPTY_CV.personal, ...(data.personal || {}) } };
      refresh();
      setStatus("JSON imported", "ok");
    } catch (err) {
      setStatus("Import failed: invalid JSON", "warn");
    }
    e.target.value = "";
  });

  $("#btnPdf").addEventListener("click", () => {
    const prev = zoom;
    zoom = 1;
    applyZoom();
    setStatus("Opening print dialog…", "ok");
    setTimeout(() => {
      window.print();
      zoom = prev;
      applyZoom();
    }, 50);
  });

  function applyZoom() {
    $("#previewScale").style.transform = `scale(${zoom})`;
    $("#zoomLabel").textContent = Math.round(zoom * 100) + "%";
  }

  $("#zoomIn").addEventListener("click", () => {
    zoom = Math.min(1.4, zoom + 0.1);
    applyZoom();
  });
  $("#zoomOut").addEventListener("click", () => {
    zoom = Math.max(0.5, zoom - 0.1);
    applyZoom();
  });

  document.addEventListener("input", onInput);
  document.addEventListener("click", onClick);

  // Init
  refresh();
  applyZoom();
})();
