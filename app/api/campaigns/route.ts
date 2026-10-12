import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const campaigns = await prisma.campaign.findMany({ orderBy: { startDate: "desc" } });
  return NextResponse.json({ campaigns });
}

// Create/edit Campaign rows — for meta_ads, this is where the Meta ad ID gets
// pasted in once the ad is live, so inbound leads auto-attribute silently (6.1, Section 7).
export async function POST(req: Request) {
  const body = await req.json();
  if (!body.name || !body.channel) {
    return NextResponse.json({ error: "name and channel are required" }, { status: 400 });
  }
  const campaign = await prisma.campaign.create({
    data: {
      name: body.name,
      channel: body.channel,
      area: body.area ?? null,
      audienceNote: body.audienceNote ?? null,
      platform: body.platform ?? null,
      subjectGroup: body.subjectGroup ?? null,
      metaAdId: body.metaAdId ?? null,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : null,
    },
  });
  return NextResponse.json({ campaign }, { status: 201 });
}
