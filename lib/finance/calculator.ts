// Cost-per-successful-deal calculator (CLAUDE.md 6.9). Pure aggregation over
// already-fetched rows — no Prisma/DB access here, so this is fully
// unit-testable against seeded fixtures (per the spec's explicit requirement).
//
// A "successful deal" = a Match whose linked Payment.status is "collected" or
// "paid_out" — i.e. the parent actually paid, not just a demo that happened.

export interface MarketingSpendRow {
  amount: number;
  spentOn: Date;
  area: string | null;
}

export interface PaymentRow {
  status: string; // pending | collected | paid_out
  commission: number;
  createdAt: Date;
  area: string | null; // ParentRequest.area, joined in by the caller via Match
}

export interface DateRange {
  start: Date;
  end: Date; // exclusive
}

export interface FinanceMetrics {
  totalSpend: number;
  successfulDeals: number;
  totalCommission: number;
  costPerDeal: number | null; // null (displayed as "—") when successfulDeals === 0
  netProfit: number;
  profitPerDeal: number | null;
  breakEvenDealsCount: number | null; // null when there's no commission data to average
}

const SUCCESSFUL_STATUSES = new Set(["collected", "paid_out"]);

function inRange(d: Date, range: DateRange): boolean {
  return d >= range.start && d < range.end;
}

export function calculateFinanceMetrics(
  spend: MarketingSpendRow[],
  payments: PaymentRow[],
  range: DateRange,
  area?: string | null,
): FinanceMetrics {
  const spendFiltered = spend.filter(
    (s) => inRange(s.spentOn, range) && (!area || s.area === area),
  );
  const paymentsFiltered = payments.filter(
    (p) => inRange(p.createdAt, range) && (!area || p.area === area),
  );
  const successful = paymentsFiltered.filter((p) => SUCCESSFUL_STATUSES.has(p.status));

  const totalSpend = spendFiltered.reduce((sum, s) => sum + s.amount, 0);
  const successfulDeals = successful.length;
  const totalCommission = successful.reduce((sum, p) => sum + p.commission, 0);

  const costPerDeal = successfulDeals > 0 ? totalSpend / successfulDeals : null;
  const netProfit = totalCommission - totalSpend;
  const profitPerDeal = successfulDeals > 0 ? netProfit / successfulDeals : null;
  const avgCommission = successfulDeals > 0 ? totalCommission / successfulDeals : null;
  const breakEvenDealsCount = avgCommission && avgCommission > 0 ? totalSpend / avgCommission : null;

  return {
    totalSpend,
    successfulDeals,
    totalCommission,
    costPerDeal,
    netProfit,
    profitPerDeal,
    breakEvenDealsCount,
  };
}
