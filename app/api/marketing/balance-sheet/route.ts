// GET /api/marketing/balance-sheet — the spend+supply+outcome ledger (not
// formal accounting), re-grouped by (area, subjectGroup) with a per-platform
// spend/outcome breakdown. Fetches raw rows and hands them to the pure
// lib/marketing/balanceSheet.ts function.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeMarketingBalanceSheet, type SpendRow, type ConversionRow } from "@/lib/marketing/balanceSheet";

export async function GET() {
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

  return NextResponse.json({ balanceSheet });
}
