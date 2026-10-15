// Public /our-tutors — featured tutors (2026-10-15 operator request:
// "Upwork-style" profiles). Only tutors the admin marked Featured on
// /tutors/[id] AND verified (active + CNIC checked) — lib/tutors/publicProfile.ts.

import type { Metadata } from "next";
import Link from "next/link";
import { getFeaturedTutors } from "@/lib/tutors/publicProfile";
import { SUBJECT_GROUPS } from "@/lib/subjectGroups";
import { CtaBand, PageHeader } from "../sections";
import TutorCard, { groupLabel } from "./TutorCard";
import { btnPrimary, chip, chipActive, container } from "../ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: "/our-tutors" },
  title: "Our tutors",
  description: "Meet some of our ID-checked, grade-verified home and online tutors.",
};

export default async function OurTutorsPage({ searchParams }: { searchParams: Promise<{ group?: string }> }) {
  const { group } = await searchParams;
  const tutors = await getFeaturedTutors();
  const groups = SUBJECT_GROUPS.filter((g) => tutors.some((t) => t.subjectGroup === g));
  const active = group && groups.includes(group as (typeof groups)[number]) ? group : null;
  const shown = active ? tutors.filter((t) => t.subjectGroup === active) : tutors;

  return (
    <>
      <PageHeader
        kicker="Our tutors"
        title="Meet our tutors"
        intro="A few of the tutors on our team — every one ID-checked by us. Like someone? Request them, and your first demo class is free."
      />
      <section className={`${container} py-14 sm:py-20`}>
        {tutors.length === 0 ? (
          <div className="mx-auto max-w-lg text-center">
            <p className="text-lg text-slate-600">Our featured tutor profiles are coming soon.</p>
            <p className="mt-2 text-sm text-slate-500">
              In the meantime, tell us what you need and we&apos;ll hand-pick tutors from your area for you.
            </p>
            <Link href="/find-a-tutor" className={`${btnPrimary} mt-6`}>
              Find a tutor
            </Link>
          </div>
        ) : (
          <>
            {groups.length > 1 && (
              <div className="mb-10 flex flex-wrap justify-center gap-2">
                <Link href="/our-tutors" className={active ? chip : chipActive}>
                  All
                </Link>
                {groups.map((g) => (
                  <Link key={g} href={`/our-tutors?group=${g}`} className={active === g ? chipActive : chip}>
                    {groupLabel(g)}
                  </Link>
                ))}
              </div>
            )}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((t) => (
                <TutorCard key={t.id} tutor={t} />
              ))}
            </div>
          </>
        )}
      </section>
      <CtaBand title="Not sure who to pick?" text="Tell us what you need and we'll hand-pick a short list of tutors from your own area." />
    </>
  );
}
