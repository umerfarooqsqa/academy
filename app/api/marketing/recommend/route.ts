// POST /api/marketing/recommend — body { totalBudget: number }. Computes the
// balance sheet (same fetch pattern as GET /api/marketing/balance-sheet —
// duplicated rather than shared, matching this codebase's existing convention
// of campaigns/funnel and finance/metrics each independently querying
// overlapping Payment data) and runs the deterministic weighted-scoring
// allocation (lib/marketing/budgetRecommendation.ts) over it.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeMarketingBalanceSheet, type SpendRow, type ConversionRow } from "@/lib/marketing/balanceSheet";
import { recommendBudgetAllocation } from "@/lib/marketing/budgetRecommendation";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const totalBudget = body?.totalBudget;
  if (typeof totalBudget !== "number" || !Number.isFinite(totalBudget) || totalBudget <= 0) {
    return NextResponse.json({ error: "totalBudget must be a positive number" }, { status: 400 });
  }

  const [zones, tutors, parentRequests, payments, spends] = await Promise.all([
    prisma.areaZone.findMany({ select: { name: true } }),
    prisma.tutor.findMany({ select: { status: true, area: true, subjectGroup: true } }),
    prisma.parentRequest.findMany({
      select: { area: true, subjectGroup: true, matches: { select: { status: true } } },
    }),
    prisma.payment.findMany({
      select: {
        status: true,
        commission: true,
        match: {
          select: {
            parentRequest: {
              select: { area: true, subjectGroup: true, campaign: { select: { platform: true } } },
            },
          },
        },
      },
    }),
    prisma.marketingSpend.findMany({
      select: {
        area: true,
        subjectGroup: true,
        platform: true,
        amount: true,
        campaign: { select: { area: true, subjectGroup: true, platform: true } },
      },
    }),
  ]);

  const leads = parentRequests.map((p) => ({
    area: p.area,
    subjectGroup: p.subjectGroup,
    hasNonRejectedMatch: p.matches.some((m) => m.status !== "rejected"),
  }));

  const conversions: ConversionRow[] = payments.map((p) => ({
    area: p.match.parentRequest.area,
    subjectGroup: p.match.parentRequest.subjectGroup,
    platform: p.match.parentRequest.campaign?.platform ?? null,
    status: p.status,
    commission: p.commission,
  }));

  const spendRows: SpendRow[] = spends.map((s) => ({
    area: s.area ?? s.campaign?.area ?? null,
    subjectGroup: s.subjectGroup ?? s.campaign?.subjectGroup ?? null,
    platform: s.platform ?? s.campaign?.platform ?? null,
    amount: s.amount,
  }));

  const balanceSheet = computeMarketingBalanceSheet(
    zones.map((z) => z.name),
    tutors,
    leads,
    conversions,
    spendRows,
  );

  const allocation = recommendBudgetAllocation(balanceSheet, totalBudget);
  return NextResponse.json({ allocation });
}
