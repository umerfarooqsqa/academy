// GET /api/campaigns/funnel — the 6.10 funnel/A-B comparison table (Section 8).

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeCampaignFunnel } from "@/lib/finance/campaignFunnel";

export async function GET() {
  const [campaigns, parentRequests, tutors, spend, payments] = await Promise.all([
    prisma.campaign.findMany(),
    prisma.parentRequest.findMany({
      select: { campaignId: true, matches: { select: { status: true } } },
    }),
    prisma.tutor.findMany({ select: { campaignId: true } }),
    prisma.marketingSpend.findMany({ select: { campaignId: true, amount: true } }),
    prisma.payment.findMany({
      select: { status: true, commission: true, match: { select: { parentRequest: { select: { campaignId: true } } } } },
    }),
  ]);

  const parentRows = parentRequests.map((p) => ({
    campaignId: p.campaignId,
    hasNonRejectedMatch: p.matches.some((m) => m.status !== "rejected"),
  }));
  const paymentRows = payments.map((p) => ({
    campaignId: p.match.parentRequest.campaignId,
    status: p.status,
    commission: p.commission,
  }));

  const funnel = computeCampaignFunnel(campaigns, parentRows, tutors, spend, paymentRows);
  return NextResponse.json({ funnel });
}
