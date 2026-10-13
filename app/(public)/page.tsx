// Public homepage (2026-10-13 feature: a real client-facing website, content
// managed from /website-content). Nav header + footer come from this route
// group's layout.tsx. Reachable with no login (middleware keeps "/" public);
// the admin dashboard is still reachable directly at /dashboard.
//
// Visually distinct from the plain admin dashboard on purpose — CLAUDE.md
// Section 7's "keep it plain" rule is written for the internal operator tool,
// not this client-facing site, and Section 11 explicitly calls for premium
// positioning. Inline SVG icons only (no icon library dependency).

import Link from "next/link";
import { getSiteContent } from "@/lib/siteContent";

export const dynamic = "force-dynamic";

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-6 w-6">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" strokeLinecap="round" />
    </svg>
  );
}

function MatchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-6 w-6">
      <circle cx="8" cy="8" r="3.25" />
      <circle cx="16" cy="8" r="3.25" />
      <path d="M3 20c0-3 2.5-5.25 5-5.25S13 17 13 20" strokeLinecap="round" />
      <path d="M13 20c0-3 2.5-5.25 5-5.25S23 17 23 20" strokeLinecap="round" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-6 w-6">
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M8 3v4M16 3v4M3.5 10h17" strokeLinecap="round" />
      <path d="m8.5 14.5 2 2 4.5-4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const STEP_ICONS = [SearchIcon, MatchIcon, CalendarIcon];

export default async function HomePage() {
  const content = await getSiteContent();

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-40 -z-10 flex justify-center blur-3xl"
        >
          <div className="h-[32rem] w-[64rem] rounded-full bg-gradient-to-tr from-indigo-200 via-sky-100 to-amber-100 opacity-70" />
        </div>

        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3.5 py-1.5 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-200">
            {content.heroEyebrow}
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            {content.heroHeadline}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-gray-600">{content.heroSubheadline}</p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/find-a-tutor"
              className="rounded-full bg-indigo-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-500 hover:shadow-indigo-300"
            >
              Find a tutor
            </Link>
            <Link
              href="/become-a-tutor"
              className="rounded-full border border-gray-300 bg-white px-7 py-3.5 text-sm font-semibold text-gray-800 shadow-sm transition hover:border-gray-400 hover:bg-gray-50"
            >
              Become a tutor
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="text-center">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-indigo-600">How it works</h2>
          <p className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">Three steps to the right match</p>
        </div>
        <div className="relative mt-14 grid grid-cols-1 gap-10 sm:grid-cols-3">
          <div
            aria-hidden
            className="pointer-events-none absolute top-7 left-0 right-0 hidden h-px bg-gradient-to-r from-transparent via-indigo-200 to-transparent sm:block"
          />
          {content.howItWorks.map((step, i) => {
            const Icon = STEP_ICONS[i % STEP_ICONS.length];
            return (
              <div key={i} className="relative text-center">
                <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
                  <Icon />
                </div>
                <div className="mt-5 text-xs font-bold tracking-wider text-indigo-500">STEP {i + 1}</div>
                <p className="mt-2 text-base text-gray-700">{step}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Parent / tutor pitch */}
      <section className="bg-gray-50 py-16 sm:py-24">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 sm:grid-cols-2 sm:px-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <SearchIcon />
            </div>
            <h2 className="mt-5 text-xl font-bold text-gray-900">For parents</h2>
            <p className="mt-3 text-base leading-relaxed text-gray-600">{content.parentPitch}</p>
            <Link href="/find-a-tutor" className="mt-5 inline-block text-sm font-semibold text-indigo-600 hover:text-indigo-500">
              Find a tutor →
            </Link>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
              <MatchIcon />
            </div>
            <h2 className="mt-5 text-xl font-bold text-gray-900">For tutors</h2>
            <p className="mt-3 text-base leading-relaxed text-gray-600">{content.tutorPitch}</p>
            <Link href="/become-a-tutor" className="mt-5 inline-block text-sm font-semibold text-indigo-600 hover:text-indigo-500">
              Become a tutor →
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {content.testimonials.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">What people say</h2>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {content.testimonials.map((t, i) => (
              <blockquote key={i} className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">
                <span className="text-4xl font-serif leading-none text-indigo-200">&ldquo;</span>
                <p className="-mt-3 text-base italic leading-relaxed text-gray-700">{t.quote}</p>
                <footer className="mt-4 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                    {t.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="text-sm font-semibold text-gray-700">{t.name}</span>
                </footer>
              </blockquote>
            ))}
          </div>
        </section>
      )}

      {/* Closing CTA */}
      <section className="mx-auto max-w-4xl px-4 pb-20 sm:px-6">
        <div className="rounded-3xl bg-indigo-600 px-8 py-14 text-center shadow-xl shadow-indigo-200">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Ready to get started?</h2>
          <p className="mx-auto mt-3 max-w-xl text-indigo-100">
            Whether you&apos;re looking for a tutor or ready to teach, it takes less than two minutes.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/find-a-tutor"
              className="rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50"
            >
              Find a tutor
            </Link>
            <Link
              href="/become-a-tutor"
              className="rounded-full border border-indigo-400 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              Become a tutor
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
