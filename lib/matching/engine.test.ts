import { describe, it, expect } from "vitest";
import { checkRequestedTutor, runMatchingEngine, type TutorCandidate, type ParentRequestInput, type AreaZoneInput } from "@/lib/matching/engine";

const zones: AreaZoneInput[] = [
  { name: "North Nazimabad", latitude: 24.9342, longitude: 67.0392, maxKm: 10 },
  { name: "Malir", latitude: 24.8916, longitude: 67.2081, maxKm: 10 }, // ~23km from North Nazimabad — outside maxKm
  { name: "Gulshan-e-Iqbal", latitude: 24.9179, longitude: 67.0961, maxKm: 10 }, // ~6km from North Nazimabad — inside maxKm
];

function tutor(overrides: Partial<TutorCandidate>): TutorCandidate {
  return {
    id: "t1",
    subjects: ["Biology", "Chemistry"],
    subjectGroup: "pre_medical",
    area: "North Nazimabad",
    deliveryMode: "in_person",
    availability: ["weekday_evening"],
    expectedFee: 15000,
    rating: 4,
    ratingCount: 5,
    gradesBySubject: { Biology: "A" },
    status: "active",
    tier: "free",
    radiusOverrideKm: null,
    ...overrides,
  };
}

function parent(overrides: Partial<ParentRequestInput>): ParentRequestInput {
  return {
    id: "p1",
    subjects: ["Biology"],
    subjectGroup: "pre_medical",
    area: "North Nazimabad",
    deliveryMode: "in_person",
    budget: 15000,
    availability: ["weekday_evening"],
    ...overrides,
  };
}

describe("runMatchingEngine — Step 1 hard filters (CLAUDE.md 6.3)", () => {
  it("excludes a tutor with no subject overlap", () => {
    const result = runMatchingEngine(parent({}), [tutor({ subjects: ["Physics"] })], zones);
    expect(result).toHaveLength(0);
  });

  it("excludes a tutor with a different subjectGroup even if subjects overlap", () => {
    const result = runMatchingEngine(
      parent({}),
      [tutor({ subjects: ["Biology"], subjectGroup: "pre_engineering" })],
      zones,
    );
    expect(result).toHaveLength(0);
  });

  it("matches when tutor and parent share one of several categories (2026-10-19)", () => {
    const result = runMatchingEngine(
      parent({ subjectGroup: "school", subjectGroups: ["school", "pre_medical"] }),
      [tutor({ subjectGroup: "pre_engineering", subjectGroups: ["pre_engineering", "pre_medical"] })],
      zones,
    );
    expect(result).toHaveLength(1);
  });

  it("excludes a tutor whose categories share none with the parent's", () => {
    const result = runMatchingEngine(
      parent({ subjectGroups: ["pre_medical", "school"] }),
      [tutor({ subjectGroup: "computer", subjectGroups: ["computer", "skills"] })],
      zones,
    );
    expect(result).toHaveLength(0);
  });

  it("excludes an inactive/pending tutor", () => {
    const result = runMatchingEngine(parent({}), [tutor({ status: "pending" })], zones);
    expect(result).toHaveLength(0);
  });

  it("includes a tutor with at least one overlapping subject", () => {
    const result = runMatchingEngine(
      parent({ subjects: ["Biology", "Chemistry"] }),
      [tutor({ subjects: ["Chemistry", "Physics"] })],
      zones,
    );
    expect(result).toHaveLength(1);
    expect(result[0].breakdown.overlappingSubjects).toEqual(["Chemistry"]);
  });
});

describe("runMatchingEngine — Step 2 tiered area matching (the North Nazimabad/Malir fix)", () => {
  it("never returns a tutor from a distant area when a same-area tutor is unavailable and it's outside maxKm", () => {
    // The exact past failure: a North Nazimabad tutor matched to a Malir parent.
    const result = runMatchingEngine(
      parent({ area: "Malir" }),
      [tutor({ area: "North Nazimabad" })],
      zones,
    );
    expect(result).toHaveLength(0);
  });

  it("Tier A: prefers exact-zone tutors and does not fall through to Tier B even if Tier A is small", () => {
    const result = runMatchingEngine(
      parent({ area: "North Nazimabad" }),
      [tutor({ id: "same-zone", area: "North Nazimabad" }), tutor({ id: "nearby", area: "Gulshan-e-Iqbal" })],
      zones,
    );
    expect(result.map((r) => r.tutorId)).toEqual(["same-zone"]);
  });

  it("Tier B: falls back to Haversine radius only when Tier A is empty", () => {
    const result = runMatchingEngine(
      parent({ area: "North Nazimabad" }),
      [tutor({ id: "nearby", area: "Gulshan-e-Iqbal" })],
      zones,
    );
    expect(result.map((r) => r.tutorId)).toEqual(["nearby"]);
    expect(result[0].breakdown.distanceKm).toBeGreaterThan(0);
    expect(result[0].breakdown.distanceKm).toBeLessThan(10);
  });

  it("Tier B excludes tutors beyond maxKm", () => {
    const result = runMatchingEngine(
      parent({ area: "North Nazimabad" }),
      [tutor({ id: "far", area: "Malir" })],
      zones,
    );
    expect(result).toHaveLength(0);
  });

  it("a premium tutor's radiusOverrideKm extends Tier B eligibility beyond the zone default", () => {
    const result = runMatchingEngine(
      parent({ area: "North Nazimabad" }),
      [tutor({ id: "far-premium", area: "Malir", tier: "premium", radiusOverrideKm: 30 })],
      zones,
    );
    expect(result.map((r) => r.tutorId)).toEqual(["far-premium"]);
  });

  it("a free tutor's radiusOverrideKm is ignored even if set (premium-only perk)", () => {
    const result = runMatchingEngine(
      parent({ area: "North Nazimabad" }),
      [tutor({ id: "far-free", area: "Malir", tier: "free", radiusOverrideKm: 30 })],
      zones,
    );
    expect(result).toHaveLength(0);
  });

  it("skips geo-filtering entirely when deliveryMode is online, regardless of area", () => {
    const result = runMatchingEngine(
      parent({ area: "North Nazimabad", deliveryMode: "online" }),
      [tutor({ area: "Malir" })],
      zones,
    );
    expect(result).toHaveLength(1);
    expect(result[0].breakdown.distanceKm).toBeNull();
  });
});

describe("runMatchingEngine — Step 3 budget handling", () => {
  it("excludes budgetFit from scoring and adds internalNote when budget is null", () => {
    const result = runMatchingEngine(parent({ budget: null }), [tutor({})], zones);
    expect(result[0].internalNote).toBe("budget not provided — confirm with parent");
  });

  it("does not hard-reject a low stated budget — it soft-scores lower instead", () => {
    const result = runMatchingEngine(
      parent({ budget: 3000 }),
      [tutor({ expectedFee: 20000 })],
      zones,
    );
    expect(result).toHaveLength(1); // still returned, just scored low on budgetFit
    expect(result[0].breakdown.budgetFit).toBeLessThan(0.5);
  });
});

describe("runMatchingEngine — Step 4 scoring formulas", () => {
  it("budgetFit is 1.0 when expectedFee <= budget", () => {
    const result = runMatchingEngine(parent({ budget: 20000 }), [tutor({ expectedFee: 15000 })], zones);
    expect(result[0].breakdown.budgetFit).toBe(1.0);
  });

  it("budgetFit decays linearly and floors at 0 once fee is 50%+ above budget", () => {
    const result = runMatchingEngine(parent({ budget: 10000 }), [tutor({ expectedFee: 15000 })], zones);
    // 1 - (15000-10000)/(0.5*10000) = 1 - 1 = 0
    expect(result[0].breakdown.budgetFit).toBeCloseTo(0);
  });

  it("budgetFit defaults to 0.5 when the tutor hasn't stated a fee", () => {
    const result = runMatchingEngine(parent({ budget: 10000 }), [tutor({ expectedFee: null })], zones);
    expect(result[0].breakdown.budgetFit).toBe(0.5);
  });

  it("availabilityOverlap defaults to 0.5 when the parent gave no availability", () => {
    const result = runMatchingEngine(parent({ availability: [] }), [tutor({})], zones);
    expect(result[0].breakdown.availabilityOverlap).toBe(0.5);
  });

  it("availabilityOverlap is the overlap fraction over the parent's tags", () => {
    const result = runMatchingEngine(
      parent({ availability: ["weekday_evening", "weekend_morning"] }),
      [tutor({ availability: ["weekday_evening"] })],
      zones,
    );
    expect(result[0].breakdown.availabilityOverlap).toBeCloseTo(0.5);
  });

  it("a ratingCount of 0 scores rating at the neutral default of 3/5, never as the worst option", () => {
    const result = runMatchingEngine(
      parent({}),
      [tutor({ id: "new", rating: 0, ratingCount: 0 }), tutor({ id: "bad", rating: 1, ratingCount: 10 })],
      zones,
    );
    const newT = result.find((r) => r.tutorId === "new")!;
    const badT = result.find((r) => r.tutorId === "bad")!;
    expect(newT.breakdown.rating).toBeCloseTo(3 / 5);
    expect(newT.score).toBeGreaterThan(badT.score);
  });

  it("subjectGradeStrength only considers the overlapping subjects, not the tutor's full list", () => {
    const result = runMatchingEngine(
      parent({ subjects: ["Biology"] }),
      [tutor({ subjects: ["Biology", "Chemistry"], gradesBySubject: { Biology: "A-", Chemistry: "B-" } })],
      zones,
    );
    expect(result[0].breakdown.gradeStrength).toBeCloseTo(0.9); // only Biology (A-), not averaged with Chemistry
  });

  it("subjectGradeStrength defaults to 0.5 for a missing grade entry", () => {
    const result = runMatchingEngine(
      parent({ subjects: ["Biology"] }),
      [tutor({ subjects: ["Biology"], gradesBySubject: null })],
      zones,
    );
    expect(result[0].breakdown.gradeStrength).toBe(0.5);
  });
});

describe("runMatchingEngine — Step 5 top-N", () => {
  it("returns at most TOP_N_CANDIDATES (3), sorted by score descending", () => {
    const tutors = ["a", "b", "c", "d"].map((id, i) =>
      tutor({ id, rating: 5 - i, ratingCount: 5 }),
    );
    const result = runMatchingEngine(parent({}), tutors, zones);
    expect(result).toHaveLength(3);
    const scores = result.map((r) => r.score);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });
});

describe("tutor gender preference (2026-10-15 — strict, unknowns allowed)", () => {
  it("never proposes a tutor of the other recorded gender", () => {
    const result = runMatchingEngine(parent({ tutorGenderPreference: "female" }), [tutor({ gender: "male" })], zones);
    expect(result).toHaveLength(0);
  });

  it("proposes a tutor of the requested gender with no gender note", () => {
    const [r] = runMatchingEngine(parent({ tutorGenderPreference: "female" }), [tutor({ gender: "female" })], zones);
    expect(r.tutorId).toBe("t1");
    expect(r.internalNote ?? "").not.toMatch(/gender/);
  });

  it("lets a tutor with no gender recorded through, with a note to check", () => {
    const [r] = runMatchingEngine(parent({ tutorGenderPreference: "female", budget: null }), [tutor({ gender: null })], zones);
    expect(r.internalNote).toBe("budget not provided — confirm with parent; tutor gender not recorded — parent asked for female");
  });

  it("ignores gender when the parent has no preference", () => {
    expect(runMatchingEngine(parent({ tutorGenderPreference: "any" }), [tutor({ gender: "male" })], zones)).toHaveLength(1);
    expect(runMatchingEngine(parent({}), [tutor({ gender: "male" })], zones)).toHaveLength(1);
  });
});

describe("school category (2026-10-15)", () => {
  it("matches school only with school", () => {
    const p = parent({ subjectGroup: "school", subjects: ["Maths"] });
    expect(runMatchingEngine(p, [tutor({ subjectGroup: "school", subjects: ["Maths"] })], zones)).toHaveLength(1);
    expect(runMatchingEngine(p, [tutor({ subjectGroup: "other", subjects: ["Maths"] })], zones)).toHaveLength(0);
  });
});

describe("checkRequestedTutor — 'Request this tutor' keeps the hard rules", () => {
  it("accepts a same-zone or within-radius tutor", () => {
    expect(checkRequestedTutor(tutor({}), parent({}), zones).eligible).toBe(true);
    expect(checkRequestedTutor(tutor({ area: "Gulshan-e-Iqbal" }), parent({}), zones).eligible).toBe(true);
  });

  it("rejects a tutor across town even though the parent picked them (Section 1)", () => {
    const r = checkRequestedTutor(tutor({ area: "Malir" }), parent({}), zones);
    expect(r).toEqual({ eligible: false, reason: "outside the parent's area" });
  });

  it("allows any area for an online request", () => {
    expect(checkRequestedTutor(tutor({ area: "Malir" }), parent({ deliveryMode: "online" }), zones).eligible).toBe(true);
  });

  it("rejects on category, subject and gender", () => {
    expect(checkRequestedTutor(tutor({ subjectGroup: "computer" }), parent({}), zones)).toMatchObject({ eligible: false });
    expect(checkRequestedTutor(tutor({ subjects: ["Physics"] }), parent({}), zones)).toMatchObject({ eligible: false });
    expect(checkRequestedTutor(tutor({ gender: "male" }), parent({ tutorGenderPreference: "female" }), zones)).toMatchObject({
      eligible: false,
      reason: "gender preference",
    });
  });
});
