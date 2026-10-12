import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const campaignId = searchParams.get("campaignId");
  const spends = await prisma.marketingSpend.findMany({
    where: campaignId ? { campaignId } : {},
    include: { campaign: true },
    orderBy: { spentOn: "desc" },
  });
  return NextResponse.json({ spends });
}

// Logging ad/referral spend as it happens (6.9, Section 7 /finance page).
export async function POST(req: Request) {
  const body = await req.json();
  if (!body.channel || body.amount == null || !body.spentOn) {
    return NextResponse.json({ error: "channel, amount, spentOn are required" }, { status: 400 });
  }
  const spend = await prisma.marketingSpend.create({
    data: {
      campaignId: body.campaignId ?? null,
      channel: body.channel,
      area: body.area ?? null,
      platform: body.platform ?? null,
      subjectGroup: body.subjectGroup ?? null,
      amount: body.amount,
      spentOn: new Date(body.spentOn),
      notes: body.notes ?? null,
    },
  });
  return NextResponse.json({ spend }, { status: 201 });
}
