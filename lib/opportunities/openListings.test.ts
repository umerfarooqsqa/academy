import { describe, expect, it } from "vitest";
import { filterOpenListings, OPPORTUNITY_MAX_AGE_DAYS, type MatchRow } from "./openListings";

const now = new Date("2026-10-14T12:00:00Z");
const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000);
const zones = [{ name: "Malir", latitude: 24.89, longitude: 67.2, maxKm: 8 }];

function match(over: Partial<MatchRow> & { parentRequestId: string }): MatchRow {
  return {
    status: "approved",
    opportunityCode: `OPP-${Math.floor(Math.random() * 9000) + 1000}`,
    publishedToPageAt: daysAgo(1),
    interestedTutorId: null,
    parentRequest: { status: "matched", subjects: ["Biology"], subjectGroup: "pre_medical", curriculum: "FSc", area: "Malir", deliveryMode: "in_person" },
    ...over,
  };
}

describe("filterOpenListings", () => {
  it("lists one entry per parent request, using the first-published code", () => {
    const listings = filterOpenListings(
      [
        match({ parentRequestId: "p1", opportunityCode: "OPP-2222", publishedToPageAt: daysAgo(1) }),
        match({ parentRequestId: "p1", opportunityCode: "OPP-1111", publishedToPageAt: daysAgo(2) }),
        match({ parentRequestId: "p1", opportunityCode: null, publishedToPageAt: null, status: "awaiting_approval" }),
      ],
      zones,
      now,
    );
    expect(listings).toHaveLength(1);
    expect(listings[0].opportunityCode).toBe("OPP-1111");
    expect(listings[0]).toMatchObject({ area: "Malir", latitude: 24.89, maxKm: 8, deliveryMode: "in_person" });
  });

  it("hides the whole request once any of its matches has an interested tutor", () => {
    const listings = filterOpenListings(
      [match({ parentRequestId: "p1" }), match({ parentRequestId: "p1", interestedTutorId: "t1", publishedToPageAt: null })],
      zones,
      now,
    );
    expect(listings).toEqual([]);
  });

  it(`drops listings published more than ${OPPORTUNITY_MAX_AGE_DAYS} days ago`, () => {
    expect(filterOpenListings([match({ parentRequestId: "p1", publishedToPageAt: daysAgo(15) })], zones, now)).toEqual([]);
    expect(filterOpenListings([match({ parentRequestId: "p1", publishedToPageAt: daysAgo(13) })], zones, now)).toHaveLength(1);
  });

  it("drops non-approved matches and closed requests", () => {
    expect(filterOpenListings([match({ parentRequestId: "p1", status: "rejected" })], zones, now)).toEqual([]);
    expect(filterOpenListings([match({ parentRequestId: "p1", status: "paid" })], zones, now)).toEqual([]);
    const closed = match({ parentRequestId: "p1" });
    closed.parentRequest = { ...closed.parentRequest, status: "closed" };
    expect(filterOpenListings([closed], zones, now)).toEqual([]);
  });

  it("sorts newest first and leaves coordinates undefined for an unknown area", () => {
    const odd = match({ parentRequestId: "p2", publishedToPageAt: daysAgo(0.5) });
    odd.parentRequest = { ...odd.parentRequest, area: "Block 7, near Hassan Square" };
    const listings = filterOpenListings([match({ parentRequestId: "p1", publishedToPageAt: daysAgo(3) }), odd], zones, now);
    expect(listings.map((l) => l.area)).toEqual(["Block 7, near Hassan Square", "Malir"]);
    expect(listings[0].latitude).toBeUndefined();
  });
});
