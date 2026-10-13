// Shared chrome for the public client website (2026-10-13 feature): sticky
// nav header + footer, wrapping the homepage, /find-a-tutor, and
// /become-a-tutor. Mirrors the existing app/(admin)/layout.tsx pattern.
// Route groups don't affect URLs — these pages are still served at /,
// /find-a-tutor, /become-a-tutor; middleware.ts's PUBLIC_PATHS list is
// untouched by this move.

import Link from "next/link";
import { getSiteContent } from "@/lib/siteContent";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const content = await getSiteContent();

  return (
    <div className="bg-white">
      <header className="sticky top-0 z-10 border-b border-gray-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight text-gray-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              {content.siteName.charAt(0).toUpperCase()}
            </span>
            {content.siteName}
          </Link>
          <nav className="flex items-center gap-2 sm:gap-4">
            <Link href="/find-a-tutor" className="hidden text-sm font-medium text-gray-600 hover:text-gray-900 sm:inline">
              Find a tutor
            </Link>
            <Link href="/become-a-tutor" className="hidden text-sm font-medium text-gray-600 hover:text-gray-900 sm:inline">
              Become a tutor
            </Link>
            <Link
              href="/find-a-tutor"
              className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-indigo-200 hover:bg-indigo-500"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-gray-100 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-gray-400 sm:flex-row sm:px-6">
          <span>
            © {new Date().getFullYear()} {content.siteName}
          </span>
          <Link href="/login" className="hover:text-gray-600">
            Admin
          </Link>
        </div>
      </footer>
    </div>
  );
}
