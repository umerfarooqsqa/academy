import { describe, it, expect } from "vitest";
import { recommendBudgetAllocation } from "@/lib/marketing/budgetRecommendation";
import type { BalanceSheetRow } from "@/lib/marketing/balanceSheet";

function row(overrides: Partial<BalanceSheetRow>): BalanceSheetRow {
  return {
    area: "North Nazimabad",
    subjectGroup: "pre_medical",
    tutorCount: 3,
    leads: 10,
    matched: 5,
    converted: 4,
    spend: 8000,
    revenue: 16000,
    profit: 8000,
    costPerLead: 800,
    profitPerConversion: 2000,
    platformBreakdown: [
      { platform: "facebook", spend: 8000, converted: 4, revenue: 16000, profit: 8000, costPerConversion: 2000, profitPerConversion: 2000 },
    ],
    ...overrides,
  };
}

describe("recommendBudgetAllocation", () => {
  it("excludes a zero-tutor-supply row with amount 0 and a reason, never silently dropping it", () => {
    const rows = [row({ area: "Malir", tutorCount: 0 })];
    const result = recommendBudgetAllocation(rows, 10000);
    expect(result).toHaveLength(1);
    expect(result[0].recommendedAmount).toBe(0);
    expect(result[0].excludedReason).toMatch(/no active tutor supply/);
  });

  it("drops sentinel (Unattributed / unspecified) rows entirely — recommendations only target real combos", () => {
    const rows = [row({ area: "Unattributed" }), row({ subjectGroup: "unspecified" })];
    const result = recommendBudgetAllocation(rows, 10000);
    expect(result).toHaveLength(0);
  });

  it("allocates amounts that sum exactly to the total budget (largest-remainder rounding)", () => {
    const rows = [
      row({ area: "North Nazimabad", tutorCount: 5, profitPerConversion: 3000 }),
      row({ area: "Gulshan-e-Iqbal", tutorCount: 2, profitPerConversion: 1000 }),
      row({ area: "DHA", tutorCount: 1, profitPerConversion: 500 }),
    ];
    const result = recommendBudgetAllocation(rows, 10000);
    const sum = result.reduce((s, r) => s + r.recommendedAmount, 0);
    expect(sum).toBe(10000);
  });

  it("gives a higher score (and larger allocation) to a more profitable combo over a cheaper-but-less-profitable one", () => {
    const rows = [
      row({ area: "North Nazimabad", profitPerConversion: 5000, costPerLead: 1000 }),
      row({ area: "Gulshan-e-Iqbal", profitPerConversion: 500, costPerLead: 200 }),
    ];
    const result = recommendBudgetAllocation(rows, 10000);
    const strong = result.find((r) => r.area === "North Nazimabad")!;
    const weak = result.find((r) => r.area === "Gulshan-e-Iqbal")!;
    expect(strong.score).toBeGreaterThan(weak.score);
    expect(strong.recommendedAmount).toBeGreaterThan(weak.recommendedAmount);
  });

  it("recommends the platform with the best local history when one exists", () => {
    const rows = [
      row({
        platformBreakdown: [
          { platform: "facebook", spend: 1000, converted: 1, revenue: 2000, profit: 1000, costPerConversion: 1000, profitPerConversion: 1000 },
          { platform: "tiktok", spend: 1000, converted: 1, revenue: 5000, profit: 4000, costPerConversion: 1000, profitPerConversion: 4000 },
        ],
      }),
    ];
    const result = recommendBudgetAllocation(rows, 5000);
    expect(result[0].recommendedPlatform).toBe("tiktok");
    expect(result[0].platformRationale).toMatch(/best historical profit\/conversion here/);
  });

  it("falls back to the system-wide best platform when the combo itself has no conversion history", () => {
    const rows = [
      row({ area: "North Nazimabad", platformBreakdown: [], profitPerConversion: null, converted: 0 }),
      row({
        area: "Gulshan-e-Iqbal",
        platformBreakdown: [
          { platform: "instagram", spend: 1000, converted: 2, revenue: 5000, profit: 4000, costPerConversion: 500, profitPerConversion: 2000 },
        ],
      }),
    ];
    const result = recommendBudgetAllocation(rows, 5000);
    const noHistory = result.find((r) => r.area === "North Nazimabad")!;
    expect(noHistory.recommendedPlatform).toBe("instagram");
    expect(noHistory.platformRationale).toMatch(/system-wide/);
  });

  it("defaults to the fallback platform when there is no conversion history anywhere", () => {
    const rows = [row({ platformBreakdown: [], profitPerConversion: null, converted: 0 })];
    const result = recommendBudgetAllocation(rows, 5000);
    expect(result[0].recommendedPlatform).toBe("facebook");
    expect(result[0].platformRationale).toMatch(/no conversion history anywhere/);
  });

  it("returns an empty array when there are no real rows at all", () => {
    expect(recommendBudgetAllocation([], 5000)).toEqual([]);
  });
});
