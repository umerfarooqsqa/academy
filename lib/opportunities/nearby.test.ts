import { describe, expect, it } from "vitest";
import { nearbyStatus } from "./nearby";
import type { OpportunityListing } from "./formatText";

const gulshan: OpportunityListing = {
  opportunityCode: "OPP-1234",
  subjects: ["Physics"],
  subjectGroup: "pre_engineering",
  curriculum: "A-levels",
  area: "Gulshan-e-Iqbal",
  latitude: 24.9204,
  longitude: 67.0971,
  maxKm: 6,
  deliveryMode: "in_person",
  publishedAt: "2026-10-14T10:00:00.000Z",
};

describe("nearbyStatus", () => {
  it("is near within the zone's own maxKm, with the distance", () => {
    const r = nearbyStatus(gulshan, 24.93, 67.1);
    expect(r.near).toBe(true);
    expect(r.distanceKm).toBeLessThan(2);
  });

  it("is not near beyond maxKm", () => {
    const lahore = nearbyStatus(gulshan, 31.52, 74.36);
    expect(lahore.near).toBe(false);
    expect(lahore.distanceKm).toBeGreaterThan(900);
  });

  it("treats online-only requests as near everyone, with no distance", () => {
    expect(nearbyStatus({ ...gulshan, deliveryMode: "online" }, 31.52, 74.36)).toEqual({ near: true, distanceKm: undefined });
  });

  it("treats in-person-or-online requests as near, still showing the distance", () => {
    const r = nearbyStatus({ ...gulshan, deliveryMode: "both" }, 31.52, 74.36);
    expect(r.near).toBe(true);
    expect(r.distanceKm).toBeGreaterThan(900);
  });

  it("is not near when the area has no zone coordinates", () => {
    expect(nearbyStatus({ ...gulshan, latitude: undefined, longitude: undefined, maxKm: undefined }, 24.93, 67.1)).toEqual({ near: false });
  });
});
