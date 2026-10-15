"use client";

// Phone/tablet nav (lg:hidden): a menu button that opens a drawer sliding in
// from the RIGHT (operator request, 2026-10-15) — logo + close at the top,
// the site links (current page highlighted), then both calls to action and
// the WhatsApp link at the bottom. Closes on a link tap, the backdrop, the ✕
// or Escape; the page behind doesn't scroll while it's open.
//
// Rendered through a portal into <body>: the sticky header uses
// backdrop-blur, which would otherwise trap a position:fixed drawer inside
// the header's own box.

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRightIcon } from "./icons";
import { WhatsAppIcon } from "./WhatsAppButton";
import { btnPrimary, btnSecondary } from "./ui";

export interface NavLink {
  href: string;
  label: string;
}

export default function MobileNav({ links, siteName, whatsapp }: { links: NavLink[]; siteName: string; whatsapp: string }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => setMounted(true), []);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));
  const close = () => setOpen(false);
  const [first, ...rest] = siteName.split(" ");

  const drawer = (
    <div className={`fixed inset-0 z-50 lg:hidden ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      {/* Backdrop */}
      <div
        onClick={close}
        className={`absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
      />
      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className={`absolute inset-y-0 right-0 flex w-[85%] max-w-sm flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
          <Link href="/" onClick={close} className="flex items-center gap-2" tabIndex={open ? 0 : -1}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/lili-logo-mark-192.webp" alt="" width={167} height={192} className="h-9 w-auto" />
            <span className="font-heading text-base font-bold leading-none">
              <span className="text-rose-600">{first}</span> <span className="text-slate-800">{rest.join(" ")}</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={close}
            aria-label="Close menu"
            tabIndex={open ? 0 : -1}
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Main">
          <ul className="space-y-1">
            {links.map((l) => {
              const active = isActive(l.href);
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={close}
                    tabIndex={open ? 0 : -1}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center justify-between rounded-xl px-4 py-3.5 text-base font-medium transition ${
                      active ? "bg-rose-50 text-rose-700" : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    {l.label}
                    <ArrowRightIcon className={`h-4 w-4 ${active ? "text-rose-500" : "text-slate-300"}`} />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="space-y-3 border-t border-slate-100 px-5 py-5">
          <Link href="/find-a-tutor" onClick={close} tabIndex={open ? 0 : -1} className={`${btnPrimary} w-full py-3.5`}>
            Find a tutor
          </Link>
          <Link href="/become-a-tutor" onClick={close} tabIndex={open ? 0 : -1} className={`${btnSecondary} w-full py-3.5`}>
            Become a tutor
          </Link>
          {whatsapp && (
            <a
              href={`https://wa.me/${whatsapp}?text=${encodeURIComponent("Hi! I'm looking for a tutor.")}`}
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={open ? 0 : -1}
              className="flex items-center justify-center gap-2 pt-1 text-sm font-semibold text-emerald-700"
            >
              <WhatsAppIcon className="h-5 w-5 fill-current" /> Chat on WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-label="Open menu"
        className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
          <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
        </svg>
      </button>
      {mounted && createPortal(drawer, document.body)}
    </div>
  );
}
