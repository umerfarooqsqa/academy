// Shared chrome for the public client website: sticky nav header + footer,
// wrapping the homepage, /find-a-tutor, and /become-a-tutor. Mirrors the
// existing app/(admin)/layout.tsx pattern. Route groups don't affect URLs —
// these pages are still served at /, /find-a-tutor, /become-a-tutor;
// middleware.ts's PUBLIC_PATHS list is untouched by this.
//
// 2026-10-13 redesign — operator feedback: the first pass "read too formal."
// Warmer rose/amber palette (was indigo/corporate-blue), a playful rounded
// display font for headings (Baloo 2, via next/font/google — bundled by
// Next.js itself, no new dependency, no external stylesheet request), and a
// "sticker" button style (solid offset shadow, not a soft SaaS blur) instead
// of the generic rounded-full/soft-shadow look used everywhere else.

import Link from "next/link";
import { Baloo_2 } from "next/font/google";
import type { Metadata } from "next";
import { getSiteContent } from "@/lib/siteContent";

const headingFont = Baloo_2({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-heading" });

export async function generateMetadata(): Promise<Metadata> {
  const content = await getSiteContent();
  return {
    title: content.siteName,
    description: content.heroSubheadline,
  };
}

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const content = await getSiteContent();

  return (
    <div className={`${headingFont.variable} bg-[#FFFBF5]`}>
      <header className="sticky top-0 z-10 border-b-2 border-gray-900/5 bg-[#FFFBF5]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 font-heading text-lg font-extrabold tracking-tight text-gray-900">
            <span className="flex h-9 w-9 rotate-[-6deg] items-center justify-center rounded-xl bg-rose-500 text-base font-extrabold text-white shadow-[2px_2px_0_0_#1f2937]">
              {content.siteName.charAt(0).toUpperCase()}
            </span>
            {content.siteName}
          </Link>
          <nav className="flex items-center gap-2 sm:gap-5">
            <Link href="/find-a-tutor" className="hidden text-sm font-semibold text-gray-700 hover:text-rose-600 sm:inline">
              Find a tutor
            </Link>
            <Link href="/become-a-tutor" className="hidden text-sm font-semibold text-gray-700 hover:text-rose-600 sm:inline">
              Become a tutor
            </Link>
            <Link
              href="/find-a-tutor"
              className="rounded-full border-2 border-gray-900 bg-amber-300 px-4 py-2 text-sm font-bold text-gray-900 shadow-[3px_3px_0_0_#1f2937] transition hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_#1f2937] active:translate-y-0 active:shadow-none"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t-2 border-gray-900/5 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-gray-500 sm:flex-row sm:px-6">
          <span>
            © {new Date().getFullYear()} {content.siteName}
          </span>
          <Link href="/login" className="hover:text-gray-700">
            Admin
          </Link>
        </div>
      </footer>
    </div>
  );
}
