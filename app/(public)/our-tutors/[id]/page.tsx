// Public featured-tutor profile, Upwork-style (2026-10-15). 404s unless the
// tutor is featured AND verified. Public fields only: first name + last
// initial, photo, headline, about, area (zone), subjects, grades, experience,
// education, rating and the badges the admin set — never the phone number,
// fee, CNIC, documents or exact location. "Request this tutor" opens the
// Lili parent form with this tutor preselected (lib/matching/requestedTutor.ts).

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicTutorProfile } from "@/lib/tutors/publicProfile";
import { breadcrumbLd, tutorProfileLd } from "@/lib/seo/jsonLd";
import JsonLd from "../../JsonLd";
import { BadgeCheckIcon, BriefcaseIcon, CapIcon, CheckIcon, GiftIcon, PinIcon } from "../../icons";
import { TutorAvatar, RatingLine, VerifiedBadges, deliveryLabel, groupLabel } from "../TutorCard";
import { btnPrimary, card, checkDot, container } from "../../ui";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const t = await getPublicTutorProfile(id);
  if (!t) return { title: "Tutor not found" };
  return {
    title: `${t.displayName} — ${t.subjects.slice(0, 3).join(", ")} tutor`,
    description: t.headline ?? `${groupLabel(t.subjectGroup)} tutor in ${t.area}. ID-checked by our team.`,
    alternates: { canonical: `/our-tutors/${t.id}` },
  };
}

export default async function TutorProfilePage({ params }: Props) {
  const { id } = await params;
  const t = await getPublicTutorProfile(id);
  if (!t) notFound();

  const requestHref = `/find-a-tutor?tutor=${encodeURIComponent(t.id)}`;

  return (
    <div className="bg-slate-50">
      <JsonLd data={tutorProfileLd(t)} />
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "Our tutors", path: "/our-tutors" },
          { name: t.displayName, path: `/our-tutors/${t.id}` },
        ])}
      />
      <div className={`${container} py-8 sm:py-12`}>
        <Link href="/our-tutors" className="text-sm font-medium text-slate-500 hover:text-slate-900">
          ← All tutors
        </Link>

        <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            {/* Header */}
            <section className={`${card} p-6 sm:p-8`}>
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <TutorAvatar tutor={t} size="h-24 w-24 text-3xl" />
                <div className="min-w-0">
                  <h1 className="font-heading text-2xl font-bold text-slate-900 sm:text-3xl">{t.displayName}</h1>
                  {t.headline && <p className="mt-1 text-base text-slate-700">{t.headline}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      <PinIcon className="h-4 w-4 text-slate-400" />
                      {t.area}
                    </span>
                    <span>{deliveryLabel(t.deliveryMode)}</span>
                    <span>{t.subjectGroups.map(groupLabel).join(", ")}</span>
                    <RatingLine tutor={t} />
                  </div>
                  <div className="mt-3">
                    <VerifiedBadges tutor={t} />
                  </div>
                </div>
              </div>
            </section>

            {/* About */}
            {(t.bio || t.qualification) && (
              <section className={`${card} p-6 sm:p-8`}>
                <h2 className="font-heading text-lg font-semibold text-slate-900">About</h2>
                {t.bio && <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-slate-700">{t.bio}</p>}
                <dl className="mt-5 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                  {t.qualification && (
                    <div>
                      <dt className="text-slate-500">Qualification</dt>
                      <dd className="mt-0.5 font-medium text-slate-900">{t.qualification}</dd>
                    </div>
                  )}
                  {t.curriculum && (
                    <div>
                      <dt className="text-slate-500">Teaches</dt>
                      <dd className="mt-0.5 font-medium text-slate-900">{t.curriculum}</dd>
                    </div>
                  )}
                  {t.yearsExperience != null && t.yearsExperience > 0 && (
                    <div>
                      <dt className="text-slate-500">Teaching experience</dt>
                      <dd className="mt-0.5 font-medium text-slate-900">
                        {t.yearsExperience} year{t.yearsExperience === 1 ? "" : "s"}
                      </dd>
                    </div>
                  )}
                </dl>
              </section>
            )}

            {/* Subjects & grades */}
            <section className={`${card} p-6 sm:p-8`}>
              <h2 className="font-heading text-lg font-semibold text-slate-900">Subjects</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {t.subjects.map((s) => (
                  <li key={s} className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">
                    {s}
                  </li>
                ))}
              </ul>
              {t.grades.length > 0 && (
                <>
                  <h3 className="mt-6 flex items-center gap-2 text-sm font-semibold text-slate-900">
                    Grades achieved
                    {t.gradesVerified && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-sky-700">
                        <BadgeCheckIcon className="h-3.5 w-3.5" /> checked against marksheet
                      </span>
                    )}
                  </h3>
                  <div className="mt-3 overflow-hidden rounded-xl ring-1 ring-slate-200">
                    <table className="w-full text-sm">
                      <tbody className="divide-y divide-slate-100">
                        {t.grades.map((g) => (
                          <tr key={g.subject}>
                            <td className="px-4 py-2.5 text-slate-700">{g.subject}</td>
                            <td className="px-4 py-2.5 text-right font-semibold text-slate-900">{g.grade}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </section>

            {/* Experience */}
            {t.experience.length > 0 && (
              <section className={`${card} p-6 sm:p-8`}>
                <h2 className="font-heading text-lg font-semibold text-slate-900">Experience</h2>
                <ol className="mt-5 space-y-6 border-l border-slate-200 pl-6">
                  {t.experience.map((e, i) => (
                    <li key={i} className="relative">
                      <span className="absolute -left-[35px] flex h-6 w-6 items-center justify-center rounded-full bg-white text-rose-600 ring-1 ring-slate-200">
                        <BriefcaseIcon className="h-3.5 w-3.5" />
                      </span>
                      <p className="font-medium text-slate-900">{e.title}</p>
                      <p className="text-sm text-slate-500">{[e.place, e.period].filter(Boolean).join(" · ")}</p>
                      {e.description && <p className="mt-1.5 text-sm leading-relaxed text-slate-700">{e.description}</p>}
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {/* Education */}
            {t.education.length > 0 && (
              <section className={`${card} p-6 sm:p-8`}>
                <h2 className="font-heading text-lg font-semibold text-slate-900">Education</h2>
                <ul className="mt-4 space-y-4">
                  {t.education.map((e, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                        <CapIcon className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="font-medium text-slate-900">{e.degree || e.institution}</p>
                        <p className="text-sm text-slate-500">{[e.degree ? e.institution : "", e.year].filter(Boolean).join(" · ")}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className={`${card} p-6`}>
              <p className="font-heading text-lg font-semibold text-slate-900">Want {t.displayName.split(" ")[0]} as your tutor?</p>
              <p className="mt-1.5 text-sm text-slate-600">Answer a few quick questions and we&apos;ll confirm availability with you on WhatsApp.</p>
              <Link href={requestHref} className={`${btnPrimary} mt-5 w-full`}>
                Request this tutor
              </Link>
              <ul className="mt-6 space-y-3 text-sm text-slate-700">
                <li className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                    <GiftIcon className="h-4 w-4" />
                  </span>
                  Free demo class
                </li>
                {["ID checked by our team", "Our team confirms every match"].map((s) => (
                  <li key={s} className="flex items-center gap-2.5">
                    <span className={`${checkDot} h-7 w-7`}>
                      <CheckIcon />
                    </span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
