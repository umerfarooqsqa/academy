"use client";

// Homepage widget (2026-10-13): a single button that asks for location
// access and reports exactly how many open tuitions are nearby and how far
// each one is — directly on the front page, not buried on a separate
// /opportunities page nobody has a reason to find. Fetches the same public
// GET /api/opportunities data (CLAUDE.md Section 8), computes distance
// client-side with the same Haversine function the matching engine already
// uses (lib/matching/engine.ts#haversineKm) against each opportunity's
// AreaZone coordinates. No new geocoding service, no map library, opt-in
// only (geolocation is never requested without this button being clicked).

import { useState } from "react";
import Link from "next/link";
import { haversineKm } from "@/lib/matching/engine";
import type { OpportunityListing } from "@/lib/opportunities/formatText";

type NearbyListing = OpportunityListing & { distanceKm: number };
type Status = "idle" | "locating" | "loading" | "done" | "error";

export default function NearbyOpportunitiesWidget() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [nearby, setNearby] = useState<NearbyListing[]>([]);

  function findNearby() {
    if (!("geolocation" in navigator)) {
      setStatus("error");
      setError("Your browser doesn't support location — try a different device.");
      return;
    }
    setStatus("locating");
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setStatus("loading");
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch("/api/opportunities");
          const data = (await res.json()) as { opportunities: OpportunityListing[] };
          const withDistance: NearbyListing[] = data.opportunities
            .filter((l): l is OpportunityListing & { latitude: number; longitude: number } => l.latitude != null && l.longitude != null)
            .map((l) => ({ ...l, distanceKm: haversineKm(latitude, longitude, l.latitude, l.longitude) }))
            .sort((a, b) => a.distanceKm - b.distanceKm);
          setNearby(withDistance);
          setStatus("done");
        } catch {
          setStatus("error");
          setError("Couldn't load opportunities right now — please try again.");
        }
      },
      (err) => {
        setStatus("error");
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Location access was denied — you can still browse all opportunities below."
            : "Couldn't get your location — please try again.",
        );
      },
      { enableHighAccuracy: false, timeout: 10_000 },
    );
  }

  return (
    <div className="rounded-3xl border-2 border-gray-900 bg-white p-8 text-center shadow-[5px_5px_0_0_#1f2937]">
      <h3 className="font-heading text-2xl font-extrabold text-gray-900">Tutors: see tuitions near you</h3>
      <p className="mx-auto mt-2 max-w-md text-base text-gray-600">
        Tap the button, share your location, and we&apos;ll tell you exactly how many open tuitions are near you and
        how far each one is.
      </p>

      {(status === "idle" || status === "error") && (
        <button
          onClick={findNearby}
          className="mt-6 rounded-full border-2 border-gray-900 bg-teal-400 px-7 py-3.5 text-base font-bold text-gray-900 shadow-[4px_4px_0_0_#1f2937] transition hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_#1f2937] active:translate-y-0 active:shadow-none"
        >
          📍 See tuitions near you
        </button>
      )}

      {(status === "locating" || status === "loading") && (
        <p className="mt-6 text-sm font-semibold text-gray-500">
          {status === "locating" ? "Getting your location…" : "Finding nearby tuitions…"}
        </p>
      )}

      {status === "error" && error && <p className="mt-4 text-sm font-semibold text-amber-700">{error}</p>}

      {status === "done" && (
        <div className="mt-6 text-left">
          <p className="text-center font-heading text-lg font-extrabold text-gray-900">
            {nearby.length === 0
              ? "No open tuitions near you right now — check back soon!"
              : `🎉 ${nearby.length} tuition${nearby.length === 1 ? "" : "s"} found near you`}
          </p>
          {nearby.length > 0 && (
            <ul className="mt-4 flex flex-col gap-2">
              {nearby.slice(0, 5).map((l) => (
                <li
                  key={l.opportunityCode}
                  className="flex items-center justify-between gap-3 rounded-xl border-2 border-gray-900 bg-amber-50 px-4 py-2.5"
                >
                  <span className="text-sm font-semibold text-gray-800">
                    {l.subjects.join(", ") || "Tutor needed"} · {l.area}
                  </span>
                  <span className="whitespace-nowrap text-sm font-extrabold text-rose-600">
                    ~{l.distanceKm.toFixed(1)} km
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-5 text-center">
            <Link href="/opportunities" className="text-sm font-bold text-gray-900 underline decoration-teal-500 decoration-4 underline-offset-4 hover:text-rose-600">
              {nearby.length > 5 ? `See all ${nearby.length} opportunities →` : "Browse all opportunities →"}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
