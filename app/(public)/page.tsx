// Public homepage — content managed from /website-content. Nav header +
// footer come from this route group's layout.tsx. Reachable with no login
// (middleware keeps "/" public); the admin dashboard is still reachable
// directly at /dashboard.
//
// 2026-10-13 redesign — operator feedback: make it playful and distinct, not
// a generic corporate SaaS look. Rose/amber/teal palette, hand-tilted
// "sticker" cards and buttons (solid offset shadows, not soft blurs), varied
// icon colors instead of one repeated brand color. Inline SVG icons only, no
// icon library dependency.

import Link from "next/link";
import { getSiteContent } from "@/lib/siteContent";
import NearYouSection from "./NearYouSection";
import { getOpenOpportunityListings } from "@/lib/opportunities/digest";
import { getVerifiedTutorCounts } from "@/lib/tutors/verified";
import Lili from "./Lili";

export const dynamic = "force-dynamic";

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-7 w-7">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" strokeLinecap="round" />
    </svg>
  );
}

function MatchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-7 w-7">
      <circle cx="8" cy="8" r="3.25" />
      <circle cx="16" cy="8" r="3.25" />
      <path d="M3 20c0-3 2.5-5.25 5-5.25S13 17 13 20" strokeLinecap="round" />
      <path d="M13 20c0-3 2.5-5.25 5-5.25S23 17 23 20" strokeLinecap="round" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-7 w-7">
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M8 3v4M16 3v4M3.5 10h17" strokeLinecap="round" />
      <path d="m8.5 14.5 2 2 4.5-4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const STEPS = [
  { Icon: SearchIcon, badge: "bg-rose-500", tint: "bg-rose-100 text-rose-600" },
  { Icon: MatchIcon, badge: "bg-amber-400", tint: "bg-amber-100 text-amber-600" },
  { Icon: CalendarIcon, badge: "bg-teal-400", tint: "bg-teal-100 text-teal-700" },
];

export default async function HomePage() {
  const [content, listings, tutorCounts] = await Promise.all([
    getSiteContent(),
    getOpenOpportunityListings(),
    getVerifiedTutorCounts(),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-amber-200/60 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -right-20 top-10 h-80 w-80 rounded-full bg-rose-200/60 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute left-1/3 bottom-0 h-64 w-64 rounded-full bg-teal-200/50 blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-4 pb-20 pt-10 text-center sm:px-6 sm:pb-28 sm:pt-14">
          {/* Lili leads the hero, standing between the two calls to action
              and asking how she can help (2026-10-14). Buttons flank her on
              wider screens and sit side by side beneath her on phones. */}
          <div className="mx-auto grid max-w-2xl grid-cols-2 items-end gap-x-4 gap-y-6 sm:grid-cols-[1fr_auto_1fr] sm:gap-x-6">
            <div className="col-span-2 flex flex-col items-center sm:col-span-1 sm:col-start-2 sm:row-start-1">
              <div className="relative rounded-2xl border-2 border-gray-900 bg-white px-5 py-3 font-heading text-lg font-extrabold text-gray-900 shadow-[3px_3px_0_0_#1f2937] sm:text-xl">
                How can I help you today?
                <span
                  aria-hidden
                  className="absolute -bottom-[9px] left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-gray-900 bg-white"
                />
              </div>
              <Lili className="mt-4 w-28 sm:w-36" />
            </div>
            <Link
              href="/find-a-tutor"
              className="justify-self-end whitespace-nowrap rounded-full border-2 border-gray-900 bg-rose-500 px-6 py-3.5 text-base font-bold text-white shadow-[4px_4px_0_0_#1f2937] transition hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_#1f2937] active:translate-y-0 active:shadow-none sm:col-start-1 sm:row-start-1 sm:mb-10 sm:px-7"
            >
              Find a tutor
            </Link>
            <Link
              href="/become-a-tutor"
              className="justify-self-start whitespace-nowrap rounded-full border-2 border-gray-900 bg-white px-6 py-3.5 text-base font-bold text-gray-900 shadow-[4px_4px_0_0_#1f2937] transition hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_#1f2937] active:translate-y-0 active:shadow-none sm:col-start-3 sm:row-start-1 sm:mb-10 sm:px-7"
            >
              Become a tutor
            </Link>
          </div>
          <span className="mt-14 inline-flex rotate-[-2deg] items-center gap-1.5 rounded-full border-2 border-gray-900 bg-white px-4 py-1.5 text-sm font-bold text-gray-900 shadow-[3px_3px_0_0_#1f2937]">
            {content.heroEyebrow}
          </span>
          <h1 className="mt-7 font-heading text-4xl font-extrabold tracking-tight text-gray-900 sm:text-6xl">
            {content.heroHeadline}
          </h1>
        </div>
      </section>

      {/* How it works — a numbered path (2026-10-14 redesign): badges joined by
          a dashed line (left-to-right on desktop, top-to-bottom on phones),
          each with a card holding the /website-content step text. */}
      <section className="border-y-2 border-gray-900/5 bg-amber-50/70">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="text-center">
            <h2 className="font-heading text-sm font-extrabold uppercase tracking-wider text-rose-500">How it works</h2>
            <p className="mt-2 font-heading text-3xl font-extrabold text-gray-900 sm:text-4xl">
              {content.howItWorks.length === 3 ? "Three easy steps" : "How it works"}
            </p>
          </div>
          <ol className="relative mt-12 grid grid-cols-1 gap-8 sm:mt-16 sm:grid-cols-3 sm:gap-8">
            {content.howItWorks.map((step, i) => {
              const { Icon, badge, tint } = STEPS[i % STEPS.length];
              return (
                <li key={i} className="relative flex gap-4 sm:flex-col sm:items-center sm:text-center">
                  {/* Dashed link to the next step's badge: down on phones, across on desktop. */}
                  {i < content.howItWorks.length - 1 && (
                    <div
                      aria-hidden
                      className="pointer-events-none absolute -bottom-8 left-[26px] top-14 border-l-4 border-dashed border-gray-900/15 sm:bottom-auto sm:left-[calc(50%+1.75rem)] sm:right-[calc(-50%-0.25rem)] sm:top-[26px] sm:border-l-0 sm:border-t-4"
                    />
                  )}
                  <div
                    className={`relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-gray-900 font-heading text-2xl font-extrabold text-white shadow-[3px_3px_0_0_#1f2937] ${badge}`}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 rounded-3xl border-2 border-gray-900 bg-white p-5 shadow-[4px_4px_0_0_#1f2937] transition hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#1f2937] sm:mt-6 sm:w-full sm:p-6">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tint} sm:mx-auto`}>
                      <Icon />
                    </div>
                    <p className="mt-4 text-base font-semibold leading-snug text-gray-800 sm:text-lg">{step}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* For parents / for tutors — the pitch (editable in /website-content)
          plus what's near you: verified tutors for parents, tuitions for tutors */}
      <NearYouSection
        listings={listings}
        tutorCounts={tutorCounts}
        parentPitch={content.parentPitch}
        tutorPitch={content.tutorPitch}
        parentIcon={<SearchIcon />}
        tutorIcon={<MatchIcon />}
      />

      {/* Testimonials */}
      {content.testimonials.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <h2 className="text-center font-heading text-3xl font-extrabold text-gray-900 sm:text-4xl">What people say</h2>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2">
            {content.testimonials.map((t, i) => (
              <blockquote
                key={i}
                className={`rounded-3xl border-2 border-gray-900 bg-white p-7 shadow-[5px_5px_0_0_#1f2937] ${i % 2 === 0 ? "rotate-1" : "-rotate-1"}`}
              >
                <p className="text-base leading-relaxed text-gray-700">&ldquo;{t.quote}&rdquo;</p>
                <footer className="mt-4 flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-gray-900 bg-rose-400 text-sm font-extrabold text-white">
                    {t.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="font-heading text-sm font-bold text-gray-800">{t.name}</span>
                </footer>
              </blockquote>
            ))}
          </div>
        </section>
      )}

      {/* Closing CTA */}
      <section className="mx-auto max-w-4xl px-4 pb-20 sm:px-6">
        <div className="rounded-[2.5rem] border-2 border-gray-900 bg-rose-500 px-8 py-14 text-center shadow-[6px_6px_0_0_#1f2937]">
          <h2 className="font-heading text-3xl font-extrabold text-white sm:text-4xl">Ready to get started?</h2>
          <p className="mx-auto mt-3 max-w-xl text-rose-50">
            Whether you&apos;re looking for a tutor or ready to teach, it takes less than two minutes.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/find-a-tutor"
              className="rounded-full border-2 border-gray-900 bg-amber-300 px-7 py-3.5 text-base font-bold text-gray-900 shadow-[4px_4px_0_0_#1f2937] transition hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_#1f2937] active:translate-y-0 active:shadow-none"
            >
              Find a tutor
            </Link>
            <Link
              href="/become-a-tutor"
              className="rounded-full border-2 border-gray-900 bg-white px-7 py-3.5 text-base font-bold text-gray-900 shadow-[4px_4px_0_0_#1f2937] transition hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_#1f2937] active:translate-y-0 active:shadow-none"
            >
              Become a tutor
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
