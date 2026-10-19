// GET /api/zones/student-density — student (parent request) counts per zone
// for the /heatmap page (2026-10-14, extends 6.11). Behind dashboard auth
// like /api/zones/tutor-density (not in middleware.ts's public paths).
// Optional query params: subjectGroup, needsTutor=1 (only requests that
// still need a tutor — see lib/analytics/studentDensity.ts).

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeStudentDensity, PLACED_MATCH_STATUSES } from "@/lib/analytics/studentDensity";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const subjectGroup = searchParams.get("subjectGroup") || undefined;
  const needsTutorOnly = searchParams.get("needsTutor") === "1";

  const [zones, requests] = await Promise.all([
    prisma.areaZone.findMany(),
    prisma.parentRequest.findMany({
      select: {
        area: true,
        subjectGroup: true,
        subjectGroups: true,
        status: true,
        matches: { where: { status: { in: PLACED_MATCH_STATUSES } }, select: { id: true }, take: 1 },
      },
    }),
  ]);

  const result = computeStudentDensity(
    zones,
    requests.map((r) => ({ area: r.area, subjectGroup: r.subjectGroup, subjectGroups: r.subjectGroups, status: r.status, placed: r.matches.length > 0 })),
    { subjectGroup, needsTutorOnly },
  );
  return NextResponse.json(result);
}
