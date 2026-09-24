import type { TemplateId } from "@/lib/types";
import { esc } from "@/lib/utils";

const BASE = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .resume {
    width: 8.5in;
    min-height: 11in;
    background: #fff;
    color: #000;
    padding: 0.45in 0.55in;
  }
  .resume a { color: inherit; text-decoration: none; }
  .resume .sep { margin: 0 4pt; }
  .resume section { margin-top: 8pt; }
  .resume .entry { margin-bottom: 5pt; }
  .resume .entry-head,
  .resume .entry-sub {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8pt;
  }
  .resume .entry-head .right,
  .resume .entry-sub .right { white-space: nowrap; }
  .resume ul { margin: 1pt 0 0 14pt; padding: 0; }
  .resume li { margin-bottom: 1.5pt; line-height: 1.28; }
  .resume .summary { text-align: justify; margin-bottom: 2pt; }
  .resume .pub-item { margin-bottom: 3pt; }
  .resume .skills-block .row { margin-bottom: 1pt; }
  .tag-cloud { display: flex; flex-wrap: wrap; gap: 4pt; }
  .tag {
    display: inline-block;
    border: 1px solid currentColor;
    border-radius: 3pt;
    padding: 1.5pt 6pt;
    font-size: 8.5pt;
  }
`;

const JAKE = `
  .resume { font-family: "Times New Roman", Times, Georgia, serif; font-size: 10.5pt; line-height: 1.25; }
  .resume header { text-align: center; margin-bottom: 8pt; }
  .resume header h1 {
    font-size: 20pt; font-weight: 700; letter-spacing: 0.4pt;
    text-transform: uppercase; font-variant: small-caps; margin-bottom: 3pt;
  }
  .resume .contact { font-size: 9.5pt; line-height: 1.35; }
  .resume h2 {
    font-size: 11.5pt; font-weight: 400; font-variant: small-caps;
    letter-spacing: 0.8pt; border-bottom: 1px solid #000;
    padding-bottom: 1pt; margin-bottom: 5pt; text-transform: lowercase;
  }
  .resume .entry-head .left { font-weight: 700; font-size: 10.5pt; }
  .resume .entry-sub { font-style: italic; font-size: 10pt; margin-bottom: 1pt; }
  .resume li, .resume .skills-block, .resume .langs, .resume .summary, .resume .pub-item { font-size: 10pt; }
`;

const MODERN = `
  .resume { font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; font-size: 10pt; line-height: 1.35; padding: 0; }
  .modern-header {
    display: flex; justify-content: space-between; gap: 16pt;
    background: #0f172a; color: #fff; padding: 0.4in 0.55in; margin: 0 0 10pt;
  }
  .modern-header h1 { font-size: 22pt; font-weight: 700; letter-spacing: -0.3pt; margin-bottom: 4pt; color: #fff; }
  .modern-header .tagline { font-size: 9.5pt; color: #cbd5e1; max-width: 4.5in; }
  .modern-contact { font-size: 9pt; text-align: right; color: #e2e8f0; line-height: 1.5; }
  .modern-contact a { color: #93c5fd; }
  .resume section { padding: 0 0.55in; margin-top: 10pt; }
  .resume h2 {
    font-size: 11pt; font-weight: 700; letter-spacing: 0.6pt; text-transform: uppercase;
    color: #0f172a; border-bottom: 2px solid #0f172a; padding-bottom: 2pt; margin-bottom: 6pt;
  }
  .resume .entry-head .right { font-size: 9.5pt; color: #475569; }
  .resume .entry-sub { font-size: 9.5pt; color: #64748b; margin-bottom: 2pt; }
  .skills-chips .chip-row { display: flex; gap: 8pt; margin-bottom: 3pt; font-size: 10pt; }
  .chip-label { min-width: 90pt; font-weight: 700; color: #0f172a; }
`;

const COMPACT = `
  .resume { font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; font-size: 9.5pt; line-height: 1.22; padding: 0.35in 0.45in; }
  .compact-header { text-align: left; margin-bottom: 6pt; border-bottom: 1.5pt solid #111; padding-bottom: 4pt; }
  .compact-header h1 { font-size: 16pt; font-weight: 700; margin-bottom: 2pt; }
  .compact-header .contact { font-size: 8.5pt; color: #333; }
  .resume h2 {
    font-size: 10pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5pt;
    border-bottom: 0.75pt solid #333; padding-bottom: 1pt; margin-bottom: 3pt; margin-top: 2pt;
  }
  .resume section { margin-top: 6pt; }
  .entry.compact { margin-bottom: 3pt; }
  .resume li { font-size: 9pt; margin-bottom: 0.5pt; }
  .resume .summary { font-size: 9pt; margin-bottom: 4pt; }
`;

const ELEGANT = `
  .resume {
    font-family: Georgia, "Times New Roman", serif;
    font-size: 10.5pt; line-height: 1.35; color: #1c1917; padding: 0.5in 0.6in;
  }
  .elegant-header { text-align: center; margin-bottom: 14pt; }
  .elegant-header h1 {
    font-size: 24pt; font-weight: 400; letter-spacing: 2pt;
    text-transform: uppercase; color: #1c1917; margin-bottom: 8pt;
  }
  .gold-line {
    width: 60pt; height: 1.5pt; background: #b45309;
    margin: 0 auto 8pt;
  }
  .elegant-header .contact { font-size: 9pt; color: #57534e; letter-spacing: 0.3pt; }
  .elegant-header .contact a { color: #57534e; }
  .resume h2 {
    font-size: 11pt; font-weight: 600; letter-spacing: 1.5pt; text-transform: uppercase;
    color: #b45309; border-bottom: 0.5pt solid #e7e5e4; padding-bottom: 3pt; margin-bottom: 8pt;
  }
  .resume .entry-head .left { font-weight: 600; }
  .resume .entry-sub { font-style: italic; color: #57534e; font-size: 9.5pt; }
  .resume .entry-head .right { color: #78716c; font-size: 9.5pt; }
`;

const SIDEBAR = `
  .resume {
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    font-size: 9.5pt; line-height: 1.35; padding: 0; color: #1e293b;
  }
  .sidebar-layout { display: flex; min-height: 11in; }
  .side {
    width: 2.45in; background: #1e293b; color: #e2e8f0;
    padding: 0.4in 0.3in; flex-shrink: 0;
  }
  .side-name {
    font-size: 16pt; font-weight: 700; color: #fff; line-height: 1.2;
    margin-bottom: 16pt; letter-spacing: -0.2pt;
  }
  .side-block { margin-bottom: 14pt; }
  .side h3 {
    font-size: 8.5pt; font-weight: 700; letter-spacing: 1pt; text-transform: uppercase;
    color: #94a3b8; margin-bottom: 6pt; border-bottom: 1px solid #334155; padding-bottom: 3pt;
  }
  .c-row { margin-bottom: 5pt; font-size: 8.5pt; line-height: 1.35; word-break: break-word; }
  .c-lab { display: block; color: #64748b; font-size: 7.5pt; text-transform: uppercase; letter-spacing: 0.5pt; }
  .side a { color: #93c5fd; }
  .side .skills-block .row { margin-bottom: 4pt; font-size: 8.5pt; }
  .side .skills-block strong { color: #cbd5e1; display: block; font-size: 8pt; }
  .main { flex: 1; padding: 0.4in 0.4in 0.4in 0.35in; }
  .main h2 {
    font-size: 11pt; font-weight: 700; letter-spacing: 0.8pt; text-transform: uppercase;
    color: #1e293b; border-bottom: 2px solid #1e293b; padding-bottom: 2pt; margin-bottom: 8pt;
  }
  .main section { margin-top: 12pt; }
  .main section:first-child { margin-top: 0; }
  .main .entry-head .right { color: #64748b; font-size: 9pt; }
  .main .entry-sub { color: #64748b; font-size: 9pt; }
`;

const CORPORATE = `
  .resume {
    font-family: Calibri, "Segoe UI", Arial, sans-serif;
    font-size: 10.5pt; line-height: 1.3; color: #0f172a; padding: 0.4in 0.55in;
  }
  .corp-header { margin-bottom: 12pt; }
  .corp-bar { height: 6pt; background: #1e3a5f; margin: 0 -0.55in 10pt; width: calc(100% + 1.1in); }
  .corp-header h1 {
    font-size: 22pt; font-weight: 700; color: #1e3a5f; letter-spacing: 0.5pt; margin-bottom: 4pt;
  }
  .corp-header .contact { font-size: 9.5pt; color: #475569; }
  .corp-header .contact a { color: #1e3a5f; }
  .resume h2 {
    font-size: 11pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8pt;
    color: #1e3a5f; background: #f1f5f9; padding: 3pt 6pt; margin-bottom: 6pt; margin-top: 2pt;
  }
  .resume .entry-head .left { font-weight: 700; color: #0f172a; }
  .resume .entry-head .right { color: #1e3a5f; font-weight: 600; font-size: 9.5pt; }
  .resume .entry-sub { color: #475569; font-size: 9.5pt; }
`;

const TECH = `
  .resume {
    font-family: "SF Mono", "Cascadia Code", "Consolas", "Courier New", monospace;
    font-size: 9.5pt; line-height: 1.4; color: #0f172a; padding: 0.4in 0.5in;
    border-top: 4pt solid #10b981;
  }
  .tech-header { margin-bottom: 12pt; }
  .tech-prompt {
    font-size: 8pt; color: #10b981; letter-spacing: 0.5pt; margin-bottom: 2pt;
  }
  .tech-header h1 {
    font-size: 20pt; font-weight: 700; color: #0f172a; letter-spacing: -0.5pt; margin-bottom: 4pt;
  }
  .tech-header .contact { font-size: 8.5pt; color: #64748b; }
  .tech-header .contact a { color: #059669; }
  .resume h2 {
    font-size: 10pt; font-weight: 600; color: #10b981; letter-spacing: 0;
    border-bottom: 1px dashed #d1d5db; padding-bottom: 2pt; margin-bottom: 6pt;
    text-transform: none; font-family: inherit;
  }
  .resume .entry-head .left { font-weight: 600; }
  .resume .entry-head .right { color: #64748b; font-size: 8.5pt; }
  .resume .entry-sub { color: #6b7280; font-size: 9pt; }
  .tag { border-color: #10b981; color: #047857; background: #ecfdf5; }
`;

const MINIMAL = `
  .resume {
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    font-size: 10pt; line-height: 1.45; color: #292524; padding: 0.6in 0.7in;
  }
  .min-header { margin-bottom: 20pt; }
  .min-header h1 {
    font-size: 28pt; font-weight: 300; letter-spacing: -0.5pt; color: #1c1917; margin-bottom: 6pt;
  }
  .min-header .contact { font-size: 9pt; color: #a8a29e; letter-spacing: 0.2pt; }
  .min-header .contact a { color: #78716c; }
  .min-summary { margin-bottom: 4pt; }
  .min-summary .summary { font-size: 10.5pt; color: #44403c; text-align: left; line-height: 1.5; }
  .resume h2 {
    font-size: 9pt; font-weight: 600; letter-spacing: 2pt; text-transform: uppercase;
    color: #a8a29e; border: none; margin-bottom: 10pt; margin-top: 4pt; padding: 0;
  }
  .resume section { margin-top: 16pt; }
  .resume .entry { margin-bottom: 10pt; }
  .resume .entry-head .left { font-weight: 500; font-size: 10.5pt; }
  .resume .entry-head .right { color: #a8a29e; font-size: 9pt; font-weight: 400; }
  .resume .entry-sub { color: #78716c; font-size: 9.5pt; margin-bottom: 3pt; }
  .resume ul { margin-left: 12pt; }
  .resume li { color: #44403c; margin-bottom: 2pt; }
`;

const HARVARD = `
  .resume { font-family: Garamond, "Times New Roman", Georgia, serif; font-size: 10.5pt; line-height: 1.3; color: #111; padding: 0.5in 0.6in; }
  .resume header { text-align: center; border-bottom: 2.5pt double #800000; padding-bottom: 6pt; margin-bottom: 10pt; }
  .resume header h1 { font-size: 22pt; font-weight: 700; color: #800000; letter-spacing: 1pt; margin-bottom: 3pt; text-transform: uppercase; }
  .resume .contact { font-size: 9.5pt; color: #333; }
  .resume h2 { font-size: 11pt; font-weight: 700; text-transform: uppercase; color: #800000; letter-spacing: 0.5pt; border-bottom: 1pt solid #800000; margin-bottom: 5pt; }
`;

const EXECUTIVE = `
  .resume { font-family: Georgia, serif; font-size: 10pt; line-height: 1.35; color: #1e293b; padding: 0.45in 0.55in; }
  .exec-header { display: flex; justify-content: space-between; border-bottom: 2pt solid #0f172a; padding-bottom: 8pt; margin-bottom: 12pt; }
  .exec-header h1 { font-size: 24pt; font-weight: 700; color: #0f172a; margin-bottom: 2pt; }
  .resume h2 { font-size: 10.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1pt; color: #0f172a; border-bottom: 1pt solid #cbd5e1; padding-bottom: 2pt; margin-bottom: 6pt; }
`;

const CREATIVE = `
  .resume { font-family: "Inter", system-ui, sans-serif; font-size: 9.5pt; line-height: 1.35; padding: 0; color: #0f172a; }
  .creative-layout { display: flex; min-height: 11in; }
  .creative-layout .side { width: 2.6in; background: #6366f1; color: #fff; padding: 0.45in 0.35in; flex-shrink: 0; }
  .creative-layout .side h1 { font-size: 18pt; font-weight: 800; line-height: 1.15; margin-bottom: 12pt; color: #fff; }
  .creative-layout .side h3 { font-size: 8.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1pt; opacity: 0.8; border-bottom: 1px solid rgba(255,255,255,0.3); padding-bottom: 3pt; margin-bottom: 6pt; color: #fff; }
  .creative-layout .side a { color: #e0e7ff; }
  .creative-layout .main { flex: 1; padding: 0.45in 0.4in; }
  .creative-layout .main h2 { font-size: 11pt; font-weight: 700; text-transform: uppercase; color: #4338ca; border-bottom: 2px solid #e0e7ff; padding-bottom: 3pt; margin-bottom: 8pt; }
`;

const TERMINAL = `
  .resume { font-family: "Courier New", Courier, monospace; font-size: 9pt; line-height: 1.35; color: #00ff66; background: #0c1017; padding: 0.4in 0.5in; }
  .resume header { border-bottom: 1px dashed #00ff66; padding-bottom: 6pt; margin-bottom: 10pt; }
  .resume header h1 { font-size: 18pt; font-weight: 700; color: #00ff66; margin-bottom: 4pt; }
  .resume h2 { font-size: 10pt; font-weight: 700; color: #38bdf8; border-bottom: 1px solid #1e293b; padding-bottom: 2pt; margin-bottom: 6pt; }
  .resume a { color: #38bdf8; }
`;

const SWISS = `.resume{font:9.6pt/1.34 Arial,sans-serif;color:#17202b;padding:.55in .58in}.swiss-header{border-bottom:2pt solid #cf312b;padding-bottom:12pt;margin-bottom:13pt}.swiss-kicker{font-size:7.5pt;letter-spacing:1.7pt;color:#cf312b;margin-bottom:8pt}.swiss-header h1{font-size:27pt;margin-bottom:6pt}.swiss-header .contact{font-size:8.7pt;color:#56616d}.resume .swiss-row{display:grid;grid-template-columns:1.05in 1fr;gap:14pt;margin-top:10pt}.swiss-row h2{font:700 7.8pt Arial;color:#cf312b;border:0;padding:0;margin:1pt 0}.swiss-row>div{border-bottom:.5pt solid #d7dce1;padding-bottom:7pt}`;
const SCHOLAR = `.resume{font:10.3pt/1.35 Garamond,Georgia,serif;color:#25201c;padding:.55in .68in}.scholar-header{text-align:center;border-bottom:3pt double #762f38;padding-bottom:9pt;margin-bottom:12pt}.scholar-kicker{font:700 7.5pt Arial;letter-spacing:1.8pt;color:#762f38}.scholar-header h1{font-size:23pt;color:#762f38}.scholar-header .contact{font:8.8pt Arial;color:#655d56}.resume h2{font-size:10.8pt;color:#762f38;border-bottom:.7pt solid #c9b8b5;padding-bottom:2pt;margin-bottom:5pt}.resume section{margin-top:9pt}.resume .entry{margin-bottom:6pt}`;
const TIMELINE = `.resume{font:9.5pt/1.35 Arial,sans-serif;color:#1b2935;padding:.5in .58in}.timeline-header{border-left:4pt solid #126b67;padding:4pt 0 8pt 12pt;margin-bottom:13pt}.timeline-kicker{color:#126b67;font-size:7.5pt;letter-spacing:1.3pt}.timeline-header h1{font-size:24pt}.resume h2{font-size:10pt;text-transform:uppercase;letter-spacing:.8pt;color:#126b67;border-bottom:1pt solid #c7d7d5;padding-bottom:3pt;margin-bottom:8pt}.timeline-entry{display:grid;grid-template-columns:.95in 1fr;gap:12pt;position:relative;margin:0 0 9pt 3pt;padding-left:12pt;border-left:1pt solid #9abbb8}.timeline-entry:before{content:'';position:absolute;width:5pt;height:5pt;border-radius:50%;background:#126b67;left:-3pt;top:3pt}.timeline-date{color:#126b67;font-size:8.2pt;font-weight:bold}.timeline-org{font-size:8.8pt;color:#66757e}`;
const MONO = `.resume{font:9.6pt/1.34 Arial,sans-serif;color:#202020;padding:.52in .62in;border-top:5pt solid #202020}.mono-header{display:flex;justify-content:space-between;gap:16pt;align-items:end;border-bottom:1pt solid #333;padding-bottom:7pt;margin-bottom:10pt}.mono-header h1{font-size:23pt}.mono-header .contact{max-width:3.4in;text-align:right;font-size:8pt;color:#555}.resume h2{font-size:9.2pt;letter-spacing:1pt;text-transform:uppercase;border-bottom:1pt solid #333;padding-bottom:2pt;margin-bottom:5pt}.resume section{margin-top:9pt}`;
const ATLAS = `.resume{font:9.5pt/1.32 Arial,sans-serif;color:#202b38;padding:.48in .56in}.atlas-header{background:#153a5b;color:white;padding:15pt 17pt 12pt;margin:-.48in -.56in 12pt}.atlas-place{font-size:7.5pt;letter-spacing:1.2pt;text-transform:uppercase;color:#a8c7dc}.atlas-header h1{font-size:23pt;margin:5pt 0}.atlas-header .contact,.atlas-header a{color:#e0edf5;font-size:8.5pt}.resume h2{font-size:10.3pt;color:#153a5b;border-bottom:1pt solid #b6c9d5;padding-bottom:2pt;margin-bottom:5pt}.resume section{margin-top:8pt}.tag{color:#153a5b;border-color:#8aa9be;background:#eff5f8}`;
const EDITORIAL = `.resume{font:10pt/1.38 Georgia,'Times New Roman',serif;color:#26231f;padding:.58in .68in}.editorial-header{border-block:1pt solid #27231f;padding:9pt 0 10pt;margin-bottom:14pt}.editorial-index{font:bold 7.5pt Arial;letter-spacing:1.5pt;color:#a14b36;margin-bottom:8pt}.editorial-header h1{font-size:29pt;line-height:1;margin-bottom:8pt}.editorial-bottom{display:flex;justify-content:space-between;gap:12pt;font:8.1pt Arial;color:#625d55}.editorial-bottom .contact{text-align:right}.resume h2{font:italic 600 13pt Georgia,serif;border-bottom:.5pt solid #c9c2b8;padding-bottom:3pt;margin-bottom:6pt}.resume section{margin-top:11pt}`;
const ORBIT = `.resume{font:9.7pt/1.35 Arial,sans-serif;color:#232a3a;padding:.5in .6in}.orbit-header{position:relative;overflow:hidden;border-bottom:1pt solid #d3d7e1;padding-bottom:10pt;margin-bottom:11pt}.orbit-orbit{position:absolute;width:1.35in;height:1.35in;right:.15in;top:-.75in;border:12pt solid #eee9f8;border-radius:50%}.orbit-label{position:relative;color:#6752a3;font-size:7.5pt;letter-spacing:1.6pt}.orbit-header h1,.orbit-header .contact{position:relative}.orbit-header h1{font-size:25pt}.orbit-header .contact{font-size:8.5pt;color:#62697a}.resume h2{font-size:10pt;color:#6752a3;letter-spacing:.7pt;text-transform:uppercase;border-bottom:1pt solid #d8d1e8;padding-bottom:3pt;margin-bottom:6pt}`;
const MONO_GRID = `.resume{font:8.5pt/1.4 'SFMono-Regular',Consolas,monospace;color:#191919;padding:.52in .58in}.monogrid-header{border-bottom:2pt solid #111;padding-bottom:8pt;margin-bottom:12pt}.monogrid-header h1{font-size:20pt}.monogrid-header .contact{color:#555;font-size:7.5pt}.resume .monogrid-row{display:grid;grid-template-columns:1.1in 1fr;gap:12pt;margin-top:8pt}.monogrid-row h2{font:700 7pt Consolas,monospace;border:0;padding:0;margin:1pt 0}.monogrid-row>div{border-top:.5pt solid #aaa;padding-top:3pt}`;

const CSS_MAP: Record<TemplateId, string> = {
  jake: JAKE,
  modern: MODERN,
  compact: COMPACT,
  elegant: ELEGANT,
  sidebar: SIDEBAR,
  corporate: CORPORATE,
  tech: TECH,
  minimal: MINIMAL,
  harvard: HARVARD,
  executive: EXECUTIVE,
  creative: CREATIVE,
  terminal: TERMINAL,
  swiss: SWISS,
  scholar: SCHOLAR,
  timeline: TIMELINE,
  mono: MONO,
  atlas: ATLAS,
  editorial: EDITORIAL,
  orbit: ORBIT,
  "mono-grid": MONO_GRID,
};

export function getTemplateCss(template: TemplateId): string {
  return BASE + (CSS_MAP[template] || JAKE);
}

export function wrapResumeDocument(
  bodyHtml: string,
  template: TemplateId,
  title = "Resume"
): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${esc(title)}</title>
  <style>${getTemplateCss(template)}</style>
</head>
<body>
  <article class="resume template-${template}">${bodyHtml}</article>
</body>
</html>`;
}
