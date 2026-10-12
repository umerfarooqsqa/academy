// Budget allocation recommendation (CLAUDE.md Section 3/12 — deterministic
// code, never a trained model). Pure function over lib/marketing/balanceSheet.ts
// rows — no Prisma access here.

import type { BalanceSheetRow } from "@/lib/marketing/balanceSheet";
import {
  BUDGET_WEIGHTS,
  BUDGET_NEUTRAL_SCORE,
  MIN_TUTORS_FOR_ELIGIBILITY,
  DEFAULT_FALLBACK_PLATFORM,
} from "@/lib/marketing/weights";

export interface BudgetAllocationRow {
  area: string;
  subjectGroup: string;
  score: number; // composite 0-1, 0 for excluded rows
  scoreBreakdown: {
    supplyGap: number;
    costEfficiency: number;
    profitability: number;
    conversionRate: number;
  };
  recommendedAmount: number; // PKR, integer — sums exactly to totalBudget across all eligible rows
  recommendedPlatform: string | null;
  platformRationale: string;
  excludedReason: string | null;
}

const UNATTRIBUTED_AREA = "Unattributed";
const UNSPECIFIED_SUBJECT_GROUP = "unspecified";
const UNSPECIFIED_PLATFORM = "unspecified";

function safeDiv(a: number, b: number): number | null {
  return b > 0 ? a / b : null;
}

/** Min-max normalizes a list of (possibly null) raw values to [0,1]. A null raw
 * value gets BUDGET_NEUTRAL_SCORE (no history to judge it by). When every
 * non-null value is identical (no variance to rank by), all of them also get
 * BUDGET_NEUTRAL_SCORE — there's nothing informative to distinguish them. */
function normalize(raw: Array<number | null>): number[] {
  const values = raw.filter((v): v is number => v != null);
  if (values.length === 0) return raw.map(() => BUDGET_NEUTRAL_SCORE);
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return raw.map(() => BUDGET_NEUTRAL_SCORE);
  return raw.map((v) => (v == null ? BUDGET_NEUTRAL_SCORE : (v - min) / (max - min)));
}

/** Largest-remainder rounding: splits `total` across `shares` (proportions
 * that should sum to ~1) as integers that sum EXACTLY to `total`. */
function allocateExact(total: number, shares: number[]): number[] {
  const raw = shares.map((s) => total * s);
  const floors = raw.map(Math.floor);
  let remaining = total - floors.reduce((a, b) => a + b, 0);
  const remainders = raw.map((v, i) => ({ i, frac: v - floors[i] }));
  remainders.sort((a, b) => b.frac - a.frac);
  const result = [...floors];
  for (let k = 0; k < remainders.length && remaining > 0; k++, remaining--) {
    result[remainders[k].i] += 1;
  }
  return result;
}

/** Best platform for one row: highest local profitPerConversion, excluding the
 * "unspecified" bucket (not an actionable recommendation). */
function bestLocalPlatform(row: BalanceSheetRow): { platform: string; profitPerConversion: number } | null {
  const candidates = row.platformBreakdown.filter(
    (p) => p.platform !== UNSPECIFIED_PLATFORM && p.profitPerConversion != null,
  );
  if (candidates.length === 0) return null;
  return candidates.reduce((best, p) =>
    p.profitPerConversion! > best.profitPerConversion ? { platform: p.platform, profitPerConversion: p.profitPerConversion! } : best,
    { platform: candidates[0].platform, profitPerConversion: candidates[0].profitPerConversion! },
  );
}

/** System-wide profit-per-conversion per platform, aggregated across every row
 * (not just eligible ones) — totals-based, not an average-of-ratios, so a
 * platform with one huge win doesn't get diluted/inflated unfairly. */
function systemWidePlatformStats(allRows: BalanceSheetRow[]): Map<string, number> {
  const totals = new Map<string, { profit: number; converted: number }>();
  for (const row of allRows) {
    for (const p of row.platformBreakdown) {
      if (p.platform === UNSPECIFIED_PLATFORM) continue;
      const t = totals.get(p.platform) ?? { profit: 0, converted: 0 };
      t.profit += p.profit;
      t.converted += p.converted;
      totals.set(p.platform, t);
    }
  }
  const result = new Map<string, number>();
  for (const [platform, t] of totals) {
    const ppc = safeDiv(t.profit, t.converted);
    if (ppc != null) result.set(platform, ppc);
  }
  return result;
}

export function recommendBudgetAllocation(rows: BalanceSheetRow[], totalBudget: number): BudgetAllocationRow[] {
  const realRows = rows.filter((r) => r.area !== UNATTRIBUTED_AREA && r.subjectGroup !== UNSPECIFIED_SUBJECT_GROUP);
  const eligible = realRows.filter((r) => r.tutorCount >= MIN_TUTORS_FOR_ELIGIBILITY);
  const excluded = realRows.filter((r) => r.tutorCount < MIN_TUTORS_FOR_ELIGIBILITY);
  const systemWide = systemWidePlatformStats(rows);

  const excludedResults: BudgetAllocationRow[] = excluded.map((r) => ({
    area: r.area,
    subjectGroup: r.subjectGroup,
    score: 0,
    scoreBreakdown: { supplyGap: 0, costEfficiency: 0, profitability: 0, conversionRate: 0 },
    recommendedAmount: 0,
    recommendedPlatform: null,
    platformRationale: "no active tutor supply here yet — fund tutor recruitment before ad spend",
    excludedReason: "no active tutor supply in this area/subject group",
  }));

  if (eligible.length === 0) return excludedResults;

  const supplyGapRaw = eligible.map((r) => r.tutorCount / (r.leads + 1));
  const costEfficiencyRaw = eligible.map((r) => (r.costPerLead != null ? 1 / r.costPerLead : null));
  const profitabilityRaw = eligible.map((r) => r.profitPerConversion);
  const conversionRateRaw = eligible.map((r) => safeDiv(r.converted, r.leads));

  const supplyGapScores = normalize(supplyGapRaw);
  const costEfficiencyScores = normalize(costEfficiencyRaw);
  const profitabilityScores = normalize(profitabilityRaw);
  const conversionRateScores = normalize(conversionRateRaw);

  const scores = eligible.map(
    (_, i) =>
      BUDGET_WEIGHTS.supplyGap * supplyGapScores[i] +
      BUDGET_WEIGHTS.costEfficiency * costEfficiencyScores[i] +
      BUDGET_WEIGHTS.profitability * profitabilityScores[i] +
      BUDGET_WEIGHTS.conversionRate * conversionRateScores[i],
  );

  const totalScore = scores.reduce((a, b) => a + b, 0);
  const shares = totalScore > 0 ? scores.map((s) => s / totalScore) : eligible.map(() => 1 / eligible.length);
  const amounts = allocateExact(Math.round(totalBudget), shares);

  const eligibleResults: BudgetAllocationRow[] = eligible.map((r, i) => {
    const local = bestLocalPlatform(r);
    let recommendedPlatform: string;
    let platformRationale: string;
    if (local) {
      recommendedPlatform = local.platform;
      const converted = r.platformBreakdown.find((p) => p.platform === local.platform)?.converted ?? 0;
      platformRationale = `best historical profit/conversion here (n=${converted} conversion${converted === 1 ? "" : "s"})`;
    } else if (systemWide.size > 0) {
      const [bestPlatform] = Array.from(systemWide.entries()).reduce((a, b) => (b[1] > a[1] ? b : a));
      recommendedPlatform = bestPlatform;
      platformRationale = "no history here — using the best-performing platform system-wide";
    } else {
      recommendedPlatform = DEFAULT_FALLBACK_PLATFORM;
      platformRationale = "no conversion history anywhere yet — defaulting to the only platform already live";
    }

    return {
      area: r.area,
      subjectGroup: r.subjectGroup,
      score: scores[i],
      scoreBreakdown: {
        supplyGap: supplyGapScores[i],
        costEfficiency: costEfficiencyScores[i],
        profitability: profitabilityScores[i],
        conversionRate: conversionRateScores[i],
      },
      recommendedAmount: amounts[i],
      recommendedPlatform,
      platformRationale,
      excludedReason: null,
    };
  });

  return [...eligibleResults, ...excludedResults];
}
