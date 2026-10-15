"use client";

// Phone/tablet nav (lg:hidden) — a menu button that opens a panel with the
// same links as the desktop header plus both calls to action. Local state
// only, closes on navigation.

import { useState } from "react";
import Link from "next/link";
import { btnPrimary, btnSecondary } from "./ui";

export interface NavLink {
  href: string;
  label: string;
}

export default function MobileNav({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
          {open ? <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /> : <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />}
        </svg>
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full border-b border-slate-200 bg-white px-4 pb-5 pt-2 shadow-lg">
          <nav className="flex flex-col" aria-label="Main">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="border-b border-slate-100 py-3 text-base font-medium text-slate-700 hover:text-rose-600"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Link href="/become-a-tutor" className={btnSecondary} onClick={() => setOpen(false)}>
              Become a tutor
            </Link>
            <Link href="/find-a-tutor" className={btnPrimary} onClick={() => setOpen(false)}>
              Find a tutor
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
