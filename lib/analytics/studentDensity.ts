// Student (parent request) density for the /heatmap page (2026-10-14
// operator request — extends CLAUDE.md 6.11's tutor density map). Same
// approach as tutorDensity.ts: a GROUP BY zone over already-fetched rows,
// plotted at zone centroids — never per-student pins, even though some
// requests now carry a precise shared location.
//
// "Still needs a tutor": the request isn't closed and none of its matches has
// reached paid/completed (i.e. no tutor has been placed with them yet).

export interface StudentDensityInput {
  area: string;
  subjectGroup: string;
  status: string; // ParentRequest.status: pending | matched | closed
  /** Has any Match with status paid or completed. */
  placed: boolean;
}

export interface StudentDensityFilters {
  subjectGroup?: string;
  needsTutorOnly?: boolean;
}

export interface StudentDensityResult {
  zones: { zone: string; latitude: number; longitude: number; studentCount: number }[];
  /** Matching requests whose area isn't a configured zone (e.g. a typed
   * landmark) — can't be placed on the map, reported separately. */
  unzoned: number;
}

export const PLACED_MATCH_STATUSES = ["paid", "completed"];

export function needsTutor(r: Pick<StudentDensityInput, "status" | "placed">): boolean {
  return r.status !== "closed" && !r.placed;
}

export function computeStudentDensity(
  zones: { name: string; latitude: number; longitude: number }[],
  requests: StudentDensityInput[],
  filters: StudentDensityFilters = {},
): StudentDensityResult {
  const shown = requests.filter((r) => {
    if (filters.subjectGroup && r.subjectGroup !== filters.subjectGroup) return false;
    if (filters.needsTutorOnly && !needsTutor(r)) return false;
    return true;
  });

  const zoneByName = new Map(zones.map((z) => [z.name.toLowerCase(), z.name]));
  const counts = new Map<string, number>();
  let unzoned = 0;
  for (const r of shown) {
    const zone = zoneByName.get(r.area.toLowerCase());
    if (zone) counts.set(zone, (counts.get(zone) ?? 0) + 1);
    else unzoned++;
  }

  return {
    zones: zones.map((z) => ({ zone: z.name, latitude: z.latitude, longitude: z.longitude, studentCount: counts.get(z.name) ?? 0 })),
    unzoned,
  };
}
