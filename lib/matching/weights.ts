// Soft-scoring weights for the matching engine (CLAUDE.md 6.3, Step 4).
//
//   score = w1*budgetFit + w2*(tutor.rating/5) + w3*(1/(1+geoDistanceKm))
//         + w4*availabilityOverlap + w5*subjectGradeStrength
//
// subjectGradeStrength (w5) and rating (w2) are weighted highest since
// subject-specific academic strength (6.1 step 9) and tutor quality are the
// primary differentiators (operator decision).
//
// These are deliberately tunable constants — change them here only, and only with
// operator sign-off (Section 2 decision protocol covers matching weights explicitly).

export const WEIGHTS = {
  budgetFit: 0.2, // w1
  rating: 0.25, // w2
  proximity: 0.15, // w3
  availability: 0.15, // w4
  gradeStrength: 0.25, // w5
} as const;

export type WeightKey = keyof typeof WEIGHTS;

// When a term is inactive for a given match (e.g. parent gave no budget — 6.3 Step 3,
// or deliveryMode is "online" so proximity doesn't apply — 6.3 Step 2/6.5), drop it
// and renormalise the remaining weights so they sum to 1.
export function renormalize(activeKeys: WeightKey[]): Record<WeightKey, number> {
  const total = activeKeys.reduce((sum, k) => sum + WEIGHTS[k], 0);
  const out = {} as Record<WeightKey, number>;
  for (const k of Object.keys(WEIGHTS) as WeightKey[]) {
    out[k] = activeKeys.includes(k) ? WEIGHTS[k] / total : 0;
  }
  return out;
}

// Neutral defaults, per the general rule in 6.3 Step 4 ("an unstated field is not
// evidence of a mismatch"). Rating uses out-of-5 raw units; others are 0-1 scores.
export const NEUTRAL_RATING = 3; // Tutor.ratingCount === 0 (6.8 step 4)
export const NEUTRAL_SCORE = 0.5; // budgetFit / availabilityOverlap / gradeStrength when unset

// Number of candidates returned per matching run (6.3 Step 5).
export const TOP_N_CANDIDATES = 3;
