// Shared plain-text formatting for open opportunities (CLAUDE.md 6.5). Reused by
// the daily Facebook Page digest (POST /api/opportunities/post-facebook-digest)
// and the "Copy" / "Copy all as digest" buttons on the public /opportunities
// page — one formatting function, two destinations, per the spec.

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
  // edge case handled elsewhere). Unused by the digest text formatters below.
  latitude?: number;
  longitude?: number;
}

function groupLabel(g: string): string {
  return SUBJECT_GROUP_LABELS[g as SubjectGroup] ?? g;
}

/** One listing's line, e.g. "Biology (North Nazimabad, FSc Pre-Medical) — Ref: OPP-1234" */
export function formatOpportunityLine(listing: OpportunityListing): string {
  const subjects = listing.subjects.join("/") || "Tutor";
  return `${subjects} (${listing.area}, ${listing.curriculum}) — Ref: ${listing.opportunityCode}`;
}

/** Slightly fuller text for the per-listing "Copy" button — includes the
 * subjectGroup label and the reply instruction (Section 13 self-interest pattern). */
export function formatOpportunityCopyText(listing: OpportunityListing): string {
  const subjects = listing.subjects.join(", ") || "Tutor";
  return (
    `📌 ${subjects} tutor needed — ${listing.area}\n` +
    `${groupLabel(listing.subjectGroup)} · ${listing.curriculum}\n` +
    `Interested? Message us and mention ${listing.opportunityCode}.`
  );
}

/** One post per day, not one per opportunity (6.5) — e.g.
 * "Looking for tutors this week: Biology (North Nazimabad), Computer Science (Gulshan)..." */
export function formatDigestText(listings: OpportunityListing[]): string {
  if (listings.length === 0) return "No open tutoring opportunities right now — check back soon!";
  const items = listings.map((l) => `${l.subjects.join("/") || "Tutor"} (${l.area})`).join(", ");
  return (
    `Looking for tutors this week: ${items}. ` +
    `Interested? Message us with the reference code shown on our opportunities page.`
  );
}

/** "Copy all as digest" — every listing's full detail, one per line. */
export function formatFullDigestText(listings: OpportunityListing[]): string {
  if (listings.length === 0) return "No open tutoring opportunities right now.";
  return listings.map(formatOpportunityCopyText).join("\n\n");
}
