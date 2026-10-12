import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const editable = ["name", "channel", "area", "audienceNote", "platform", "subjectGroup", "metaAdId", "endDate"] as const;
  const data: Record<string, unknown> = {};
  for (const f of editable) {
    if (f in body) data[f] = f === "endDate" && body[f] ? new Date(body[f]) : body[f];
  }
  const campaign = await prisma.campaign.update({ where: { id }, data });
  return NextResponse.json({ campaign });
}
