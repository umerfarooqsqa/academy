// Shared plain-text formatting for open opportunities (CLAUDE.md 6.5): the
// Facebook Page post (POST /api/opportunities/post-facebook-digest, every 3
// hours) and the per-listing "Share" button on the public /opportunities page.

import { SUBJECT_GROUP_LABELS, type SubjectGroup } from "@/lib/subjectGroups";

export interface OpportunityListing {
  opportunityCode: string;
  subjects: string[];
  subjectGroup: string;
  curriculum: string;
  /** The student's school (2026-10-17 — operator chose to show it publicly). */
  schoolName?: string | null;
  area: string;
  // Resolved from AreaZone by area name (2026-10-13 feature: tutors can see
  // live distance from their own location) — undefined if the area string
  // doesn't match any configured AreaZone (same "area not in zone table"
  // edge case handled elsewhere). Always the zone centroid, never the
  // parent's own shared coordinate (privacy). Unused by the digest text
  // formatters below.
  latitude?: number;
  longitude?: number;
  /** The zone's own Tier B radius (AreaZone.maxKm) — what "near" means for
   * this listing (lib/opportunities/nearby.ts). */
  maxKm?: number;
  /** ParentRequest.deliveryMode: "in_person" | "online" | "both". */
  deliveryMode: string;
  /** ISO timestamp the listing was published (Match.publishedToPageAt). */
  publishedAt: string;
  /** Preferred times from the fixed tag set (6.2), e.g. "weekday_evening" — not contact info. */
  availability?: string[];
}

export function groupLabel(g: string): string {
  return SUBJECT_GROUP_LABELS[g as SubjectGroup] ?? g;
}

/** One listing's line, e.g. "Biology (North Nazimabad, FSc Pre-Medical) — Ref: OPP-1234" */
export function formatOpportunityLine(listing: OpportunityListing): string {
  const subjects = listing.subjects.join("/") || "Tutor";
  return `${subjects} (${listing.area}, ${listing.curriculum}) — Ref: ${listing.opportunityCode}`;
}

/** Slightly fuller text for the per-listing "Share" button (pasted into
 * WhatsApp groups by the operator, 6.5) — includes the subjectGroup label and
 * where to say "I'm interested": the /opportunities page, by code (2026-10-14
 * on-site interest flow). `opportunitiesUrl` is the absolute page URL — the
 * browser passes its own origin, since pasted text needs a full link. */
export function formatOpportunityCopyText(listing: OpportunityListing, opportunitiesUrl?: string): string {
  const subjects = listing.subjects.join(", ") || "Tutor";
  const where = listing.deliveryMode === "online" ? "Online" : listing.area;
  const action = opportunitiesUrl
    ? `Interested? Tap "I'm interested" on ${listing.opportunityCode} at ${opportunitiesUrl}`
    : `Interested? Tap "I'm interested" on ${listing.opportunityCode} on our Opportunities page.`;
  const school = listing.schoolName ? ` · ${listing.schoolName}` : "";
  return `📌 ${subjects} tutor needed — ${where}\n${groupLabel(listing.subjectGroup)} · ${listing.curriculum}${school}\n${action}`;
}

export const TIME_LABELS: Record<string, string> = {
  weekday_morning: "Weekday mornings",
  weekday_afternoon: "Weekday afternoons",
  weekday_evening: "Weekday evenings",
  weekend_morning: "Weekend mornings",
  weekend_afternoon: "Weekend afternoons",
  weekend_evening: "Weekend evenings",
};

const NUMBER_EMOJI = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

/** "urdu" → "Urdu", "class 5" → "Class 5"; leaves deliberately-cased words
 * ("A-levels", "FSc", "BS") alone. */
export function tidy(text: string): string {
  return text
    .trim()
    .split(/\s+/)
    .map((w) => (w === w.toLowerCase() ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function hashtag(text: string): string {
  return "#" + tidy(text).replace(/[^A-Za-z0-9]/g, "");
}

/** The Facebook Page post for newly opened tuitions (2026-10-15: posted every
 * 3 hours, each tuition once; layout improved the same day at the operator's
 * request). Subject, level, area, home/online, preferred times and the
 * reference code only — never any parent contact details. `siteUrl` is the
 * absolute site address, for the "apply" and "register" links. e.g.
 *
 *   📢 Tutor needed — home tuition in Karachi
 *
 *   📘 Urdu — Class 5
 *   📍 Nazimabad · 🏠 Home tuition
 *   🕒 Weekday evenings
 *   🔖 Ref: OPP-1246
 *
 *   ✅ Interested? Apply in one tap: https://…/opportunities
 *   🆕 New tutor? Register in 3 minutes: https://…/become-a-tutor
 *   🔒 Students' contact details are never shared publicly.
 *
 *   #KarachiTutors #HomeTuition #TutorJobs #Nazimabad */
export function formatTuitionsPost(listings: OpportunityListing[], siteUrl: string): string {
  const single = listings.length === 1;
  const blocks = listings.map((l, i) => {
    const subjects = l.subjects.map(tidy).join(", ") || "Tutor";
    const level = tidy(l.curriculum) || groupLabel(l.subjectGroup);
    const mode =
      l.deliveryMode === "online" ? "💻 Online" : l.deliveryMode === "both" ? "🏠 Home or 💻 online" : "🏠 Home tuition";
    const where = l.deliveryMode === "online" ? mode : `📍 ${tidy(l.area)} · ${mode}`;
    const times = (l.availability ?? []).map((t) => TIME_LABELS[t]).filter(Boolean);
    const title = single ? `📘 ${subjects} — ${level}` : `${NUMBER_EMOJI[i] ?? "▪️"} ${subjects} — ${level}`;
    const indent = single ? "" : "     ";
    return [
      title,
      ...(l.schoolName ? [`${indent}🏫 ${l.schoolName.trim()}`] : []),
      `${indent}${where}`,
      ...(times.length ? [`${indent}🕒 ${times.join(", ")}`] : []),
      `${indent}🔖 Ref: ${l.opportunityCode}`,
    ].join("\n");
  });

  const areas = [...new Set(listings.filter((l) => l.deliveryMode !== "online").map((l) => hashtag(l.area)))];
  const tags = ["#KarachiTutors", "#HomeTuition", "#TutorJobs", ...areas].slice(0, 8);

  const anyOnline = listings.some((l) => l.deliveryMode === "online");
  const allOnline = listings.every((l) => l.deliveryMode === "online");
  const kind = allOnline ? "online tuition" : anyOnline ? "Karachi & online" : "home tuition in Karachi";
  return [
    single ? `📢 Tutor needed — ${kind}` : `📢 ${listings.length} tutors needed — ${kind}`,
    "",
    blocks.join("\n\n"),
    "",
    `✅ Interested? Apply in one tap: ${siteUrl}/opportunities`,
    `🆕 New tutor? Register in 3 minutes: ${siteUrl}/become-a-tutor`,
    "🔒 Students' contact details are never shared publicly.",
    "",
    tags.join(" "),
  ].join("\n");
}
