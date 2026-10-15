// Public, unauthenticated (2026-10-13 public website feature). Parent request
// form where Lili asks one question at a time (2026-10-14) — submits straight
// into the same ParentRequest pipeline every other intake path uses (see
// app/api/public/parent-request/route.ts). Nav header/footer come from this
// route group's layout.tsx.
//
// 2026-10-15: `?group=<subjectGroup>` (from /subjects) preselects the
// category; `?tutor=<id>` (from a featured tutor's "Request this tutor")
// names that tutor and preselects their category — only for a tutor who is
// currently featured and verified. SEO landing pages (2026-10-15) link here
// with `?area=<zone name>` (area pages) and `?mode=online` (/online-tuition)
// to pre-fill those answers — still editable like any other answer.

import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import FindATutorForm from "./FindATutorForm";
import { getVerifiedTutorCounts } from "@/lib/tutors/verified";
import { getPublicTutorProfile } from "@/lib/tutors/publicProfile";
import { SUBJECT_GROUPS } from "@/lib/subjectGroups";
import { CheckIcon } from "../icons";
import { checkDot, container, eyebrow } from "../ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: "/find-a-tutor" },
  title: "Find a Tutor in Karachi or Online",
  description: "Tell us what you need and we'll match you with ID-checked tutors from your own area. Your first demo class is free.",
};

export default async function FindATutorPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string; tutor?: string; area?: string; mode?: string }>;
}) {
  const { group, tutor, area, mode } = await searchParams;
  const [zones, tutorCounts, requested] = await Promise.all([
    prisma.areaZone.findMany({
      select: { name: true, latitude: true, longitude: true, maxKm: true },
      orderBy: { name: "asc" },
    }),
    getVerifiedTutorCounts(),
    typeof tutor === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(tutor) ? getPublicTutorProfile(tutor) : Promise.resolve(null),
  ]);
  const initialGroup = requested?.subjectGroup ?? (SUBJECT_GROUPS.includes(group as never) ? group : undefined);
  // Only a real zone name is accepted for the pre-filled area.
  const initialArea = typeof area === "string" ? zones.find((z) => z.name.toLowerCase() === area.trim().toLowerCase())?.name : undefined;
  const initialMode = mode === "online" ? "online" : undefined;

  return (
    <div className="bg-gradient-to-b from-rose-50/70 to-white">
      <div className={`${container} max-w-2xl py-12 sm:py-16`}>
        <div className="text-center">
          <p className={eyebrow}>Find a tutor</p>
          <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {requested ? `Request ${requested.displayName}` : "Find a tutor in Karachi or online"}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-base text-slate-600">
            Answer a few quick questions and we&apos;ll match you with a short list of great tutors from your own area.
          </p>
          <ul className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-slate-700">
            {["Free demo class", "ID-checked tutors", "Takes 2 minutes"].map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <span className={checkDot}>
                  <CheckIcon />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <FindATutorForm
          zones={zones}
          tutorCounts={tutorCounts}
          initialGroup={initialGroup}
          initialArea={initialArea}
          initialMode={initialMode}
          requestedTutor={requested ? { id: requested.id, name: requested.displayName } : undefined}
        />
      </div>
    </div>
  );
}
