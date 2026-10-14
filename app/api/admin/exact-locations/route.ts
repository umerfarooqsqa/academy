// GET /api/admin/exact-locations — exact-location dots for /heatmap, ADMIN
// ONLY (2026-10-14 operator decision; see lib/analytics/exactLocations.ts).
// Blocked for staff twice: middleware.ts lists /api/admin as admin-only, and
// this route re-checks the session role itself.
// Query params mirror the heat map's filters: subjectGroup, tier (tutors),
// needsTutor=1 (students who still need a tutor).

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";
import { hasExactLocation, type ExactPoint } from "@/lib/analytics/exactLocations";
import { needsTutor, PLACED_MATCH_STATUSES } from "@/lib/analytics/studentDensity";
import { computeLiveTier } from "@/lib/tutors/tier";

export async function GET(req: Request) {
  const session = await verifySessionToken((await cookies()).get(SESSION_COOKIE_NAME)?.value);
  if (session?.role !== "admin") return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const subjectGroup = searchParams.get("subjectGroup") || undefined;
  const tier = searchParams.get("tier") || undefined;
  const needsTutorOnly = searchParams.get("needsTutor") === "1";

  const [zones, requests, tutors] = await Promise.all([
    prisma.areaZone.findMany(),
    prisma.parentRequest.findMany({
      where: { latitude: { not: null }, longitude: { not: null }, ...(subjectGroup ? { subjectGroup } : {}) },
      select: {
        latitude: true,
        longitude: true,
        area: true,
        subjects: true,
        status: true,
        matches: { where: { status: { in: PLACED_MATCH_STATUSES } }, select: { id: true }, take: 1 },
      },
    }),
    prisma.tutor.findMany({
      where: { status: "active", latitude: { not: null }, longitude: { not: null }, ...(subjectGroup ? { subjectGroup } : {}) },
      select: { latitude: true, longitude: true, area: true, name: true, subjects: true, subscriptions: true },
    }),
  ]);

  const points: ExactPoint[] = [
    ...requests
      .filter((r) => hasExactLocation(r, zones))
      .filter((r) => !needsTutorOnly || needsTutor({ status: r.status, placed: r.matches.length > 0 }))
      .map((r) => ({
        kind: "student" as const,
        latitude: r.latitude!,
        longitude: r.longitude!,
        label: `Student · ${r.subjects.join(", ") || "—"} · ${r.area}`,
      })),
    ...tutors
      .filter((t) => hasExactLocation(t, zones))
      .filter((t) => !tier || computeLiveTier(t.subscriptions) === tier)
      .map((t) => ({
        kind: "tutor" as const,
        latitude: t.latitude!,
        longitude: t.longitude!,
        label: `Tutor ${t.name} · ${t.subjects.join(", ")} · ${t.area}`,
      })),
  ];

  return NextResponse.json({ points });
}
