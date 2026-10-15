// A featured tutor's card (homepage "Featured tutors" + /our-tutors) and the
// shared avatar / badges / delivery label (2026-10-15). Public fields only —
// see lib/tutors/publicProfile.ts.

import Link from "next/link";
import { SUBJECT_GROUP_LABELS, type SubjectGroup } from "@/lib/subjectGroups";
import type { PublicTutorProfile } from "@/lib/tutors/publicProfile";
import { BadgeCheckIcon, PinIcon, StarIcon } from "../icons";
import { cardHover } from "../ui";

export function deliveryLabel(mode: string): string {
  return mode === "online" ? "Online" : mode === "both" ? "Home & online" : "Home tuition";
}

export function groupLabel(g: string): string {
  return SUBJECT_GROUP_LABELS[g as SubjectGroup] ?? g;
}

export function TutorAvatar({ tutor, size = "h-16 w-16 text-xl" }: { tutor: PublicTutorProfile; size?: string }) {
  if (tutor.photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={tutor.photoUrl} alt={tutor.displayName} className={`${size} shrink-0 rounded-full object-cover ring-2 ring-white`} />;
  }
  const initials = tutor.displayName
    .split(" ")
    .map((p) => p.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div aria-hidden className={`${size} flex shrink-0 items-center justify-center rounded-full bg-rose-100 font-heading font-semibold text-rose-700 ring-2 ring-white`}>
      {initials}
    </div>
  );
}

export function VerifiedBadges({ tutor }: { tutor: PublicTutorProfile }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
        <BadgeCheckIcon className="h-3.5 w-3.5" /> ID verified
      </span>
      {tutor.gradesVerified && (
        <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700 ring-1 ring-inset ring-sky-200">
          <BadgeCheckIcon className="h-3.5 w-3.5" /> Grades verified
        </span>
      )}
    </div>
  );
}

export function RatingLine({ tutor }: { tutor: PublicTutorProfile }) {
  if (tutor.rating == null) return null;
  return (
    <span className="inline-flex items-center gap-1 text-sm font-medium text-slate-700">
      <StarIcon className="h-4 w-4 text-amber-400" />
      {tutor.rating.toFixed(1)} <span className="font-normal text-slate-500">({tutor.ratingCount})</span>
    </span>
  );
}

export default function TutorCard({ tutor }: { tutor: PublicTutorProfile }) {
  return (
    <Link href={`/our-tutors/${tutor.id}`} className={`${cardHover} flex flex-col`}>
      <div className="flex items-start gap-4">
        <TutorAvatar tutor={tutor} />
        <div className="min-w-0">
          <h3 className="font-heading text-lg font-semibold text-slate-900">{tutor.displayName}</h3>
          <p className="mt-0.5 line-clamp-2 text-sm text-slate-600">{tutor.headline ?? tutor.qualification}</p>
          <div className="mt-1.5">
            <RatingLine tutor={tutor} />
          </div>
        </div>
      </div>
      <div className="mt-4">
        <VerifiedBadges tutor={tutor} />
      </div>
      <ul className="mt-4 flex flex-wrap gap-1.5">
        {tutor.subjects.slice(0, 5).map((s) => (
          <li key={s} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
            {s}
          </li>
        ))}
      </ul>
      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-100 pt-4 text-sm text-slate-600">
        <span className="inline-flex items-center gap-1">
          <PinIcon className="h-4 w-4 text-slate-400" />
          {tutor.area}
        </span>
        <span>{deliveryLabel(tutor.deliveryMode)}</span>
        {tutor.yearsExperience != null && tutor.yearsExperience > 0 && (
          <span>
            {tutor.yearsExperience} yr{tutor.yearsExperience === 1 ? "" : "s"} experience
          </span>
        )}
      </div>
    </Link>
  );
}
