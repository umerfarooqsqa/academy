// Shared Tailwind class strings for the public website — the 2026-10-15
// "clean & professional" redesign (operator request, inspired by
// beacontutorspk.com): white / slate-50 sections, Poppins headings + Inter
// body, one rose accent, soft-shadow rounded cards. No thick outlines, offset
// "sticker" shadows or tilted cards any more.

export const container = "mx-auto w-full max-w-6xl px-4 sm:px-6";
export const sectionY = "py-16 sm:py-24";

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-full bg-rose-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-rose-600/25 transition hover:bg-rose-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:cursor-not-allowed disabled:opacity-50";
export const btnSecondary =
  "inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 ring-1 ring-inset ring-slate-300 transition hover:bg-slate-50 hover:ring-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:cursor-not-allowed disabled:opacity-50";
export const btnLight =
  "inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-rose-700 shadow-sm transition hover:bg-rose-50";
export const btnGhostLight =
  "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white ring-1 ring-inset ring-white/60 transition hover:bg-white/10";

export const card = "rounded-2xl bg-white p-6 ring-1 ring-slate-200 shadow-sm";
export const cardHover = `${card} transition hover:-translate-y-0.5 hover:shadow-md hover:ring-slate-300`;

export const chip =
  "rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-inset ring-slate-300 transition hover:bg-rose-50 hover:text-rose-700 hover:ring-rose-300 disabled:opacity-50";
export const chipActive =
  "rounded-full bg-rose-600 px-4 py-2 text-sm font-medium text-white ring-1 ring-inset ring-rose-600 transition";
export const tag = "inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700";

export const input =
  "w-full min-w-0 rounded-xl bg-white px-4 py-3 text-base text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500";

export const eyebrow = "text-sm font-semibold uppercase tracking-wider text-rose-600";
export const h1 = "font-heading text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl";
export const h2 = "font-heading text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl";
export const lead = "text-lg leading-relaxed text-slate-600";
export const textLink = "font-semibold text-rose-600 hover:text-rose-700";

/** Small check-circle used in trust rows and feature lists. */
export const checkDot = "flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600";
