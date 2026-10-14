// Exact-location dots for the /heatmap page — ADMIN ONLY (2026-10-14
// operator decision). Shown only to admin logins (never staff) via
// GET /api/admin/exact-locations; tutors on the public site only ever see a
// distance, never where a student is.
//
// Tutor/ParentRequest latitude+longitude hold EITHER a precise point (the
// person tapped "Share my location", or a Maps link was found) OR, by
// default, their zone's centroid. Only the precise ones are dots — a
// centroid fallback isn't a real location and stays in the zone circles.

export interface LocatedRow {
  latitude: number | null;
  longitude: number | null;
  area: string;
}

/** True when the row has coordinates that aren't just its zone's centroid. */
export function hasExactLocation(row: LocatedRow, zones: { name: string; latitude: number; longitude: number }[]): boolean {
  if (row.latitude == null || row.longitude == null) return false;
  const zone = zones.find((z) => z.name.toLowerCase() === row.area.toLowerCase());
  if (!zone) return true;
  return Math.abs(zone.latitude - row.latitude) > 1e-6 || Math.abs(zone.longitude - row.longitude) > 1e-6;
}

export interface ExactPoint {
  kind: "student" | "tutor";
  latitude: number;
  longitude: number;
  /** Short tooltip text — subjects and area; tutor name for tutors. */
  label: string;
}
