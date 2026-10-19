// Tutor density heat map aggregation (CLAUDE.md 6.11). Pure GROUP BY over
// already-fetched rows — no geocoding, no per-tutor pins (privacy: only zone
// centroids and counts are exposed).

import { groupsOf } from "@/lib/subjectGroups";

export interface AreaZoneRow {
  name: string;
  latitude: number;
  longitude: number;
}

export interface TutorDensityInput {
  status: string;
  area: string;
  subjectGroup: string;
  subjectGroups?: string[];
  tier: string;
}

export interface TutorDensityFilters {
  subjectGroup?: string;
  tier?: string;
}

export interface TutorDensityResult {
  zone: string;
  latitude: number;
  longitude: number;
  tutorCount: number;
}

export function computeTutorDensity(
  zones: AreaZoneRow[],
  tutors: TutorDensityInput[],
  filters: TutorDensityFilters = {},
): TutorDensityResult[] {
  const active = tutors.filter((t) => {
    if (t.status !== "active") return false;
    if (filters.subjectGroup && !groupsOf(t).includes(filters.subjectGroup)) return false;
    if (filters.tier && t.tier !== filters.tier) return false;
    return true;
  });

  const counts = new Map<string, number>();
  for (const t of active) counts.set(t.area, (counts.get(t.area) ?? 0) + 1);

  return zones.map((z) => ({
    zone: z.name,
    latitude: z.latitude,
    longitude: z.longitude,
    tutorCount: counts.get(z.name) ?? 0,
  }));
}
