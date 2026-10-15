// Which parent requests count as an open public opportunity, as a pure
// function over already-fetched rows (lib/opportunities/digest.ts does the
// query) so it's unit-testable.
//
// 2026-10-15 operator decision: EVERY request is a public opportunity right
// away (on /opportunities, and posted to the Facebook Page) — it no longer
// waits for matching to find a tutor and for the operator to approve the
// match. A request is listed while ALL of these hold:
//   - it isn't closed (a declined Matric request is closed at intake)
//   - the operator hasn't hidden it ("Hide from public" on /parents/[id])
//   - it has its public OPP code
//   - it came in within the last OPPORTUNITY_MAX_AGE_DAYS (14)
//   - no tutor has said "I'm interested" in it yet, and no tutor has been
//     placed with it (a match selected / demo scheduled / paid / completed)
//     — ignoring matches that were rejected or unmatched

import type { OpportunityListing } from "@/lib/opportunities/formatText";

export const OPPORTUNITY_MAX_AGE_DAYS = 14;

/** Match statuses meaning a tutor is already placed with the request. */
export const PLACED_STATUSES = ["selected", "demo_scheduled", "paid", "completed"];

/** Matches that no longer count: rejected by the operator, or unmatched
 * because the tutor declined / the demo failed (2026-10-15) — such a request
 * is open again. */
export const ENDED_STATUSES = ["rejected", "unmatched"];

export interface RequestRow {
  id: string;
  status: string;
  opportunityCode: string | null;
  publicHiddenAt: Date | null;
  createdAt: Date;
  subjects: string[];
  subjectGroup: string;
  curriculum: string;
  area: string;
  deliveryMode: string;
  matches: { status: string; interestedTutorId: string | null }[];
}

export interface ZoneRow {
  name: string;
  latitude: number;
  longitude: number;
  maxKm: number;
}

export function openListingCutoff(now: Date): Date {
  return new Date(now.getTime() - OPPORTUNITY_MAX_AGE_DAYS * 24 * 60 * 60 * 1000);
}

export function isOpenRequest(r: RequestRow, now: Date = new Date()): boolean {
  return (
    r.status !== "closed" &&
    !r.publicHiddenAt &&
    !!r.opportunityCode &&
    r.createdAt >= openListingCutoff(now) &&
    !r.matches.some((m) => !ENDED_STATUSES.includes(m.status) && (m.interestedTutorId || PLACED_STATUSES.includes(m.status)))
  );
}

/** Public fields only — never the parent's number, name, budget, notes or own coordinates. */
export function toListing(r: RequestRow, zones: ZoneRow[]): OpportunityListing {
  const zone = zones.find((z) => z.name.toLowerCase() === r.area.toLowerCase());
  return {
    opportunityCode: r.opportunityCode!,
    subjects: r.subjects,
    subjectGroup: r.subjectGroup,
    curriculum: r.curriculum,
    area: r.area,
    latitude: zone?.latitude,
    longitude: zone?.longitude,
    maxKm: zone?.maxKm,
    deliveryMode: r.deliveryMode,
    publishedAt: r.createdAt.toISOString(),
  };
}

export function filterOpenListings(rows: RequestRow[], zones: ZoneRow[], now: Date = new Date()): OpportunityListing[] {
  return rows
    .filter((r) => isOpenRequest(r, now))
    .map((r) => toListing(r, zones))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}
