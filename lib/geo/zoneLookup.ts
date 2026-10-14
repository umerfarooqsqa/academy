// Pure nearest-zone math, shared by the server (lib/geo/nearestZone.ts,
// lib/intake/persist.ts) and the browser (the Lili chat's "Share my location"
// step, app/(public)/LocationStep.tsx). No Prisma import, so it's safe to
// bundle client-side. Reuses the matching engine's Haversine function — no
// new distance math.
//
// 2026-10-14 decision (operator): a shared location farther than the nearest
// zone's own maxKm is "outside all zones" — it is NOT snapped to that zone.
// The person picks an area instead and the record is flagged for review, so a
// far-away location can never silently become a same-zone hard-filter match
// (the North Nazimabad/Malir failure, CLAUDE.md Section 1).

import { haversineKm } from "@/lib/matching/engine";

export interface ZonePoint {
  name: string;
  latitude: number;
  longitude: number;
  maxKm: number;
}

export interface NearestZoneResult<Z extends ZonePoint> {
  zone: Z;
  distanceKm: number;
  /** distanceKm <= zone.maxKm */
  inRange: boolean;
}

/** The zone whose centroid is closest to (lat, lon), with whether that
 * distance is within the zone's own maxKm. Null when there are no zones. */
export function nearestZoneWithin<Z extends ZonePoint>(lat: number, lon: number, zones: Z[]): NearestZoneResult<Z> | null {
  let best: NearestZoneResult<Z> | null = null;
  for (const zone of zones) {
    const distanceKm = haversineKm(lat, lon, zone.latitude, zone.longitude);
    if (!best || distanceKm < best.distanceKm) best = { zone, distanceKm, inRange: false };
  }
  if (best) best.inRange = best.distanceKm <= best.zone.maxKm;
  return best;
}

/** Case-insensitive match of a typed area/landmark against zone names:
 * exact first, then either one containing the other. Null when nothing
 * matches — the typed text is then stored as-is and flagged for the operator
 * (lib/intake/persist.ts). */
export function matchZoneByName<Z extends { name: string }>(text: string, zones: Z[]): Z | null {
  const a = text.toLowerCase().trim();
  if (!a) return null;
  return (
    zones.find((z) => z.name.toLowerCase() === a) ??
    zones.find((z) => a.includes(z.name.toLowerCase()) || z.name.toLowerCase().includes(a)) ??
    null
  );
}

/** Parses an untrusted latitude/longitude pair (JSON numbers or FormData
 * strings). Returns null unless both are finite and within valid ranges. */
export function parseCoordPair(rawLat: unknown, rawLon: unknown): { latitude: number; longitude: number } | null {
  const toNumber = (v: unknown) =>
    typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
  const latitude = toNumber(rawLat);
  const longitude = toNumber(rawLon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  return { latitude, longitude };
}
