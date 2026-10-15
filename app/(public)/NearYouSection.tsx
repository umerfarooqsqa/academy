"use client";

// Homepage "For parents / For tutors" + "What's near you?" (2026-10-14 —
// location handling shared with /opportunities via useNearMe/NearMeControls,
// 2026-10-15: waiting hint, watchdog, clear errors, "or pick your area" —
// replaces NearbyOpportunitiesWidget, and merged with the separate parent /
// tutor pitch cards so the homepage has one pair of cards, not two). Each
// card shows its /website-content pitch text; one opt-in location tap then
// fills both cards:
//   - parents: how many VERIFIED tutors are near (lib/tutors/verified.ts —
//     active + CNIC checked by an admin), from per-zone counts only
//   - tutors: how many open tuitions are near (lib/opportunities/nearby.ts)
// "Near" is the same within-the-zone's-maxKm rule used everywhere. Both
// calculations run in the browser — the visitor's location never leaves the
// device, and no individual tutor or parent data is involved.

import Link from "next/link";
import { SUBJECT_GROUP_LABELS, type SubjectGroup } from "@/lib/subjectGroups";
import type { OpportunityListing } from "@/lib/opportunities/formatText";
import { nearbyStatus } from "@/lib/opportunities/nearby";
import { verifiedNear, type ZoneTutorCount } from "@/lib/tutors/nearbyCounts";
import { useNearMe } from "./useNearMe";
import NearMeControls from "./NearMeControls";

const cardClass = "flex flex-col rounded-3xl border-2 border-gray-900 p-7 shadow-[5px_5px_0_0_#1f2937]";
const ctaClass =
  "mt-6 self-start rounded-full border-2 border-gray-900 bg-white px-5 py-2.5 text-sm font-bold text-gray-900 shadow-[3px_3px_0_0_#1f2937] transition hover:-translate-y-0.5 active:translate-y-0 active:shadow-none";

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

export default function NearYouSection({
  listings,
  tutorCounts,
  parentPitch,
  tutorPitch,
  parentIcon,
  tutorIcon,
}: {
  listings: OpportunityListing[];
  tutorCounts: ZoneTutorCount[];
  parentPitch: string;
  tutorPitch: string;
  parentIcon: React.ReactNode;
  tutorIcon: React.ReactNode;
}) {
  const nearMe = useNearMe();
  const { location } = nearMe;
  const areas = tutorCounts.map((z) => ({ name: z.name, latitude: z.latitude, longitude: z.longitude }));

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
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="text-center">
        <h2 className="font-heading text-3xl font-extrabold text-gray-900 sm:text-4xl">What&apos;s near you?</h2>
        <p className="mx-auto mt-2 max-w-md text-base text-gray-600">
          One tap shows the verified tutors and open tuitions in your area — your location stays on your phone.
        </p>
        <NearMeControls
          nearMe={nearMe}
          areas={areas}
          buttonLabel="📍 Check my area"
          locatedLabel={`Showing what's near ${location?.pickedArea ?? tutorsNear?.nearestZone ?? "you"}`}
        />
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Parents */}
        <div className={`${cardClass} rotate-[-0.5deg] bg-amber-100`}>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-gray-900 bg-white text-amber-600">
              {parentIcon}
            </div>
            <div>
              <p className="font-heading text-xs font-extrabold uppercase tracking-wider text-amber-700">For parents</p>
              <h3 className="font-heading text-2xl font-extrabold leading-tight text-gray-900">Verified tutors near you</h3>
            </div>
          </div>
          <p className="mt-4 text-base leading-relaxed text-gray-700">{parentPitch}</p>
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
                No verified tutors near {tutorsNear.nearestZone ?? "you"} yet — we&apos;re growing fast. Tell us what you
                need and we&apos;ll find you the best match.
              </p>
            )
          ) : (
            <p className="mt-3 text-sm font-semibold text-gray-800">
              {totalVerified > 0 ? `✓ ${plural(totalVerified, "verified tutor", "verified tutors")} and growing — every one ID-checked by our team.` : "✓ Every tutor is ID-checked by our team."}
            </p>
          )}
          <Link href="/find-a-tutor" className={`${ctaClass} mt-auto`}>
            Find a tutor →
          </Link>
        </div>

        {/* Tutors */}
        <div className={`${cardClass} rotate-[0.5deg] bg-teal-100`}>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-gray-900 bg-white text-teal-600">
              {tutorIcon}
            </div>
            <div>
              <p className="font-heading text-xs font-extrabold uppercase tracking-wider text-teal-700">For tutors</p>
              <h3 className="font-heading text-2xl font-extrabold leading-tight text-gray-900">Tuitions near you</h3>
            </div>
          </div>
          <p className="mt-4 text-base leading-relaxed text-gray-700">{tutorPitch}</p>
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
            listings.length > 0 && (
              <p className="mt-3 text-sm font-semibold text-gray-800">
                📚 {plural(listings.length, "student is", "students are")} looking for a tutor right now.
              </p>
            )
          )}
          <Link href={location && tuitionsNear.length === 0 ? "/become-a-tutor" : "/opportunities"} className={`${ctaClass} mt-auto`}>
            {location && tuitionsNear.length === 0 ? "Become a tutor →" : "See tuitions →"}
          </Link>
        </div>
      </div>
    </section>
  );
}
