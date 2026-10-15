// Google Business rating + reviews for the public homepage (2026-10-15 —
// operator decision: live from Google's Places API (New), with a billing
// account on file but usage kept inside the free monthly allowance).
//
// One Place Details call per day at most: the result is cached in
// SystemState["google_reviews"] and only refreshed when it's over a day old
// (or the Place ID changed). If Google is slow or failing, the last cached
// copy is shown; with nothing cached the section simply doesn't render.
//
// Needs: GOOGLE_PLACES_API_KEY (secret) and the Place ID, set in
// /website-content (SiteContent.googlePlaceId). Plain fetch, no SDK.

import { prisma } from "@/lib/db";
import { getSiteContent } from "@/lib/siteContent";

const STATE_KEY = "google_reviews";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;
const FIELDS = "rating,userRatingCount,reviews,googleMapsUri,googleMapsLinks";

export interface GoogleReview {
  author: string;
  authorUrl?: string;
  photoUrl?: string;
  rating: number;
  text: string;
  when: string; // e.g. "2 weeks ago"
}

export interface GoogleReviewsData {
  placeId: string;
  fetchedAt: string;
  rating: number | null;
  count: number;
  mapsUrl?: string;
  writeReviewUrl?: string;
  reviews: GoogleReview[];
}

/** Maps a Places API (New) Place Details response to what the page shows. Pure. */
export function parsePlaceResponse(placeId: string, json: any, now: Date = new Date()): GoogleReviewsData {
  const reviews: GoogleReview[] = (Array.isArray(json?.reviews) ? json.reviews : [])
    .map((r: any) => ({
      author: r?.authorAttribution?.displayName ?? "Google user",
      authorUrl: r?.authorAttribution?.uri,
      photoUrl: r?.authorAttribution?.photoUri,
      rating: Number(r?.rating) || 0,
      text: (r?.text?.text ?? r?.originalText?.text ?? "").trim(),
      when: r?.relativePublishTimeDescription ?? "",
    }))
    .filter((r: GoogleReview) => r.text && r.rating >= 4); // show the good, written ones
  return {
    placeId,
    fetchedAt: now.toISOString(),
    rating: typeof json?.rating === "number" ? json.rating : null,
    count: Number(json?.userRatingCount) || 0,
    mapsUrl: json?.googleMapsUri,
    writeReviewUrl: json?.googleMapsLinks?.writeAReviewUri,
    reviews,
  };
}

async function readCache(): Promise<GoogleReviewsData | null> {
  const row = await prisma.systemState.findUnique({ where: { key: STATE_KEY } });
  if (!row) return null;
  try {
    return JSON.parse(row.value) as GoogleReviewsData;
  } catch {
    return null;
  }
}

export async function getGoogleReviews(now: Date = new Date()): Promise<GoogleReviewsData | null> {
  const placeId = (await getSiteContent()).googlePlaceId?.trim();
  if (!placeId) return null;
  const cached = await readCache();
  const usable = cached && cached.placeId === placeId ? cached : null;
  if (usable && now.getTime() - new Date(usable.fetchedAt).getTime() < MAX_AGE_MS) return usable;

  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return usable;
  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
      headers: { "X-Goog-Api-Key": key, "X-Goog-FieldMask": FIELDS },
      signal: AbortSignal.timeout(4000),
    });
    const json = await res.json();
    if (!res.ok) {
      console.warn(`[google-reviews] Places API ${res.status}: ${json?.error?.message ?? "unknown error"}`);
      return usable;
    }
    const data = parsePlaceResponse(placeId, json, now);
    const value = JSON.stringify(data);
    await prisma.systemState.upsert({ where: { key: STATE_KEY }, create: { key: STATE_KEY, value }, update: { value } });
    return data;
  } catch (err) {
    console.warn("[google-reviews] fetch failed:", (err as Error).message);
    return usable;
  }
}
