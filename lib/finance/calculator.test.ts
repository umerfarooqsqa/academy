import { describe, it, expect } from "vitest";
import { calculateFinanceMetrics, type MarketingSpendRow, type PaymentRow } from "@/lib/finance/calculator";

const range = { start: new Date("2026-01-01"), end: new Date("2026-02-01") };

describe("calculateFinanceMetrics (CLAUDE.md 6.9)", () => {
  it("shows null (displayed as '—') for costPerDeal/profitPerDeal when there are zero deals", () => {
    const m = calculateFinanceMetrics([], [], range);
    expect(m.successfulDeals).toBe(0);
    expect(m.costPerDeal).toBeNull();
    expect(m.profitPerDeal).toBeNull();
    expect(m.breakEvenDealsCount).toBeNull();
  });

  it("counts only collected/paid_out payments as successful deals", () => {
    const payments: PaymentRow[] = [
      { status: "pending", commission: 5000, createdAt: new Date("2026-01-10"), area: null },
      { status: "collected", commission: 5000, createdAt: new Date("2026-01-10"), area: null },
      { status: "paid_out", commission: 5000, createdAt: new Date("2026-01-15"), area: null },
    ];
    const m = calculateFinanceMetrics([], payments, range);
    expect(m.successfulDeals).toBe(2);
    expect(m.totalCommission).toBe(10000);
  });

  it("computes cost per deal, net profit, profit per deal, and break-even count together", () => {
    const spend: MarketingSpendRow[] = [
      { amount: 20000, spentOn: new Date("2026-01-05"), area: null },
    ];
    const payments: PaymentRow[] = [
      { status: "collected", commission: 8000, createdAt: new Date("2026-01-10"), area: null },
      { status: "paid_out", commission: 12000, createdAt: new Date("2026-01-20"), area: null },
    ];
    const m = calculateFinanceMetrics(spend, payments, range);
    expect(m.totalSpend).toBe(20000);
    expect(m.successfulDeals).toBe(2);
    expect(m.totalCommission).toBe(20000);
    expect(m.costPerDeal).toBe(10000);
    expect(m.netProfit).toBe(0);
    expect(m.profitPerDeal).toBe(0);
    expect(m.breakEvenDealsCount).toBe(2); // 20000 / avg(10000) = 2
  });

  it("excludes rows outside the date range", () => {
    const spend: MarketingSpendRow[] = [
      { amount: 5000, spentOn: new Date("2025-12-31"), area: null },
    ];
    const payments: PaymentRow[] = [
      { status: "collected", commission: 5000, createdAt: new Date("2026-02-01"), area: null },
    ];
    const m = calculateFinanceMetrics(spend, payments, range);
    expect(m.totalSpend).toBe(0);
    expect(m.successfulDeals).toBe(0);
  });

  it("filters by area when provided", () => {
    const spend: MarketingSpendRow[] = [
      { amount: 5000, spentOn: new Date("2026-01-05"), area: "North Nazimabad" },
      { amount: 3000, spentOn: new Date("2026-01-05"), area: "Malir" },
    ];
    const payments: PaymentRow[] = [
      { status: "collected", commission: 4000, createdAt: new Date("2026-01-10"), area: "North Nazimabad" },
      { status: "collected", commission: 6000, createdAt: new Date("2026-01-10"), area: "Malir" },
    ];
    const m = calculateFinanceMetrics(spend, payments, range, "North Nazimabad");
    expect(m.totalSpend).toBe(5000);
    expect(m.totalCommission).toBe(4000);
    expect(m.successfulDeals).toBe(1);
  });
});
