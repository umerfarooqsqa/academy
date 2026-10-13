"use client";

// Public, unauthenticated (CLAUDE.md Section 7). Free-tier tutors browse this
// and self-initiate a WhatsApp message referencing the OPP-XXXX code (6.5) —
// no parent contact info is ever shown here.
//
// 2026-10-13 feature: "Use my location" — browser geolocation, distance
// computed client-side via the same Haversine function the matching engine
// already uses (lib/matching/engine.ts#haversineKm) against each
// opportunity's AreaZone coordinates (the same data admin manages via /zones
// and /heatmap — resolved server-side in lib/opportunities/digest.ts). No new
// geocoding service, no map library — just a distance number and a sort.

import { useMemo, useState } from "react";
import { SUBJECT_GROUP_LABELS, type SubjectGroup } from "@/lib/subjectGroups";
import { formatOpportunityCopyText, formatFullDigestText, type OpportunityListing } from "@/lib/opportunities/formatText";
import { haversineKm } from "@/lib/matching/engine";
import { badge } from "@/app/components/ui";

// Local "sticker" styles matching the rest of the public site's 2026-10-13
// redesign, not the shared admin card/btnPrimary/btnSecondary.
const card = "rounded-3xl border-2 border-gray-900 bg-white p-5 shadow-[4px_4px_0_0_#1f2937]";
const btnPrimary =
  "rounded-full border-2 border-gray-900 bg-rose-500 px-4 py-2 text-sm font-bold text-white shadow-[3px_3px_0_0_#1f2937] transition hover:-translate-y-0.5 active:translate-y-0 active:shadow-none";
const btnSecondary =
  "rounded-full border-2 border-gray-900 bg-white px-4 py-2 text-sm font-bold text-gray-900 shadow-[3px_3px_0_0_#1f2937] transition hover:-translate-y-0.5 active:translate-y-0 active:shadow-none";

async function copy(text: string, onDone: () => void) {
  try {
    await navigator.clipboard.writeText(text);
    onDone();
  } catch {
    // Clipboard API can be unavailable (older browser, insecure context) — the
    // text is still visible on the card for a manual select-and-copy.
  }
}

type ListingWithDistance = OpportunityListing & { distanceKm?: number };

export default function OpportunitiesClient({ listings }: { listings: OpportunityListing[] }) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  function useMyLocation() {
    if (!("geolocation" in navigator)) {
      setLocationError("Your browser doesn't support location — try a different device.");
      return;
    }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        setLocationError(
          err.code === err.PERMISSION_DENIED
            ? "Location access was denied — you can still browse without it."
            : "Couldn't get your location — please try again.",
        );
      },
      { enableHighAccuracy: false, timeout: 10_000 },
    );
  }

  const sortedListings = useMemo<ListingWithDistance[]>(() => {
    if (!userLocation) return listings;
    const withDistance: ListingWithDistance[] = listings.map((l) =>
      l.latitude != null && l.longitude != null
        ? { ...l, distanceKm: haversineKm(userLocation.lat, userLocation.lon, l.latitude, l.longitude) }
        : l,
    );
    return withDistance.sort((a, b) => {
      if (a.distanceKm == null) return 1;
      if (b.distanceKm == null) return -1;
      return a.distanceKm - b.distanceKm;
    });
  }, [listings, userLocation]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-500">{listings.length} open opportunit{listings.length === 1 ? "y" : "ies"}</p>
        <div className="flex flex-wrap gap-2">
          {!userLocation && (
            <button className={btnSecondary} disabled={locating} onClick={useMyLocation}>
              {locating ? "Locating…" : "📍 Use my location"}
            </button>
          )}
          {userLocation && <span className={badge("blue")}>Sorted by distance from you</span>}
          {listings.length > 0 && (
            <button
              className={btnSecondary}
              onClick={() =>
                copy(formatFullDigestText(listings), () => {
                  setCopiedAll(true);
                  setTimeout(() => setCopiedAll(false), 2000);
                })
              }
            >
              {copiedAll ? "Copied!" : "Copy all as digest"}
            </button>
          )}
        </div>
      </div>
      {locationError && <p className="mt-2 text-sm text-amber-700">{locationError}</p>}

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sortedListings.map((l) => (
          <div key={l.opportunityCode} className={card}>
            <div className="flex items-center justify-between">
              <span className={badge("blue")}>{l.opportunityCode}</span>
              <span className="text-xs text-gray-500">{SUBJECT_GROUP_LABELS[l.subjectGroup as SubjectGroup] ?? l.subjectGroup}</span>
            </div>
            <p className="mt-2 text-sm font-bold text-gray-900">{l.subjects.join(", ") || "Tutor needed"}</p>
            <p className="mt-1 text-xs text-gray-500">
              {l.area} · {l.curriculum}
            </p>
            {l.distanceKm != null && (
              <p className="mt-1 text-xs font-bold text-rose-600">~{l.distanceKm.toFixed(1)} km away</p>
            )}
            <button
              className={`${btnPrimary} mt-3 w-full`}
              onClick={() =>
                copy(formatOpportunityCopyText(l), () => {
                  setCopiedCode(l.opportunityCode);
                  setTimeout(() => setCopiedCode(null), 2000);
                })
              }
            >
              {copiedCode === l.opportunityCode ? "Copied!" : "Copy"}
            </button>
          </div>
        ))}
        {listings.length === 0 && (
          <p className="text-sm text-gray-500">No open opportunities right now — check back soon!</p>
        )}
      </div>
    </div>
  );
}
