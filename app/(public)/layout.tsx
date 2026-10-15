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
import MobileNav from "./MobileNav";

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
        <div className="relative mx-auto flex max-w-6xl items-center justify-between px-4 py-2 sm:px-6">
          {/* The logo (2026-10-15): Lili's head on the rose badge (public/brand/,
              cut from her artwork) + the site name in the logo's colours —
              first word rose, the rest dark. The name stays editable in
              /website-content; the badge does a little hop on hover. */}
          <Link href="/" className="group flex items-center gap-2.5" aria-label={`${content.siteName} — home`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/lili-logo-mark-192.webp"
              alt=""
              width={167}
              height={192}
              className="h-14 w-auto transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:-rotate-6"
            />
            <span className="font-heading font-extrabold leading-[0.9] tracking-tight">
              <span className="block text-[26px] text-rose-500">{content.siteName.split(" ")[0]}</span>
              {content.siteName.split(" ").length > 1 && (
                <span className="block text-[15px] text-gray-900">{content.siteName.split(" ").slice(1).join(" ")}</span>
              )}
            </span>
          </Link>
          <nav className="hidden items-center gap-5 sm:flex">
            <Link href="/find-a-tutor" className="text-sm font-semibold text-gray-700 hover:text-rose-600">
              Find a tutor
            </Link>
            <Link href="/become-a-tutor" className="text-sm font-semibold text-gray-700 hover:text-rose-600">
              Become a tutor
            </Link>
            <Link href="/opportunities" className="text-sm font-semibold text-gray-700 hover:text-rose-600">
              Opportunities
            </Link>
            <Link
              href="/find-a-tutor"
              className="rounded-full border-2 border-gray-900 bg-amber-300 px-4 py-2 text-sm font-bold text-gray-900 shadow-[3px_3px_0_0_#1f2937] transition hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_#1f2937] active:translate-y-0 active:shadow-none"
            >
              Get started
            </Link>
          </nav>
          <MobileNav />
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t-2 border-gray-900/5 py-8">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} {content.siteName}
          </p>
          <p className="mt-1 text-xs text-gray-400">A registered company — part of Suntex Services.</p>
          <p className="mt-2 text-xs">
            <Link href="/privacy" className="font-semibold text-gray-500 underline underline-offset-2 hover:text-gray-900">
              Privacy Policy
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
