// The picture for one tuition's Facebook Page Story (2026-10-19, operator
// chose full details in the image). A self-contained 1080×1920 HTML page,
// turned into a PNG by Cloudflare Browser Rendering (lib/cloudflare/
// screenshot.ts) — no image library in the Worker. Same public details as the
// Page post (lib/opportunities/formatText.ts): subject, level, area or online,
// school, preferred times and the OPP code — never any parent contact details.
// Icons are inline SVG, not emoji (the headless browser may have no emoji
// font). Facebook's own buttons cover the top and bottom ~250px of a story, so
// the content stays inside the middle. Pure.

import { SUBJECT_GROUP_LABELS, type SubjectGroup } from "@/lib/subjectGroups";
import { TIME_LABELS, tidy, type OpportunityListing } from "@/lib/opportunities/formatText";

export const STORY_WIDTH = 1080;
export const STORY_HEIGHT = 1920;

function esc(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

const ICONS = {
  pin: '<path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
  home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
  laptop: '<rect x="4" y="5" width="16" height="11" rx="1.5"/><path d="M2 19h20"/>',
  school: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2 9 2 12 0v-5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
};

function row(icon: keyof typeof ICONS, text: string): string {
  return `<div class="row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[icon]}</svg><span>${esc(text)}</span></div>`;
}

/** Smaller type for longer subject lists so they still fit on two or three lines. */
function subjectFontSize(text: string): number {
  if (text.length <= 14) return 112;
  if (text.length <= 24) return 96;
  if (text.length <= 40) return 80;
  return 64;
}

export function storyCardHtml(listing: OpportunityListing, opts: { siteName: string; siteUrl: string }): string {
  const subjects = listing.subjects.map(tidy).join(", ") || "Tutor";
  const group = SUBJECT_GROUP_LABELS[listing.subjectGroup as SubjectGroup] ?? "";
  const level = tidy(listing.curriculum) || group;
  const online = listing.deliveryMode === "online";
  const times = (listing.availability ?? []).map((t) => TIME_LABELS[t]).filter(Boolean);
  const rows = [
    online ? row("laptop", "Online tuition") : row("pin", tidy(listing.area)),
    ...(online ? [] : [row(listing.deliveryMode === "both" ? "laptop" : "home", listing.deliveryMode === "both" ? "Home or online tuition" : "Home tuition")]),
    ...(listing.schoolName?.trim() ? [row("school", listing.schoolName.trim())] : []),
    ...(times.length ? [row("clock", times.join(", "))] : []),
  ];
  const host = opts.siteUrl.replace(/^https?:\/\//, "");

  return `<!doctype html>
<html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;600&family=Poppins:wght@600;700&display=block" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:${STORY_WIDTH}px;height:${STORY_HEIGHT}px}
body{font-family:Inter,Arial,sans-serif;color:#0f172a;background:linear-gradient(170deg,#fff1f2 0%,#ffffff 45%,#f0f9ff 100%);display:flex;flex-direction:column;align-items:center;padding:200px 72px 230px}
.logo{height:120px;object-fit:contain}
.card{margin-top:48px;width:100%;flex:1;background:#fff;border-radius:48px;box-shadow:0 20px 60px rgba(15,23,42,.10);border:2px solid #e2e8f0;padding:64px 56px;display:flex;flex-direction:column}
.badge{align-self:flex-start;background:#e11d48;color:#fff;font:700 34px Poppins,Arial,sans-serif;letter-spacing:.08em;padding:16px 34px;border-radius:999px}
h1{font-family:Poppins,Arial,sans-serif;font-weight:700;line-height:1.08;margin-top:36px;word-break:break-word}
.level{margin-top:22px;font:600 44px Poppins,Arial,sans-serif;color:#be123c}
.group{margin-top:8px;font-size:32px;color:#64748b}
.rows{margin:44px 0 48px;display:flex;flex-direction:column;gap:26px}
.row{display:flex;align-items:flex-start;gap:22px;font-size:38px;font-weight:500;line-height:1.25;color:#1e293b}
.row svg{width:48px;height:48px;flex:none;color:#e11d48;margin-top:-2px}
.ref{margin-top:auto;background:#f8fafc;border:2px dashed #cbd5e1;border-radius:28px;padding:30px 36px;text-align:center}
.ref small{display:block;font-size:28px;color:#64748b;font-weight:600;letter-spacing:.06em}
.ref b{display:block;margin-top:6px;font:700 64px Poppins,Arial,sans-serif;letter-spacing:.04em}
.cta{margin-top:44px;text-align:center}
.cta p{font:600 40px Poppins,Arial,sans-serif}
.cta .url{margin-top:10px;font-size:26px;color:#e11d48;font-weight:600;white-space:nowrap}
.cta .note{margin-top:18px;font-size:26px;color:#64748b}
</style></head>
<body>
<img class="logo" src="${esc(opts.siteUrl)}/brand/lili-logo-horizontal.png" alt="${esc(opts.siteName)}">
<div class="card">
  <div class="badge">TUTOR NEEDED</div>
  <h1 style="font-size:${subjectFontSize(subjects)}px">${esc(subjects)}</h1>
  <div class="level">${esc(level)}</div>
  ${group && group !== level ? `<div class="group">${esc(group)}</div>` : ""}
  <div class="rows">${rows.join("")}</div>
  <div class="ref"><small>REFERENCE</small><b>${esc(listing.opportunityCode)}</b></div>
</div>
<div class="cta">
  <p>Interested? Apply on our website</p>
  <div class="url">${esc(host)}/opportunities</div>
  <div class="note">Students' contact details are never shared publicly.</div>
</div>
</body></html>`;
}
