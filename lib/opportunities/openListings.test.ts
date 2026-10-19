import { describe, expect, it } from "vitest";
import { filterOpenListings, isOpenRequest, OPPORTUNITY_MAX_AGE_DAYS, type RequestRow } from "./openListings";

const now = new Date("2026-10-15T12:00:00Z");
const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000);
const zones = [{ name: "Malir", latitude: 24.89, longitude: 67.2, maxKm: 8 }];

function req(over: Partial<RequestRow> = {}): RequestRow {
  return {
    id: "p1",
    status: "pending",
    opportunityCode: "OPP-1234",
    publicHiddenAt: null,
    createdAt: daysAgo(1),
    subjects: ["Biology"],
    subjectGroup: "pre_medical",
    curriculum: "FSc",
    area: "Malir",
    deliveryMode: "in_person",
    matches: [],
    ...over,
  };
}

describe("isOpenRequest (2026-10-15: every open request is public)", () => {
  it("lists a fresh request even with no matches at all", () => {
    expect(isOpenRequest(req(), now)).toBe(true);
  });

  it("still lists a request whose matches are only proposed, approved or rejected", () => {
    const matches = [
      { status: "awaiting_approval", interestedTutorId: null },
      { status: "approved", interestedTutorId: null },
      { status: "rejected", interestedTutorId: null },
    ];
    expect(isOpenRequest(req({ matches }), now)).toBe(true);
  });

  it("hides closed, hidden and code-less requests", () => {
    expect(isOpenRequest(req({ status: "closed" }), now)).toBe(false);
    expect(isOpenRequest(req({ publicHiddenAt: daysAgo(0) }), now)).toBe(false);
    expect(isOpenRequest(req({ opportunityCode: null }), now)).toBe(false);
  });

  it(`drops requests older than ${OPPORTUNITY_MAX_AGE_DAYS} days`, () => {
    expect(isOpenRequest(req({ createdAt: daysAgo(15) }), now)).toBe(false);
    expect(isOpenRequest(req({ createdAt: daysAgo(13) }), now)).toBe(true);
  });

  it("hides a request once a tutor said I'm interested or was placed", () => {
    expect(isOpenRequest(req({ matches: [{ status: "awaiting_approval", interestedTutorId: "t1" }] }), now)).toBe(false);
    for (const status of ["selected", "demo_scheduled", "paid", "completed"]) {
      expect(isOpenRequest(req({ matches: [{ status, interestedTutorId: null }] }), now)).toBe(false);
    }
  });
});

describe("unmatched and rejected matches (2026-10-15)", () => {
  it("re-opens a request whose interested or placed tutor was unmatched or rejected", () => {
    expect(isOpenRequest(req({ matches: [{ status: "unmatched", interestedTutorId: "t1" }] }), now)).toBe(true);
    expect(isOpenRequest(req({ matches: [{ status: "rejected", interestedTutorId: "t1" }] }), now)).toBe(true);
  });

  it("stays hidden while another tutor is still interested or placed", () => {
    const matches = [
      { status: "unmatched", interestedTutorId: "t1" },
      { status: "demo_scheduled", interestedTutorId: null },
    ];
    expect(isOpenRequest(req({ matches }), now)).toBe(false);
  });
});

describe("filterOpenListings", () => {
  it("returns public fields only, with zone centroid and the request date, newest first", () => {
    const listings = filterOpenListings(
      [req({ id: "a", opportunityCode: "OPP-1111", createdAt: daysAgo(3) }), req({ id: "b", opportunityCode: "OPP-2222", createdAt: daysAgo(1) })],
      zones,
      now,
    );
    expect(listings.map((l) => l.opportunityCode)).toEqual(["OPP-2222", "OPP-1111"]);
    expect(listings[0]).toEqual({
      opportunityCode: "OPP-2222",
      subjects: ["Biology"],
      subjectGroup: "pre_medical",
      subjectGroups: ["pre_medical"],
      curriculum: "FSc",
      schoolName: null,
      area: "Malir",
      latitude: 24.89,
      longitude: 67.2,
      maxKm: 8,
      deliveryMode: "in_person",
      publishedAt: daysAgo(1).toISOString(),
      availability: [],
    });
  });

  it("leaves coordinates undefined for an area that isn't a zone", () => {
    const [l] = filterOpenListings([req({ area: "near Hassan Square" })], zones, now);
    expect(l.latitude).toBeUndefined();
  });
});
