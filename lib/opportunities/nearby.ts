// What "near you" means for an open opportunity (2026-10-14) — pure, so the
// browser can run it against the tutor's own location without sending it
// anywhere. Same rule as the matching engine's Tier B and the Lili form's
// location step: within the opportunity zone's own maxKm of its centroid.
// Online requests are near everyone; "both" (in-person or online) too, since
// the tutor can always take it online.

import { haversineKm } from "@/lib/matching/engine";
import type { OpportunityListing } from "@/lib/opportunities/formatText";

export interface NearbyResult {
  near: boolean;
  /** Undefined for online-only requests or listings without zone coordinates. */
  distanceKm?: number;
}

export function nearbyStatus(listing: OpportunityListing, lat: number, lon: number): NearbyResult {
  const distanceKm =
    listing.deliveryMode !== "online" && listing.latitude != null && listing.longitude != null
      ? haversineKm(lat, lon, listing.latitude, listing.longitude)
      : undefined;
  if (listing.deliveryMode === "online" || listing.deliveryMode === "both") return { near: true, distanceKm };
  if (distanceKm == null || listing.maxKm == null) return { near: false };
  return { near: distanceKm <= listing.maxKm, distanceKm };
}
