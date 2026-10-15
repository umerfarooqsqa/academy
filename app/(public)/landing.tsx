// Building blocks for the keyword landing pages (SEO + GEO, 2026-10-15):
// /tutors-in-karachi (+ each area), /online-tuition, /home-tuition,
// /subjects/<slug> and /about. Every page opens with a keyword H1 and a
// short direct-answer paragraph (what AI assistants and featured snippets
// quote), then real data, FAQs (with FAQPage schema) and internal links.

import Link from "next/link";
import { ArrowRightIcon, CheckIcon } from "./icons";
import { btnPrimary, btnSecondary, checkDot, container, eyebrow } from "./ui";

export const TRUST = ["Free demo class", "ID-checked tutors", "Home & online", "Male & female tutors"];

export function Breadcrumbs({ items }: { items: { name: string; path: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((it, i) => (
          <li key={it.path} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden>›</span>}
            {i < items.length - 1 ? (
              <Link href={it.path} className="hover:text-rose-600">
                {it.name}
              </Link>
            ) : (
              <span aria-current="page" className="text-slate-700">
                {it.name}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function TrustRow({ center = false }: { center?: boolean }) {
  return (
    <ul className={`mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-slate-700 ${center ? "justify-center" : ""}`}>
      {TRUST.map((t) => (
        <li key={t} className="flex items-center gap-2">
          <span className={checkDot}>
            <CheckIcon />
          </span>
          {t}
        </li>
      ))}
    </ul>
  );
}

/** Keyword H1 + direct answer + CTAs. */
export function LandingHero({
  breadcrumbs,
  kicker,
  title,
  intro,
  primary = { href: "/find-a-tutor", label: "Find a tutor" },
  secondary = { href: "/become-a-tutor", label: "Become a tutor" },
  children,
}: {
  breadcrumbs: { name: string; path: string }[];
  kicker: string;
  title: string;
  intro: string;
  primary?: { href: string; label: string };
  secondary?: { href: string; label: string };
  children?: React.ReactNode;
}) {
  return (
    <section className="border-b border-slate-200 bg-gradient-to-b from-rose-50/70 to-white">
      <div className={`${container} py-10 sm:py-14`}>
        <Breadcrumbs items={breadcrumbs} />
        <p className={`${eyebrow} mt-8`}>{kicker}</p>
        <h1 className="mt-2 max-w-3xl font-heading text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">{title}</h1>
        <p className="mt-5 max-w-3xl text-lg leading-relaxed text-slate-600">{intro}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href={primary.href} className={`${btnPrimary} px-7 py-3.5 text-base`}>
            {primary.label} <ArrowRightIcon />
          </Link>
          <Link href={secondary.href} className={`${btnSecondary} px-7 py-3.5 text-base`}>
            {secondary.label}
          </Link>
        </div>
        <TrustRow />
        {children}
      </div>
    </section>
  );
}

/** A grid of internal links (areas, subjects, related pages). */
export function LinkGrid({ title, links }: { title: string; links: { href: string; label: string; note?: string }[] }) {
  if (links.length === 0) return null;
  return (
    <div>
      <h2 className="font-heading text-2xl font-bold text-slate-900">{title}</h2>
      <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3.5 text-sm ring-1 ring-slate-200 transition hover:ring-rose-300"
            >
              <span>
                <span className="block font-medium text-slate-900">{l.label}</span>
                {l.note && <span className="text-xs text-slate-500">{l.note}</span>}
              </span>
              <ArrowRightIcon className="h-4 w-4 shrink-0 text-slate-400" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** A plain prose section with a question-style H2 (GEO). */
export function Prose({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-heading text-2xl font-bold text-slate-900">{title}</h2>
      <div className="mt-4 space-y-4 text-base leading-relaxed text-slate-700">{children}</div>
    </div>
  );
}

/** "Free demo class" style highlight boxes. */
export function FactGrid({ facts }: { facts: { title: string; text: string }[] }) {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {facts.map((f) => (
        <li key={f.title} className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
          <p className="flex items-center gap-2 font-heading text-base font-semibold text-slate-900">
            <span className={checkDot}>
              <CheckIcon />
            </span>
            {f.title}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{f.text}</p>
        </li>
      ))}
    </ul>
  );
}

export function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}
