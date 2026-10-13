// Public homepage (2026-10-13 feature: a real client-facing website, content
// managed from /website-content). Root layout only — no admin nav, same
// pattern as /opportunities. Previously this route just redirected to
// /dashboard; the admin dashboard is still reachable directly at /dashboard
// (or via the "Admin" link in the footer below) — middleware still gates it.

import Link from "next/link";
import { getSiteContent } from "@/lib/siteContent";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const content = await getSiteContent();

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <header className="text-center">
        <h1 className="text-3xl font-semibold text-gray-900 sm:text-4xl">{content.heroHeadline}</h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-gray-600">{content.heroSubheadline}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/find-a-tutor" className="rounded bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700">
            Find a tutor
          </Link>
          <Link
            href="/become-a-tutor"
            className="rounded border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Become a tutor
          </Link>
        </div>
      </header>

      <section className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3">
        {content.howItWorks.map((step, i) => (
          <div key={i} className="rounded-lg border border-gray-200 p-5">
            <div className="text-xs font-semibold text-gray-400">STEP {i + 1}</div>
            <p className="mt-2 text-sm text-gray-800">{step}</p>
          </div>
        ))}
      </section>

      <section className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">For parents</h2>
          <p className="mt-2 text-sm text-gray-600">{content.parentPitch}</p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">For tutors</h2>
          <p className="mt-2 text-sm text-gray-600">{content.tutorPitch}</p>
        </div>
      </section>

      {content.testimonials.length > 0 && (
        <section className="mt-16">
          <h2 className="text-center text-lg font-semibold text-gray-900">What people say</h2>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {content.testimonials.map((t, i) => (
              <blockquote key={i} className="rounded-lg border border-gray-200 p-5">
                <p className="text-sm italic text-gray-700">&ldquo;{t.quote}&rdquo;</p>
                <footer className="mt-3 text-xs font-medium text-gray-500">— {t.name}</footer>
              </blockquote>
            ))}
          </div>
        </section>
      )}

      <footer className="mt-20 border-t border-gray-200 pt-6 text-center text-xs text-gray-400">
        <Link href="/login" className="hover:text-gray-600">
          Admin
        </Link>
      </footer>
    </main>
  );
}
