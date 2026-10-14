// Which published matches count as an open opportunity, as a pure function
// over already-fetched rows (lib/opportunities/digest.ts does the query) so
// it's unit-testable. 2026-10-14 fix — before this, rejected/paid/closed
// requests stayed listed forever and one parent request showed up to 3
// times (one per candidate Match).
//
// A parent request is listed once, while ALL of these hold:
//   - its ParentRequest isn't closed
//   - no Match of that request has a tutor's confirmed interest yet
//   - at least one of its Matches is approved, has a code, and was published
//     within the last OPPORTUNITY_MAX_AGE_DAYS (operator decision: 14)
// The listing uses the first-published such Match's code.

import type { OpportunityListing } from "@/lib/opportunities/formatText";

export const OPPORTUNITY_MAX_AGE_DAYS = 14;

export interface MatchRow {
  parentRequestId: string;
  status: string;
  opportunityCode: string | null;
  publishedToPageAt: Date | null;
  interestedTutorId: string | null;
  parentRequest: {
    status: string;
    subjects: string[];
    subjectGroup: string;
    curriculum: string;
    area: string;
    deliveryMode: string;
  };
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

/** `matches` must include every Match of each parent request involved (not
 * just the published ones), so a sibling's confirmed interest is seen. */
export function filterOpenListings(matches: MatchRow[], zones: ZoneRow[], now: Date = new Date()): OpportunityListing[] {
  const cutoff = openListingCutoff(now);
  const zoneByName = new Map(zones.map((z) => [z.name.toLowerCase(), z]));

  const byRequest = new Map<string, MatchRow[]>();
  for (const m of matches) byRequest.set(m.parentRequestId, [...(byRequest.get(m.parentRequestId) ?? []), m]);

  const listings: OpportunityListing[] = [];
  for (const group of byRequest.values()) {
    if (group.some((m) => m.interestedTutorId)) continue;
    const pr = group[0].parentRequest;
    if (pr.status === "closed") continue;

    const live = group
      .filter((m) => m.status === "approved" && m.opportunityCode && m.publishedToPageAt && m.publishedToPageAt >= cutoff)
      .sort((a, b) => a.publishedToPageAt!.getTime() - b.publishedToPageAt!.getTime());
    const first = live[0];
    if (!first) continue;

    const zone = zoneByName.get(pr.area.toLowerCase());
    listings.push({
      opportunityCode: first.opportunityCode!,
      subjects: pr.subjects,
      subjectGroup: pr.subjectGroup,
      curriculum: pr.curriculum,
      area: pr.area,
      latitude: zone?.latitude,
      longitude: zone?.longitude,
      maxKm: zone?.maxKm,
      deliveryMode: pr.deliveryMode,
      publishedAt: first.publishedToPageAt!.toISOString(),
    });
  }

  return listings.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}
