"use client";

// Homepage "What's near you?" (2026-10-14; location handling shared with
// /opportunities via useNearMe/NearMeControls). One opt-in location tap fills
// both cards:
//   - parents: how many VERIFIED tutors are near (lib/tutors/verified.ts —
//     active + CNIC checked by an admin), from per-zone counts only
//   - tutors: how many open tuitions are near (lib/opportunities/nearby.ts)
// "Near" is the same within-the-zone's-maxKm rule used everywhere. Both
// calculations run in the browser — the visitor's location never leaves the
// device, and no individual tutor or parent data is involved.
// 2026-10-15: restyled for the professional redesign (the pitch text moved
// to the homepage's "Why families choose us" and tutor call-out sections).

import Link from "next/link";
import { SUBJECT_GROUP_LABELS, type SubjectGroup } from "@/lib/subjectGroups";
import type { OpportunityListing } from "@/lib/opportunities/formatText";
import { nearbyStatus } from "@/lib/opportunities/nearby";
import { verifiedNear, type ZoneTutorCount } from "@/lib/tutors/nearbyCounts";
import { useNearMe } from "./useNearMe";
import NearMeControls from "./NearMeControls";
import { SectionHeading } from "./sections";
import { ArrowRightIcon, BriefcaseIcon, ShieldIcon } from "./icons";
import { card, container, sectionY } from "./ui";

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

export default function NearYouSection({
  listings,
  tutorCounts,
}: {
  listings: OpportunityListing[];
  tutorCounts: ZoneTutorCount[];
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
    <section className={`${container} ${sectionY}`}>
      <SectionHeading
        kicker="Near you"
        title="What's near you?"
        intro="One tap shows the verified tutors and open tuitions in your area — your location stays on your phone."
      />
      <div className="text-center">
        <NearMeControls
          nearMe={nearMe}
          areas={areas}
          buttonLabel="📍 Check my area"
          locatedLabel={`Showing what's near ${location?.pickedArea ?? tutorsNear?.nearestZone ?? "you"}`}
        />
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Parents */}
        <div className={`${card} flex flex-col p-7`}>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <ShieldIcon className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">For parents</p>
              <h3 className="font-heading text-xl font-semibold text-slate-900">Verified tutors near you</h3>
            </div>
          </div>
          {tutorsNear ? (
            tutorsNear.total > 0 ? (
              <>
                <p className="mt-5 text-base text-slate-700">
                  <span className="font-heading text-4xl font-bold text-slate-900">{tutorsNear.total}</span>{" "}
                  verified tutor{tutorsNear.total === 1 ? "" : "s"} near {tutorsNear.nearestZone}
                </p>
                <p className="mt-1 text-sm text-slate-500">Every one ID-checked by our team.</p>
                {topGroups.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {topGroups.map(([g, n]) => (
                      <span key={g} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                        {SUBJECT_GROUP_LABELS[g as SubjectGroup] ?? g} · {n}
                      </span>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="mt-5 text-base leading-relaxed text-slate-600">
                We&apos;re growing in {tutorsNear.nearestZone ?? "your area"} — tell us what you need and we&apos;ll find
                you the best match.
              </p>
            )
          ) : (
            <p className="mt-5 text-base leading-relaxed text-slate-600">
              {totalVerified > 0
                ? `${plural(totalVerified, "verified tutor", "verified tutors")} and growing — every one ID-checked by our team.`
                : "Every tutor is ID-checked by our team before they're ever suggested to you."}
            </p>
          )}
          <Link href="/find-a-tutor" className="mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-semibold text-rose-600 hover:text-rose-700">
            Find a tutor <ArrowRightIcon />
          </Link>
        </div>

        {/* Tutors */}
        <div className={`${card} flex flex-col p-7`}>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
              <BriefcaseIcon className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">For tutors</p>
              <h3 className="font-heading text-xl font-semibold text-slate-900">Tuitions near you</h3>
            </div>
          </div>
          {location ? (
            tuitionsNear.length > 0 ? (
              <>
                <p className="mt-5 text-base text-slate-700">
                  <span className="font-heading text-4xl font-bold text-slate-900">{tuitionsNear.length}</span> open
                  tuition{tuitionsNear.length === 1 ? "" : "s"} near you
                </p>
                <ul className="mt-3 divide-y divide-slate-100">
                  {tuitionsNear.slice(0, 3).map((l) => (
                    <li key={l.opportunityCode} className="flex justify-between gap-3 py-2 text-sm">
                      <span className="truncate font-medium text-slate-800">{l.subjects.join(", ") || "Tutor needed"}</span>
                      <span className="shrink-0 text-slate-500">
                        {l.deliveryMode === "online" ? "Online" : l.area}
                        {l.distanceKm != null && ` · ~${l.distanceKm.toFixed(1)} km`}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="mt-5 text-base leading-relaxed text-slate-600">
                Nothing near you right now — register and we&apos;ll match you as soon as one comes in.
              </p>
            )
          ) : (
            <p className="mt-5 text-base leading-relaxed text-slate-600">
              {listings.length > 0
                ? `${plural(listings.length, "student is", "students are")} looking for a tutor right now.`
                : "Register once and we'll match you with students close to you."}
            </p>
          )}
          <Link
            href={location && tuitionsNear.length === 0 ? "/become-a-tutor" : "/opportunities"}
            className="mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-semibold text-rose-600 hover:text-rose-700"
          >
            {location && tuitionsNear.length === 0 ? "Become a tutor" : "See tuition jobs"} <ArrowRightIcon />
          </Link>
        </div>
      </div>
    </section>
  );
}
