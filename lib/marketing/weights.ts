// Deterministic, explainable weighted-scoring formula for marketing budget
// recommendation — NOT machine learning (CLAUDE.md Section 3/12 explicitly rules
// out any trained model for this kind of decision). Same philosophy as
// lib/matching/weights.ts: named tunable constants, documented reasoning,
// neutral defaults for missing history, every component shown in the UI —
// never a black box.
//
//   score(row) = W.supplyGap      * supplyGapScore
//              + W.costEfficiency * costEfficiencyScore
//              + W.profitability  * profitabilityScore
//              + W.conversionRate * conversionRateScore
//
// All four components are min-max normalized to [0,1] across the current batch
// of *eligible* (area, subjectGroup) rows before weighting — scale-independent
// of absolute PKR amounts or lead volume.

export const BUDGET_WEIGHTS = {
  supplyGap: 0.25, // reward combos with tutor capacity to spare relative to existing
  // demand — directly implements CLAUDE.md 6.11's stated purpose ("a zone with
  // strong tutor supply but few matched parent requests is a direct signal
  // [for where to point acquisition spend]").
  costEfficiency: 0.25, // reward combos that have historically produced cheap leads.
  profitability: 0.3, // primary bottom-line signal, weighted highest — mirrors
  // lib/matching/weights.ts's own top-weighting of its "primary differentiator" terms.
  conversionRate: 0.2, // reward combos where leads actually convert, not just leads
  // that happened to be cheap.
} as const; // sums to 1.0

export type BudgetWeightKey = keyof typeof BUDGET_WEIGHTS;

// Neutral default for any score component a row has no history to compute
// (e.g. zero leads ever in this combo) — never 0, never 1 (same general rule as
// lib/matching/weights.ts's NEUTRAL_SCORE). Does NOT apply to tutorCount === 0,
// which is real, stated data (zero tutors), not a missing/unknown value.
export const BUDGET_NEUTRAL_SCORE = 0.5;

// Hard filter, not soft-scored — the budget-allocation analogue of CLAUDE.md
// 6.3's "hard filters before soft scoring": a combo with zero active tutors
// gets zero allocation outright, since there's no capacity to serve any
// resulting lead.
export const MIN_TUTORS_FOR_ELIGIBILITY = 1;

// Platform recommendation fallback order, fully transparent (no black box):
//  1. Highest historical profitPerConversion for this exact (area, subjectGroup,
//     platform) — real, local data.
//  2. If this combo has no conversion history yet: highest historical
//     profitPerConversion for that platform system-wide (all areas/subjectGroups).
//  3. If there is no conversion history anywhere yet (cold start):
//     DEFAULT_FALLBACK_PLATFORM — Meta ads (Facebook) is the only paid channel
//     this business already has live creative/infra for (CLAUDE.md Section 1,
//     6.5), so it's the safer default than guessing cold at TikTok/YouTube.
export const DEFAULT_FALLBACK_PLATFORM = "facebook";
