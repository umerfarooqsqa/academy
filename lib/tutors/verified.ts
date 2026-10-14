// The single definition of a "verified tutor" for anything shown publicly
// (2026-10-14 operator decision): an active profile, a CNIC image on file,
// AND that CNIC checked by an admin on /tutors/[id] (Tutor.cnicVerifiedAt —
// cleared whenever the CNIC image is replaced). Public counts such as
// "12 verified tutors near you" must use this, never plain status: "active".

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { countVerifiedByZone, type ZoneTutorCount } from "@/lib/tutors/nearbyCounts";

export const VERIFIED_TUTOR_WHERE = {
  status: "active",
  cnicImageUrl: { not: null },
  cnicVerifiedAt: { not: null },
} satisfies Prisma.TutorWhereInput;

/** Per-zone verified-tutor counts for the public "verified tutors near you"
 * messages (homepage, /find-a-tutor). Counts only — see lib/tutors/nearbyCounts.ts. */
export async function getVerifiedTutorCounts(): Promise<ZoneTutorCount[]> {
  const [zones, tutors] = await Promise.all([
    prisma.areaZone.findMany(),
    prisma.tutor.findMany({ where: VERIFIED_TUTOR_WHERE, select: { area: true, subjectGroup: true } }),
  ]);
  return countVerifiedByZone(zones, tutors);
}
