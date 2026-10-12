// Manual campaignId tagging for non-Meta-ad tutor leads (referrals, organic
// posts) — CLAUDE.md 6.1, Section 8.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  if (!body.campaignId) return NextResponse.json({ error: "campaignId is required" }, { status: 400 });

  const tutor = await prisma.tutor.update({ where: { id }, data: { campaignId: body.campaignId } });
  return NextResponse.json({ tutor });
}
