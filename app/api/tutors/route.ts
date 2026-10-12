import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeLiveTier } from "@/lib/tutors/tier";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const area = searchParams.get("area");
  const q = searchParams.get("q");

  const tutors = await prisma.tutor.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(area ? { area } : {}),
      ...(q
        ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { whatsappId: { contains: q } }] }
        : {}),
    },
    include: { subscriptions: true, campaign: true },
    orderBy: { createdAt: "desc" },
  });

  const withLiveTier = tutors.map((t) => ({ ...t, tier: computeLiveTier(t.subscriptions) }));
  return NextResponse.json({ tutors: withLiveTier });
}

// Manual tutor creation from the dashboard — a fallback to the WhatsApp intake
// flow (6.1), useful while Phase 0 (Meta setup) is still blocked.
export async function POST(req: Request) {
  const body = await req.json();
  const required = ["whatsappId", "name", "qualification", "subjectGroup", "curriculum", "area"];
  for (const f of required) {
    if (!body[f]) return NextResponse.json({ error: `${f} is required` }, { status: 400 });
  }

  const tutor = await prisma.tutor.create({
    data: {
      whatsappId: body.whatsappId,
      name: body.name,
      email: body.email ?? null,
      phone: body.phone ?? null,
      qualification: body.qualification,
      subjects: body.subjects ?? [],
      subjectGroup: body.subjectGroup,
      curriculum: body.curriculum,
      gradesBySubject: body.gradesBySubject ?? undefined,
      area: body.area,
      availability: body.availability ?? [],
      expectedFee: body.expectedFee ?? null,
      deliveryMode: body.deliveryMode ?? "in_person",
      status: body.status ?? "active",
      internalNote: body.internalNote ?? null,
      rawMessage: body.rawMessage ?? "(entered manually via dashboard)",
      campaignId: body.campaignId ?? null,
    },
  });
  return NextResponse.json({ tutor }, { status: 201 });
}
