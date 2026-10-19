// GET /api/zones/tutor-density — the 6.11 heat map aggregation (Section 8).

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeTutorDensity } from "@/lib/analytics/tutorDensity";
import { computeLiveTier } from "@/lib/tutors/tier";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const subjectGroup = searchParams.get("subjectGroup") ?? undefined;
  const tier = searchParams.get("tier") ?? undefined;

  const [zones, tutors] = await Promise.all([
    prisma.areaZone.findMany(),
    prisma.tutor.findMany({
      where: { status: "active" },
      include: { subscriptions: true },
    }),
  ]);

  const tutorRows = tutors.map((t) => ({
    status: t.status,
    area: t.area,
    subjectGroup: t.subjectGroup,
    subjectGroups: t.subjectGroups,
    tier: computeLiveTier(t.subscriptions),
  }));

  const result = computeTutorDensity(zones, tutorRows, { subjectGroup, tier });
  return NextResponse.json({ zones: result });
}
