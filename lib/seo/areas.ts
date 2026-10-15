// Area landing pages, /tutors-in-karachi/<slug> (SEO, 2026-10-15) — one per
// AreaZone, so a zone added on /zones gets its page automatically. Pure.

import { haversineKm } from "@/lib/matching/engine";
import { slugify } from "@/lib/richText";

export interface ZoneLike {
  name: string;
  latitude: number;
  longitude: number;
  maxKm: number;
}

export const zoneSlug = (name: string) => slugify(name);

export function findZoneBySlug<Z extends ZoneLike>(zones: Z[], slug: string): Z | null {
  return zones.find((z) => zoneSlug(z.name) === slug) ?? null;
}

/** Every other zone with its distance from this one, nearest first. */
export function zonesByDistance<Z extends ZoneLike>(zone: ZoneLike, zones: Z[]): (Z & { km: number })[] {
  return zones
    .filter((z) => z.name !== zone.name)
    .map((z) => ({ ...z, km: haversineKm(zone.latitude, zone.longitude, z.latitude, z.longitude) }))
    .sort((a, b) => a.km - b.km);
}

/** Other zones whose centre is within this zone's own maxKm, nearest first. */
export function nearbyZones<Z extends ZoneLike>(zone: ZoneLike, zones: Z[]): (Z & { km: number })[] {
  return zones
    .filter((z) => z.name !== zone.name)
    .map((z) => ({ ...z, km: haversineKm(zone.latitude, zone.longitude, z.latitude, z.longitude) }))
    .filter((z) => z.km <= zone.maxKm)
    .sort((a, b) => a.km - b.km);
}

export const areaPath = (name: string) => `/tutors-in-karachi/${zoneSlug(name)}`;
