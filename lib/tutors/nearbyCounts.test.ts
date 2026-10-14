import { describe, expect, it } from "vitest";
import { countVerifiedByZone, verifiedNear } from "./nearbyCounts";

const zones = [
  { name: "Gulshan-e-Iqbal", latitude: 24.9204, longitude: 67.0971, maxKm: 6 },
  { name: "PECHS", latitude: 24.8709, longitude: 67.0611, maxKm: 6 },
  { name: "Malir", latitude: 24.8936, longitude: 67.2075, maxKm: 8 },
];
const tutors = [
  { area: "Gulshan-e-Iqbal", subjectGroup: "pre_medical" },
  { area: "Gulshan-e-Iqbal", subjectGroup: "pre_medical" },
  { area: "gulshan-e-iqbal", subjectGroup: "computer" },
  { area: "PECHS", subjectGroup: "pre_medical" },
  { area: "Malir", subjectGroup: "computer" },
  { area: "Block 7, near Hassan Square", subjectGroup: "computer" },
];

describe("countVerifiedByZone", () => {
  it("counts per zone (case-insensitive) and per category, ignoring areas that aren't zones", () => {
    const counts = countVerifiedByZone(zones, tutors);
    expect(counts.find((z) => z.name === "Gulshan-e-Iqbal")).toMatchObject({ verified: 3, bySubjectGroup: { pre_medical: 2, computer: 1 } });
    expect(counts.reduce((n, z) => n + z.verified, 0)).toBe(5);
  });
});

describe("verifiedNear", () => {
  const counts = countVerifiedByZone(zones, tutors);

  it("sums only zones within their own maxKm of the point", () => {
    // In Gulshan: Gulshan (~1 km) is in range; PECHS is ~6.5 km away (> 6); Malir ~11 km (> 8).
    const r = verifiedNear(counts, 24.925, 67.1);
    expect(r).toMatchObject({ total: 3, nearestZone: "Gulshan-e-Iqbal", bySubjectGroup: { pre_medical: 2, computer: 1 } });
  });

  it("filters the total by category when given", () => {
    expect(verifiedNear(counts, 24.925, 67.1, "computer").total).toBe(1);
  });

  it("is zero far from every zone, but still names the nearest zone", () => {
    expect(verifiedNear(counts, 31.52, 74.36)).toMatchObject({ total: 0, nearestZone: expect.any(String) });
  });

  it("handles no zones", () => {
    expect(verifiedNear([], 24.9, 67.1)).toEqual({ total: 0, nearestZone: null, bySubjectGroup: {} });
  });
});
