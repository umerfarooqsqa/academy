// Homepage stats band (2026-10-15 redesign). Only real numbers, and only
// once they're big enough to impress: a count shows when it's at least
// STAT_MIN; "areas covered" (the AreaZone table) always shows. If nothing
// qualifies the band is hidden — never a "0 tutors" or a made-up figure.

import { prisma } from "@/lib/db";
import { VERIFIED_TUTOR_WHERE } from "@/lib/tutors/verified";

export const STAT_MIN = 10;

export interface PublicStat {
  value: number;
  label: string;
}

export function visibleStats(raw: { areas: number; verifiedTutors: number; studentsPlaced: number }): PublicStat[] {
  const stats: PublicStat[] = [];
  if (raw.verifiedTutors >= STAT_MIN) stats.push({ value: raw.verifiedTutors, label: "Verified tutors" });
  if (raw.studentsPlaced >= STAT_MIN) stats.push({ value: raw.studentsPlaced, label: "Students placed" });
  if (raw.areas > 0) stats.push({ value: raw.areas, label: raw.areas === 1 ? "Area covered" : "Areas covered" });
  // A lone "areas covered" number isn't worth a whole band.
  return stats.length > 1 ? stats : [];
}

export async function getPublicStats(): Promise<PublicStat[]> {
  const [areas, verifiedTutors, placed] = await Promise.all([
    prisma.areaZone.count(),
    prisma.tutor.count({ where: VERIFIED_TUTOR_WHERE }),
    prisma.match.findMany({ where: { status: { in: ["paid", "completed"] } }, select: { parentRequestId: true }, distinct: ["parentRequestId"] }),
  ]);
  return visibleStats({ areas, verifiedTutors, studentsPlaced: placed.length });
}
