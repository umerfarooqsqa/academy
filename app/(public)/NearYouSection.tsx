"use client";

// Homepage "What's near you?" (2026-10-14 — replaces NearbyOpportunitiesWidget).
// One opt-in location tap fills two cards:
//   - parents: how many VERIFIED tutors are near (lib/tutors/verified.ts —
//     active + CNIC checked by an admin), from per-zone counts only
//   - tutors: how many open tuitions are near (lib/opportunities/nearby.ts)
// "Near" is the same within-the-zone's-maxKm rule used everywhere. Both
// calculations run in the browser — the visitor's location never leaves the
// device, and no individual tutor or parent data is involved.

import { useState } from "react";
import Link from "next/link";
import { SUBJECT_GROUP_LABELS, type SubjectGroup } from "@/lib/subjectGroups";
import type { OpportunityListing } from "@/lib/opportunities/formatText";
import { nearbyStatus } from "@/lib/opportunities/nearby";
import { verifiedNear, type ZoneTutorCount } from "@/lib/tutors/nearbyCounts";
import { primaryClass } from "./liliStyles";

const cardClass = "flex flex-col rounded-3xl border-2 border-gray-900 p-7 shadow-[5px_5px_0_0_#1f2937]";
const ctaClass =
  "mt-6 self-start rounded-full border-2 border-gray-900 bg-white px-5 py-2.5 text-sm font-bold text-gray-900 shadow-[3px_3px_0_0_#1f2937] transition hover:-translate-y-0.5 active:translate-y-0 active:shadow-none";

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

export default function NearYouSection({ listings, tutorCounts }: { listings: OpportunityListing[]; tutorCounts: ZoneTutorCount[] }) {
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function checkMyArea() {
    if (!("geolocation" in navigator)) {
      setError("Your browser can't share location — try a different device.");
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        setError(
          err.code === err.PERMISSION_DENIED
            ? "No problem — you can still find a tutor or browse all tuitions below."
            : "Couldn't get your location — please try again.",
        );
      },
      { enableHighAccuracy: false, timeout: 10_000 },
    );
  }

  const totalVerified = tutorCounts.reduce((n, z) => n + z.verified, 0);
  const tutorsNear = location ? verifiedNear(tutorCounts, location.lat, location.lon) : null;
  const topGroups = tutorsNear
    ? Object.entries(tutorsNear.bySubjectGroup)
        .filter(([, n]) => n > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
    : [];

  const tuitionsNear = location
    ? listings
        .map((l) => ({ ...l, ...nearbyStatus(l, location.lat, location.lon) }))
        .filter((l) => l.near)
        .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))
    : [];

  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-24">
      <div className="text-center">
        <h2 className="font-heading text-3xl font-extrabold text-gray-900 sm:text-4xl">What&apos;s near you?</h2>
        <p className="mx-auto mt-2 max-w-md text-base text-gray-600">One tap — your location stays on your phone.</p>
        {!location && (
          <button type="button" className={`${primaryClass} mt-5`} onClick={checkMyArea} disabled={locating}>
            {locating ? "Finding you…" : "📍 Check my area"}
          </button>
        )}
        {error && <p className="mt-3 text-sm font-semibold text-amber-700">{error}</p>}
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Parents */}
        <div className={`${cardClass} rotate-[-0.5deg] bg-amber-100`}>
          <p className="font-heading text-xs font-extrabold uppercase tracking-wider text-amber-700">For parents</p>
          <h3 className="mt-1 font-heading text-2xl font-extrabold text-gray-900">Verified tutors near you</h3>
          {tutorsNear ? (
            tutorsNear.total > 0 ? (
              <>
                <p className="mt-4 text-lg text-gray-800">
                  <span className="font-heading text-4xl font-extrabold text-gray-900">{tutorsNear.total}</span>{" "}
                  verified tutor{tutorsNear.total === 1 ? "" : "s"} near {tutorsNear.nearestZone}
                </p>
                <p className="mt-1 text-sm text-gray-600">Every one ID-checked by our team.</p>
                {topGroups.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {topGroups.map(([g, n]) => (
                      <span key={g} className="rounded-full border-2 border-gray-900 bg-white px-3 py-1 text-xs font-bold text-gray-900">
                        {SUBJECT_GROUP_LABELS[g as SubjectGroup] ?? g} · {n}
                      </span>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="mt-4 text-base text-gray-700">
                We&apos;re growing in your area — tell us what you need and we&apos;ll find you the best match.
              </p>
            )
          ) : (
            <p className="mt-4 text-base text-gray-700">
              {totalVerified > 0 && <strong>{plural(totalVerified, "verified tutor", "verified tutors")} and growing. </strong>}
              Every tutor is ID-checked by our team, and we only match you with tutors from your own area.
            </p>
          )}
          <Link href="/find-a-tutor" className={`${ctaClass} mt-auto`}>
            Find a tutor →
          </Link>
        </div>

        {/* Tutors */}
        <div className={`${cardClass} rotate-[0.5deg] bg-teal-100`}>
          <p className="font-heading text-xs font-extrabold uppercase tracking-wider text-teal-700">For tutors</p>
          <h3 className="mt-1 font-heading text-2xl font-extrabold text-gray-900">Tuitions near you</h3>
          {location ? (
            tuitionsNear.length > 0 ? (
              <>
                <p className="mt-4 text-lg text-gray-800">
                  <span className="font-heading text-4xl font-extrabold text-gray-900">{tuitionsNear.length}</span> open
                  tuition{tuitionsNear.length === 1 ? "" : "s"} near you
                </p>
                <ul className="mt-3 space-y-1.5">
                  {tuitionsNear.slice(0, 3).map((l) => (
                    <li key={l.opportunityCode} className="text-sm text-gray-800">
                      <span className="font-bold">{l.subjects.join(", ") || "Tutor needed"}</span> ·{" "}
                      {l.deliveryMode === "online" ? "Online" : l.area}
                      {l.distanceKm != null && <span className="text-rose-600"> · ~{l.distanceKm.toFixed(1)} km</span>}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="mt-4 text-base text-gray-700">
                Nothing near you right now — register and we&apos;ll match you as soon as one comes in.
              </p>
            )
          ) : (
            <p className="mt-4 text-base text-gray-700">
              {listings.length > 0 ? `${plural(listings.length, "student is", "students are")} looking for a tutor right now. ` : ""}
              Get matched with students close to you — save on travel time and fuel.
            </p>
          )}
          <Link href={location && tuitionsNear.length === 0 ? "/become-a-tutor" : "/opportunities"} className={`${ctaClass} mt-auto`}>
            {location && tuitionsNear.length === 0 ? "Become a tutor →" : "See tuitions →"}
          </Link>
        </div>
      </div>
    </section>
  );
}
