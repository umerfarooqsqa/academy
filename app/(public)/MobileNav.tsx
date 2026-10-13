"use client";

// Mobile-only nav (sm:hidden) — the "Get started" button in the header is
// desktop/tablet-only (see layout.tsx); on phone widths this hamburger
// replaces it, opening a dropdown with the same links plus the CTA. Local
// state only (open/closed) — no new dependency, consistent with the rest of
// the public site's "sticker" look.

import { useState } from "react";
import Link from "next/link";

const linkClass =
  "block rounded-xl border-2 border-gray-900 bg-white px-4 py-2.5 text-sm font-bold text-gray-800 shadow-[2px_2px_0_0_#1f2937] transition hover:-translate-y-0.5";
const ctaClass =
  "block rounded-xl border-2 border-gray-900 bg-amber-300 px-4 py-2.5 text-center text-sm font-bold text-gray-900 shadow-[2px_2px_0_0_#1f2937] transition hover:-translate-y-0.5";

export default function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="sm:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-gray-900 bg-white shadow-[2px_2px_0_0_#1f2937]"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5 text-gray-900">
          {open ? (
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          ) : (
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
          )}
        </svg>
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full border-b-2 border-gray-900/10 bg-[#FFFBF5] px-4 py-4 shadow-md">
          <div className="flex flex-col gap-2">
            <Link href="/find-a-tutor" className={linkClass} onClick={() => setOpen(false)}>
              Find a tutor
            </Link>
            <Link href="/become-a-tutor" className={linkClass} onClick={() => setOpen(false)}>
              Become a tutor
            </Link>
            <Link href="/opportunities" className={linkClass} onClick={() => setOpen(false)}>
              Opportunities
            </Link>
            <Link href="/find-a-tutor" className={ctaClass} onClick={() => setOpen(false)}>
              Get started
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
