import { describe, it, expect } from "vitest";
import { computeTutorDensity, type AreaZoneRow, type TutorDensityInput } from "@/lib/analytics/tutorDensity";

const zones: AreaZoneRow[] = [
  { name: "North Nazimabad", latitude: 24.9342, longitude: 67.0392 },
  { name: "Gulshan-e-Iqbal", latitude: 24.9179, longitude: 67.0961 },
];

describe("computeTutorDensity (CLAUDE.md 6.11)", () => {
  it("counts only active tutors, grouped by zone", () => {
    const tutors: TutorDensityInput[] = [
      { status: "active", area: "North Nazimabad", subjectGroup: "pre_medical", tier: "free" },
      { status: "active", area: "North Nazimabad", subjectGroup: "computer", tier: "premium" },
      { status: "pending", area: "North Nazimabad", subjectGroup: "computer", tier: "free" },
    ];
    const result = computeTutorDensity(zones, tutors);
    expect(result.find((r) => r.zone === "North Nazimabad")?.tutorCount).toBe(2);
    expect(result.find((r) => r.zone === "Gulshan-e-Iqbal")?.tutorCount).toBe(0);
  });

  it("returns a zero-count row for a zone with no tutors, rather than omitting it", () => {
    const result = computeTutorDensity(zones, []);
    expect(result).toHaveLength(2);
    expect(result.every((r) => r.tutorCount === 0)).toBe(true);
  });

  it("filters by subjectGroup", () => {
    const tutors: TutorDensityInput[] = [
      { status: "active", area: "North Nazimabad", subjectGroup: "computer", tier: "free" },
      { status: "active", area: "North Nazimabad", subjectGroup: "pre_medical", tier: "free" },
    ];
    const result = computeTutorDensity(zones, tutors, { subjectGroup: "computer" });
    expect(result.find((r) => r.zone === "North Nazimabad")?.tutorCount).toBe(1);
  });

  it("filters by tier", () => {
    const tutors: TutorDensityInput[] = [
      { status: "active", area: "North Nazimabad", subjectGroup: "computer", tier: "premium" },
      { status: "active", area: "North Nazimabad", subjectGroup: "pre_medical", tier: "free" },
    ];
    const result = computeTutorDensity(zones, tutors, { tier: "premium" });
    expect(result.find((r) => r.zone === "North Nazimabad")?.tutorCount).toBe(1);
  });

  it("plots at the zone centroid, not per-tutor coordinates (privacy)", () => {
    const result = computeTutorDensity(zones, []);
    expect(result[0].latitude).toBe(zones[0].latitude);
    expect(result[0].longitude).toBe(zones[0].longitude);
  });
});
