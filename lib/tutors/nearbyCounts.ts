// "N verified tutors near you" for parents (2026-10-14) — pure, so the
// browser can run it against the parent's own location without sending it
// anywhere. Only per-zone counts are ever exposed: no tutor names, numbers or
// individual locations. "Verified" is lib/tutors/verified.ts's definition;
// the server applies it before counting (countVerifiedByZone's input).
// "Near" uses the same rule as everywhere else: within a zone's own maxKm of
// its centroid.

import { haversineKm } from "@/lib/matching/engine";

export interface ZoneTutorCount {
  name: string;
  latitude: number;
  longitude: number;
  maxKm: number;
  verified: number;
  bySubjectGroup: Record<string, number>;
}

/** Groups already-verified tutors by their zone (Tutor.area is an AreaZone.name). */
export function countVerifiedByZone(
  zones: { name: string; latitude: number; longitude: number; maxKm: number }[],
  verifiedTutors: { area: string; subjectGroup: string }[],
): ZoneTutorCount[] {
  return zones.map((z) => {
    const here = verifiedTutors.filter((t) => t.area.toLowerCase() === z.name.toLowerCase());
    const bySubjectGroup: Record<string, number> = {};
    for (const t of here) bySubjectGroup[t.subjectGroup] = (bySubjectGroup[t.subjectGroup] ?? 0) + 1;
    return { name: z.name, latitude: z.latitude, longitude: z.longitude, maxKm: z.maxKm, verified: here.length, bySubjectGroup };
  });
}

export interface VerifiedNearby {
  /** Verified tutors in every zone within its own maxKm of the point. */
  total: number;
  /** Nearest zone overall (for "near Gulshan-e-Iqbal"), or null if there are no zones. */
  nearestZone: string | null;
  bySubjectGroup: Record<string, number>;
}

export function verifiedNear(counts: ZoneTutorCount[], lat: number, lon: number, subjectGroup?: string): VerifiedNearby {
  let total = 0;
  let nearest: { name: string; d: number } | null = null;
  const bySubjectGroup: Record<string, number> = {};
  for (const z of counts) {
    const d = haversineKm(lat, lon, z.latitude, z.longitude);
    if (!nearest || d < nearest.d) nearest = { name: z.name, d };
    if (d > z.maxKm) continue;
    total += subjectGroup ? (z.bySubjectGroup[subjectGroup] ?? 0) : z.verified;
    for (const [g, n] of Object.entries(z.bySubjectGroup)) bySubjectGroup[g] = (bySubjectGroup[g] ?? 0) + n;
  }
  return { total, nearestZone: nearest?.name ?? null, bySubjectGroup };
}
