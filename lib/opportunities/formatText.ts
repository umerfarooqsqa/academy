// Shared plain-text formatting for open opportunities (CLAUDE.md 6.5): the
// Facebook Page post (POST /api/opportunities/post-facebook-digest, every 3
// hours) and the per-listing "Share" button on the public /opportunities page.

import { SUBJECT_GROUP_LABELS, type SubjectGroup } from "@/lib/subjectGroups";

export interface OpportunityListing {
  opportunityCode: string;
  subjects: string[];
  subjectGroup: string;
  curriculum: string;
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
}

function groupLabel(g: string): string {
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
  return `📌 ${subjects} tutor needed — ${where}\n${groupLabel(listing.subjectGroup)} · ${listing.curriculum}\n${action}`;
}

/** The Facebook Page post for newly opened tuitions (2026-10-15: posted every
 * 3 hours, each tuition once). Subject, level and area only — never any
 * parent contact details. `opportunitiesUrl` (absolute) lets readers tap
 * straight through to "I'm interested". e.g.
 *   📚 New tuitions — tutors needed
 *   • Chemistry (O level) — North Nazimabad
 *   • Physics (A-levels) — Online */
export function formatTuitionsPost(listings: OpportunityListing[], opportunitiesUrl: string): string {
  const lines = listings.map((l) => {
    const subjects = l.subjects.join(", ") || "Tutor";
    const level = l.curriculum.trim() || groupLabel(l.subjectGroup);
    const where = l.deliveryMode === "online" ? "Online" : l.area;
    return `• ${subjects} (${level}) — ${where}`;
  });
  return [
    listings.length === 1 ? "📚 New tuition — tutor needed" : "📚 New tuitions — tutors needed",
    "",
    ...lines,
    "",
    `Interested? Tap "I'm interested" here: ${opportunitiesUrl}`,
    "Students' contact details are never shared publicly.",
  ].join("\n");
}
