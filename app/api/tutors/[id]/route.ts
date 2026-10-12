import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeLiveTier } from "@/lib/tutors/tier";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tutor = await prisma.tutor.findUnique({
    where: { id },
    include: { subscriptions: true, campaign: true, ratings: true },
  });
  if (!tutor) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ tutor: { ...tutor, tier: computeLiveTier(tutor.subscriptions) } });
}

// Edit profile fields, activate/deactivate (status), or set internalNote — the
// /tutors dashboard's edit + activate/deactivate actions (Section 7).
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const editable = [
    "name",
    "email",
    "phone",
    "qualification",
    "subjects",
    "subjectGroup",
    "curriculum",
    "gradesBySubject",
    "area",
    "availability",
    "expectedFee",
    "deliveryMode",
    "radiusOverrideKm",
    "status",
    "internalNote",
    "cnicImageUrl",
    "marksheetImageUrls",
    "campaignId",
  ] as const;

  const data: Record<string, unknown> = {};
  for (const f of editable) {
    if (f in body) data[f] = body[f];
  }

  const tutor = await prisma.tutor.update({ where: { id }, data, include: { subscriptions: true } });
  return NextResponse.json({ tutor: { ...tutor, tier: computeLiveTier(tutor.subscriptions) } });
}
