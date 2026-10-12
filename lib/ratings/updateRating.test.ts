import { describe, it, expect } from "vitest";
import { nextRatingAverage } from "@/lib/ratings/updateRating";

describe("nextRatingAverage (CLAUDE.md 6.8 step 2)", () => {
  it("sets the average to the single rating for a tutor's first rating", () => {
    expect(nextRatingAverage(0, 0, 4)).toEqual({ rating: 4, ratingCount: 1 });
  });

  it("computes the running average correctly for a subsequent rating", () => {
    // avg 4 over 2 ratings, add a 5 -> (4*2+5)/3
    const { rating, ratingCount } = nextRatingAverage(4, 2, 5);
    expect(rating).toBeCloseTo(13 / 3);
    expect(ratingCount).toBe(3);
  });
});
