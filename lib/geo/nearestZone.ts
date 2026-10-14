// Resolves a precise coordinate (a shared Google Maps location link — see
// lib/geo/googleMapsLink.ts — or a browser "Share my location" tap on the
// public site) to the nearest known AreaZone. The distance math lives in
// lib/geo/zoneLookup.ts so the browser can run the same check.

import { prisma } from "@/lib/db";
import { nearestZoneWithin, type NearestZoneResult } from "@/lib/geo/zoneLookup";
import type { AreaZone } from "@prisma/client";

/** Returns the AreaZone whose centroid is closest to (lat, lon), its
 * distance, and whether it's within that zone's maxKm — or null if no zones
 * exist yet. Callers must treat `inRange: false` as "outside all zones", not
 * as a match (2026-10-14 decision, see zoneLookup.ts). */
export async function findNearestZone(lat: number, lon: number): Promise<NearestZoneResult<AreaZone> | null> {
  const zones = await prisma.areaZone.findMany();
  return nearestZoneWithin(lat, lon, zones);
}
