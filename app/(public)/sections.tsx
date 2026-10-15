// Building blocks shared by the public pages (2026-10-15 redesign): section
// headings, the page header band, subject cards, the FAQ accordion and the
// closing call-to-action band.

import Link from "next/link";
import type { Faq } from "@/lib/siteContent";
import { findTutorHref, subjectPath, type PublicSubject, type SubjectIconKey } from "@/lib/publicSubjects";
import { ArrowRightIcon, BookIcon, CapIcon, ChevronDownIcon, CodeIcon, FlaskIcon, GlobeIcon, SparkIcon } from "./icons";
import { btnGhostLight, btnLight, cardHover, container, eyebrow, h2 } from "./ui";

/** Centred section title with thin rules either side (Beacon-style), plus an optional intro line. */
export function SectionHeading({
  kicker,
  title,
  intro,
  align = "center",
}: {
  kicker?: string;
  title: string;
  intro?: string;
  align?: "center" | "left";
}) {
  if (align === "left") {
    return (
      <div className="max-w-2xl">
        {kicker && <p className={eyebrow}>{kicker}</p>}
        <h2 className={`${h2} mt-2`}>{title}</h2>
        {intro && <p className="mt-4 text-lg leading-relaxed text-slate-600">{intro}</p>}
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-3xl text-center">
      {kicker && <p className={eyebrow}>{kicker}</p>}
      <div className="mt-2 flex items-center justify-center gap-4 sm:gap-6">
        <span aria-hidden className="hidden h-px flex-1 bg-gradient-to-r from-transparent to-slate-300 sm:block" />
        <h2 className={h2}>{title}</h2>
        <span aria-hidden className="hidden h-px flex-1 bg-gradient-to-l from-transparent to-slate-300 sm:block" />
      </div>
      {intro && <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-slate-600">{intro}</p>}
    </div>
  );
}

/** Light header band at the top of inner pages (/subjects, /faq, /contact, /our-tutors …). */
export function PageHeader({ kicker, title, intro, children }: { kicker?: string; title: string; intro?: string; children?: React.ReactNode }) {
  return (
    <section className="border-b border-slate-200 bg-gradient-to-b from-rose-50/70 to-white">
      <div className={`${container} py-14 text-center sm:py-20`}>
        {kicker && <p className={eyebrow}>{kicker}</p>}
        <h1 className="mt-2 font-heading text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">{title}</h1>
        {intro && <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-slate-600">{intro}</p>}
        {children}
      </div>
    </section>
  );
}

const SUBJECT_ICONS: Record<SubjectIconKey, (p: { className?: string }) => React.ReactElement> = {
  book: BookIcon,
  globe: GlobeIcon,
  flask: FlaskIcon,
  code: CodeIcon,
  spark: SparkIcon,
  cap: CapIcon,
};

export function SubjectCard({ subject, detailed = false }: { subject: PublicSubject; detailed?: boolean }) {
  const Icon = SUBJECT_ICONS[subject.icon];
  return (
    <div className={`${cardHover} flex flex-col`}>
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${subject.tint}`}>
        <Icon className="h-6 w-6" />
      </div>
      {/* Title links to the subject's own landing page (SEO, 2026-10-15). */}
      <h3 className="mt-5 font-heading text-lg font-semibold text-slate-900">
        <Link href={subjectPath(subject)} className="hover:text-rose-600">
          {subject.title}
        </Link>
      </h3>
      <p className="mt-1 text-sm font-medium text-slate-500">{subject.levels}</p>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">{subject.description}</p>
      {detailed && (
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {subject.subjects.map((s) => (
            <li key={s} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
              {s}
            </li>
          ))}
        </ul>
      )}
      <Link href={findTutorHref(subject)} className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold text-rose-600 hover:text-rose-700">
        Find a tutor <ArrowRightIcon />
      </Link>
    </div>
  );
}

/** FAQ accordion — plain <details>, no JavaScript needed. */
export function FaqList({ faqs }: { faqs: Faq[] }) {
  return (
    <div className="divide-y divide-slate-200 rounded-2xl bg-white ring-1 ring-slate-200">
      {faqs.map((f, i) => (
        <details key={i} className="group px-5 sm:px-6">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-heading text-base font-medium text-slate-900 [&::-webkit-details-marker]:hidden">
            {f.q}
            <ChevronDownIcon className="h-5 w-5 shrink-0 text-slate-400 transition group-open:rotate-180" />
          </summary>
          <p className="-mt-1 whitespace-pre-line pb-5 text-[15px] leading-relaxed text-slate-600">{f.a}</p>
        </details>
      ))}
    </div>
  );
}

/** Rose call-to-action band used at the bottom of most pages. */
export function CtaBand({
  title = "Ready to find the right tutor?",
  text = "Tell us what you need — it takes about two minutes, and your first demo class is free.",
}: {
  title?: string;
  text?: string;
}) {
  return (
    <section className={`${container} pb-16 sm:pb-24`}>
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-600 to-rose-500 px-6 py-12 text-center sm:px-12 sm:py-16">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10" />
        <div aria-hidden className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-white/10" />
        <h2 className="relative font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl">{title}</h2>
        <p className="relative mx-auto mt-3 max-w-xl text-base text-rose-50 sm:text-lg">{text}</p>
        <div className="relative mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/find-a-tutor" className={btnLight}>
            Find a tutor
          </Link>
          <Link href="/become-a-tutor" className={btnGhostLight}>
            Become a tutor
          </Link>
        </div>
      </div>
    </section>
  );
}
