import { describe, it, expect } from "vitest";
import { WEIGHTS, renormalize } from "@/lib/matching/weights";

describe("matching weights (CLAUDE.md 6.3 Step 4)", () => {
  it("default weights sum to 1", () => {
    const sum = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1);
  });

  it("matches the constants table: budget=0.2, rating=0.25, distance=0.15, availability=0.15, grade=0.25", () => {
    expect(WEIGHTS.budgetFit).toBeCloseTo(0.2);
    expect(WEIGHTS.rating).toBeCloseTo(0.25);
    expect(WEIGHTS.proximity).toBeCloseTo(0.15);
    expect(WEIGHTS.availability).toBeCloseTo(0.15);
    expect(WEIGHTS.gradeStrength).toBeCloseTo(0.25);
  });

  it("renormalizes to sum 1 when the budget term is dropped (6.3 Step 3)", () => {
    const w = renormalize(["rating", "proximity", "availability", "gradeStrength"]);
    expect(w.budgetFit).toBe(0);
    expect(w.rating + w.proximity + w.availability + w.gradeStrength).toBeCloseTo(1);
  });

  it("renormalizes to sum 1 when proximity is dropped (online deliveryMode, 6.3 Step 2)", () => {
    const w = renormalize(["budgetFit", "rating", "availability", "gradeStrength"]);
    expect(w.proximity).toBe(0);
    expect(w.budgetFit + w.rating + w.availability + w.gradeStrength).toBeCloseTo(1);
  });

  it("keeps rating and gradeStrength the highest soft factors after renormalization", () => {
    const w = renormalize(["rating", "proximity", "availability", "gradeStrength"]);
    expect(w.rating).toBeGreaterThan(w.proximity);
    expect(w.rating).toBeGreaterThan(w.availability);
    expect(w.gradeStrength).toBeGreaterThan(w.proximity);
  });
});
