import { describe, it, expect } from "vitest";
import { computeMarketingBalanceSheet, type TutorSupplyRow, type LeadRow, type ConversionRow, type SpendRow } from "@/lib/marketing/balanceSheet";
import { SUBJECT_GROUPS } from "@/lib/subjectGroups";

const zoneNames = ["North Nazimabad", "Gulshan-e-Iqbal"];

describe("computeMarketingBalanceSheet", () => {
  it("seeds a zero-value row for every zone x subjectGroup combo, even with no data", () => {
    const rows = computeMarketingBalanceSheet(zoneNames, [], [], [], []);
    expect(rows).toHaveLength(zoneNames.length * SUBJECT_GROUPS.length);
    for (const r of rows) {
      expect(r.tutorCount).toBe(0);
      expect(r.leads).toBe(0);
      expect(r.spend).toBe(0);
      expect(r.costPerLead).toBeNull();
    }
  });

  it("counts only active tutors, grouped by (area, subjectGroup)", () => {
    const tutors: TutorSupplyRow[] = [
      { status: "active", area: "North Nazimabad", subjectGroup: "pre_medical" },
      { status: "active", area: "North Nazimabad", subjectGroup: "pre_medical" },
      { status: "pending", area: "North Nazimabad", subjectGroup: "pre_medical" },
      { status: "active", area: "North Nazimabad", subjectGroup: "computer" },
    ];
    const rows = computeMarketingBalanceSheet(zoneNames, tutors, [], [], []);
    const preMedical = rows.find((r) => r.area === "North Nazimabad" && r.subjectGroup === "pre_medical")!;
    const computer = rows.find((r) => r.area === "North Nazimabad" && r.subjectGroup === "computer")!;
    expect(preMedical.tutorCount).toBe(2);
    expect(computer.tutorCount).toBe(1);
  });

  it("tracks leads and matched counts", () => {
    const leads: LeadRow[] = [
      { area: "North Nazimabad", subjectGroup: "pre_medical", hasNonRejectedMatch: true },
      { area: "North Nazimabad", subjectGroup: "pre_medical", hasNonRejectedMatch: false },
    ];
    const rows = computeMarketingBalanceSheet(zoneNames, [], leads, [], []);
    const row = rows.find((r) => r.area === "North Nazimabad" && r.subjectGroup === "pre_medical")!;
    expect(row.leads).toBe(2);
    expect(row.matched).toBe(1);
  });

  it("buckets a null area into the Unattributed sentinel row, never dropping data", () => {
    const spend: SpendRow[] = [{ area: null, subjectGroup: null, platform: null, amount: 5000 }];
    const rows = computeMarketingBalanceSheet(zoneNames, [], [], [], spend);
    const unattributed = rows.find((r) => r.area === "Unattributed" && r.subjectGroup === "unspecified")!;
    expect(unattributed).toBeDefined();
    expect(unattributed.spend).toBe(5000);
  });

  it("computes spend, revenue, profit, costPerLead, and profitPerConversion correctly", () => {
    const leads: LeadRow[] = [
      { area: "North Nazimabad", subjectGroup: "pre_medical", hasNonRejectedMatch: true },
      { area: "North Nazimabad", subjectGroup: "pre_medical", hasNonRejectedMatch: true },
    ];
    const conversions: ConversionRow[] = [
      { area: "North Nazimabad", subjectGroup: "pre_medical", platform: "facebook", status: "collected", commission: 8000 },
      { area: "North Nazimabad", subjectGroup: "pre_medical", platform: "facebook", status: "pending", commission: 9999 }, // not successful, excluded
    ];
    const spend: SpendRow[] = [{ area: "North Nazimabad", subjectGroup: "pre_medical", platform: "facebook", amount: 4000 }];
    const rows = computeMarketingBalanceSheet(zoneNames, [], leads, conversions, spend);
    const row = rows.find((r) => r.area === "North Nazimabad" && r.subjectGroup === "pre_medical")!;
    expect(row.spend).toBe(4000);
    expect(row.revenue).toBe(8000);
    expect(row.profit).toBe(4000);
    expect(row.converted).toBe(1);
    expect(row.costPerLead).toBe(2000);
    expect(row.profitPerConversion).toBe(4000);
  });

  it("builds a per-platform breakdown merging spend and conversion data on platform", () => {
    const conversions: ConversionRow[] = [
      { area: "North Nazimabad", subjectGroup: "pre_medical", platform: "facebook", status: "collected", commission: 6000 },
      { area: "North Nazimabad", subjectGroup: "pre_medical", platform: "tiktok", status: "collected", commission: 3000 },
    ];
    const spend: SpendRow[] = [
      { area: "North Nazimabad", subjectGroup: "pre_medical", platform: "facebook", amount: 2000 },
      { area: "North Nazimabad", subjectGroup: "pre_medical", platform: "tiktok", amount: 1000 },
    ];
    const rows = computeMarketingBalanceSheet(zoneNames, [], [], conversions, spend);
    const row = rows.find((r) => r.area === "North Nazimabad" && r.subjectGroup === "pre_medical")!;
    const fb = row.platformBreakdown.find((p) => p.platform === "facebook")!;
    const tt = row.platformBreakdown.find((p) => p.platform === "tiktok")!;
    expect(fb.profit).toBe(4000);
    expect(fb.profitPerConversion).toBe(4000);
    expect(tt.profit).toBe(2000);
    expect(tt.profitPerConversion).toBe(2000);
  });

  it("reconciliation invariant: sum of all rows' spend equals sum of raw input spend amounts", () => {
    const spend: SpendRow[] = [
      { area: "North Nazimabad", subjectGroup: "pre_medical", platform: "facebook", amount: 3000 },
      { area: null, subjectGroup: null, platform: null, amount: 1500 },
      { area: "Gulshan-e-Iqbal", subjectGroup: "computer", platform: "tiktok", amount: 2500 },
    ];
    const rows = computeMarketingBalanceSheet(zoneNames, [], [], [], spend);
    const totalSpend = rows.reduce((sum, r) => sum + r.spend, 0);
    expect(totalSpend).toBe(3000 + 1500 + 2500);
  });
});
