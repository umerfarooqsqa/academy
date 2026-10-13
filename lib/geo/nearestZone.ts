// Resolves a precise coordinate (e.g. from a shared Google Maps location
// link, see lib/geo/googleMapsLink.ts) to the nearest known AreaZone, as an
// alternative to the LLM's/person's free-text area guess. Reuses the same
// Haversine function the matching engine already uses (lib/matching/engine.ts)
// — no new distance math.

import { prisma } from "@/lib/db";
import { haversineKm } from "@/lib/matching/engine";
import type { AreaZone } from "@prisma/client";

/** Returns the AreaZone whose centroid is closest to (lat, lon), or null if
 * no zones exist yet. No maxKm cutoff here — the nearest zone is still the
 * right zone even if it's far away in a sparse area; maxKm stays the matching
 * engine's Tier B concern (6.3 Step 2), untouched by this lookup. */
export async function findNearestZone(lat: number, lon: number): Promise<AreaZone | null> {
  const zones = await prisma.areaZone.findMany();
  if (zones.length === 0) return null;

  let nearest = zones[0];
  let nearestDistance = haversineKm(lat, lon, nearest.latitude, nearest.longitude);
  for (const zone of zones.slice(1)) {
    const distance = haversineKm(lat, lon, zone.latitude, zone.longitude);
    if (distance < nearestDistance) {
      nearest = zone;
      nearestDistance = distance;
    }
  }
  return nearest;
}
