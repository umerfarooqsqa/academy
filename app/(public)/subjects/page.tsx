// Public /subjects — what we teach (2026-10-15 redesign). Catalogue in
// lib/publicSubjects.ts, shared with the homepage.

import type { Metadata } from "next";
import { PUBLIC_SUBJECTS } from "@/lib/publicSubjects";
import Reveal from "../Reveal";
import { CtaBand, PageHeader, SectionHeading, SubjectCard } from "../sections";
import { HomeIcon, MonitorIcon, UsersIcon } from "../icons";
import { card, container, sectionY } from "../ui";

// The layout reads live data (contact details, featured-tutor count), so
// never pre-render at build time.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: "/subjects" },
  title: "Tutors for Every Subject & Class",
  description:
    "Home and online tutors for every class: primary, Matric, O/A-levels, FSc, Computer Science, skills and university — ID-checked, free demo class.",
};

const MODES = [
  { Icon: HomeIcon, title: "Home tuition", text: "A tutor from your own neighbourhood comes to your home." },
  { Icon: MonitorIcon, title: "Online classes", text: "One-on-one lessons online, with a tutor from anywhere." },
  { Icon: UsersIcon, title: "Female or male tutor", text: "Tell us your preference and we'll only suggest tutors who match." },
];

export default function SubjectsPage() {
  return (
    <>
      <PageHeader
        kicker="Subjects"
        title="Tutors for every subject and class"
        intro="Every class from primary school to university. Each tutor is matched by the grades they achieved in the very subjects you need."
      />
      <section className={`${container} ${sectionY}`}>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Cards slide in one after another as they scroll into view (2026-10-15). */}
          {PUBLIC_SUBJECTS.map((s, i) => (
            <Reveal key={s.key} delay={(i % 3) * 120} className="flex [&>*]:w-full">
              <SubjectCard subject={s} detailed />
            </Reveal>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-slate-500">
          Don&apos;t see your subject? Ask anyway — tell us what you need and we&apos;ll look for the right tutor.
        </p>
      </section>
      <section className="bg-slate-50">
        <div className={`${container} ${sectionY}`}>
          <SectionHeading kicker="Your choice" title="Lessons the way you want them" />
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {MODES.map(({ Icon, title, text }) => (
              <div key={title} className={`${card} text-center`}>
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 font-heading text-base font-semibold text-slate-900">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <div className="pt-16 sm:pt-24">
        <CtaBand />
      </div>
    </>
  );
}
