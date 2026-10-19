// "N verified tutors near you" for parents (2026-10-14) — pure, so the
// browser can run it against the parent's own location without sending it
// anywhere. Only per-zone counts are ever exposed: no tutor names, numbers or
// individual locations. "Verified" is lib/tutors/verified.ts's definition;
// the server applies it before counting (countVerifiedByZone's input).
// "Near" uses the same rule as everywhere else: within a zone's own maxKm of
// its centroid.

import { haversineKm } from "@/lib/matching/engine";
import { groupsOf } from "@/lib/subjectGroups";

export interface ZoneTutorCount {
  name: string;
  latitude: number;
  longitude: number;
  maxKm: number;
  verified: number;
  /** Tutors per category — a tutor with several categories counts in each. */
  bySubjectGroup: Record<string, number>;
  /** Tutors per exact category combination ("pre_medical|school" → 2), so a
   * search over several categories counts each tutor once (2026-10-19). */
  byGroupSet: Record<string, number>;
}

/** Groups already-verified tutors by their zone (Tutor.area is an AreaZone.name). */
export function countVerifiedByZone(
  zones: { name: string; latitude: number; longitude: number; maxKm: number }[],
  verifiedTutors: { area: string; subjectGroup: string; subjectGroups?: string[] }[],
): ZoneTutorCount[] {
  return zones.map((z) => {
    const here = verifiedTutors.filter((t) => t.area.toLowerCase() === z.name.toLowerCase());
    const bySubjectGroup: Record<string, number> = {};
    const byGroupSet: Record<string, number> = {};
    for (const t of here) {
      const groups = [...new Set(groupsOf(t))].sort();
      for (const g of groups) bySubjectGroup[g] = (bySubjectGroup[g] ?? 0) + 1;
      const key = groups.join("|");
      byGroupSet[key] = (byGroupSet[key] ?? 0) + 1;
    }
    return { name: z.name, latitude: z.latitude, longitude: z.longitude, maxKm: z.maxKm, verified: here.length, bySubjectGroup, byGroupSet };
  });
}

export interface VerifiedNearby {
  /** Verified tutors in every zone within its own maxKm of the point. */
  total: number;
  /** Nearest zone overall (for "near Gulshan-e-Iqbal"), or null if there are no zones. */
  nearestZone: string | null;
  bySubjectGroup: Record<string, number>;
}

/** Verified tutors teaching any of `groups` in one zone (each tutor once). */
function countInGroups(z: ZoneTutorCount, groups: string[]): number {
  let n = 0;
  for (const [key, count] of Object.entries(z.byGroupSet ?? {})) {
    if (key.split("|").some((g) => groups.includes(g))) n += count;
  }
  return n;
}

export function verifiedNear(
  counts: ZoneTutorCount[],
  lat: number,
  lon: number,
  subjectGroup?: string | string[],
): VerifiedNearby {
  const groups = subjectGroup == null ? [] : Array.isArray(subjectGroup) ? subjectGroup : [subjectGroup];
  let total = 0;
  let nearest: { name: string; d: number } | null = null;
  const bySubjectGroup: Record<string, number> = {};
  for (const z of counts) {
    const d = haversineKm(lat, lon, z.latitude, z.longitude);
    if (!nearest || d < nearest.d) nearest = { name: z.name, d };
    if (d > z.maxKm) continue;
    total += groups.length ? countInGroups(z, groups) : z.verified;
    for (const [g, n] of Object.entries(z.bySubjectGroup)) bySubjectGroup[g] = (bySubjectGroup[g] ?? 0) + n;
  }
  return { total, nearestZone: nearest?.name ?? null, bySubjectGroup };
}
