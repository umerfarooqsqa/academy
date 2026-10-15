// Public homepage — content managed from /website-content. Nav header +
// footer come from this route group's layout.tsx. Reachable with no login
// (middleware keeps "/" public); the admin dashboard is at /dashboard.
//
// 2026-10-15 professional redesign (operator request, inspired by
// beacontutorspk.com): clean white sections, one rose accent, soft-shadow
// cards. Top to bottom: hero, stats (real numbers only — lib/publicStats.ts),
// what we teach, why parents choose us, how it works, featured tutors, what's
// near you, tutor call-out, reviews, FAQ, contact + closing CTA. Claims are
// only the ones the operator confirmed: free demo class, home and online,
// male and female tutors, every class from primary to university.

import Link from "next/link";
import { getSiteContent, internationalDigits } from "@/lib/siteContent";
import { getGoogleReviews } from "@/lib/google/reviews";
import { getOpenOpportunityListings } from "@/lib/opportunities/digest";
import { getVerifiedTutorCounts } from "@/lib/tutors/verified";
import { getFeaturedTutors } from "@/lib/tutors/publicProfile";
import { getPublicStats } from "@/lib/publicStats";
import { PUBLIC_SUBJECTS } from "@/lib/publicSubjects";
import NearYouSection from "./NearYouSection";
import GoogleReviewsSection from "./GoogleReviewsSection";
import Lili from "./Lili";
import TutorCard from "./our-tutors/TutorCard";
import { CtaBand, FaqList, SectionHeading, SubjectCard } from "./sections";
import {
  ArrowRightIcon,
  BadgeCheckIcon,
  BriefcaseIcon,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  GiftIcon,
  MailIcon,
  MonitorIcon,
  PhoneIcon,
  PinIcon,
  PointerIcon,
  RocketIcon,
  SearchIcon,
  ShieldIcon,
  UsersIcon,
} from "./icons";
import { WhatsAppIcon } from "./WhatsAppButton";
import { btnPrimary, btnSecondary, card, checkDot, container, eyebrow, sectionY } from "./ui";

export const dynamic = "force-dynamic";

const TRUST = ["Free demo class", "ID-checked tutors", "Home & online", "Male & female tutors"];

const WHY = [
  { Icon: GiftIcon, title: "Free demo class", text: "Meet your tutor in a free demo class before you commit to anything." },
  { Icon: PinIcon, title: "Tutors from your own area", text: "For home tuition we only suggest tutors from your neighbourhood — never across town." },
  { Icon: ShieldIcon, title: "ID-checked & grade-verified", text: "Every tutor's CNIC is checked by our team, and their grades in the subjects they teach count." },
  { Icon: UsersIcon, title: "Male & female tutors", text: "Prefer a female or male tutor? Tell us and we'll only suggest tutors who match." },
  { Icon: MonitorIcon, title: "Home or online", text: "Lessons at your home, online, or a mix — whatever suits your family." },
  { Icon: ClockIcon, title: "A short list in hours", text: "No endless directory. A few hand-picked tutors, usually within hours." },
];

const STEP_ICONS = [SearchIcon, UsersIcon, PointerIcon, CalendarIcon, RocketIcon];

export default async function HomePage() {
  const [content, listings, tutorCounts, googleReviews, featured, stats] = await Promise.all([
    getSiteContent(),
    getOpenOpportunityListings(),
    getVerifiedTutorCounts(),
    getGoogleReviews(),
    getFeaturedTutors(),
    getPublicStats(),
  ]);
  const parentFaqs = content.faqs.filter((f) => f.audience === "parent").slice(0, 6);
  const whatsapp = content.whatsappNumber ? internationalDigits(content.whatsappNumber) : "";
  const hasContact = Boolean(whatsapp || content.phoneNumber || content.contactEmail);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-rose-50/80 via-white to-white">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom,black,transparent_80%)]" />
        <div className={`${container} relative grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-[1.15fr_1fr] lg:py-24`}>
          <div className="text-center lg:text-left">
            {content.heroEyebrow && (
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-sm font-medium text-rose-700 shadow-sm ring-1 ring-rose-100">
                <BadgeCheckIcon className="h-4 w-4 text-rose-600" />
                {content.heroEyebrow.trim()}
              </span>
            )}
            <h1 className="mt-6 font-heading text-4xl font-bold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.5rem]">
              {content.heroHeadline}
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-600 lg:mx-0">{content.heroSubheadline}</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <Link href="/find-a-tutor" className={`${btnPrimary} px-7 py-3.5 text-base`}>
                Find a tutor <ArrowRightIcon />
              </Link>
              <Link href="/become-a-tutor" className={`${btnSecondary} px-7 py-3.5 text-base`}>
                Become a tutor
              </Link>
            </div>
            <ul className="mt-8 grid grid-cols-2 gap-x-6 gap-y-3 text-left text-sm font-medium text-slate-700 sm:flex sm:flex-wrap sm:justify-center lg:justify-start">
              {TRUST.map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <span className={checkDot}>
                    <CheckIcon />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Lili in a soft rose circle, with two small floating badges. */}
          <div className="relative mx-auto w-full max-w-sm lg:max-w-md">
            <div className="relative aspect-square rounded-full bg-gradient-to-br from-rose-100 via-rose-50 to-amber-50 ring-1 ring-rose-100">
              <div aria-hidden className="absolute inset-6 rounded-full border border-dashed border-rose-200" />
              <Lili className="absolute bottom-[8%] left-1/2 w-[58%] -translate-x-1/2" />
            </div>
            <div className="absolute left-0 top-[12%] flex items-center gap-2.5 rounded-2xl bg-white px-3.5 py-2.5 shadow-lg shadow-slate-900/5 ring-1 ring-slate-100 sm:-left-6">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <ShieldIcon className="h-5 w-5" />
              </span>
              <span className="text-left text-sm leading-tight">
                <span className="block font-semibold text-slate-900">ID verified</span>
                <span className="text-xs text-slate-500">Checked by our team</span>
              </span>
            </div>
            <div className="absolute bottom-[10%] right-0 flex items-center gap-2.5 rounded-2xl bg-white px-3.5 py-2.5 shadow-lg shadow-slate-900/5 ring-1 ring-slate-100 sm:-right-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                <PinIcon className="h-5 w-5" />
              </span>
              <span className="text-left text-sm leading-tight">
                <span className="block font-semibold text-slate-900">Tutors near you</span>
                <span className="text-xs text-slate-500">From your own area</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats — real numbers only, hidden until they're worth showing */}
      {stats.length > 0 && (
        <section className="border-y border-slate-200 bg-white">
          <dl className={`${container} grid grid-cols-2 gap-6 py-10 ${stats.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <dd className="font-heading text-3xl font-bold text-slate-900 sm:text-4xl">{s.value}+</dd>
                <dt className="mt-1 text-sm font-medium text-slate-500">{s.label}</dt>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* What we teach */}
      <section className={`${container} ${sectionY}`}>
        <SectionHeading
          kicker="What we teach"
          title="Every class, one trusted service"
          intro="From primary school to university — home tuition and online classes with tutors who are strong in exactly the subjects you need."
        />
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PUBLIC_SUBJECTS.map((s) => (
            <SubjectCard key={s.key} subject={s} />
          ))}
        </div>
        <p className="mt-10 text-center">
          <Link href="/subjects" className="inline-flex items-center gap-1.5 text-sm font-semibold text-rose-600 hover:text-rose-700">
            See all subjects <ArrowRightIcon />
          </Link>
        </p>
      </section>

      {/* Why parents choose us */}
      <section className="bg-slate-50">
        <div className={`${container} ${sectionY}`}>
          <SectionHeading kicker="Why families choose us" title="Tutoring you can trust" intro={content.parentPitch} />
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {WHY.map(({ Icon, title, text }) => (
              <div key={title} className={`${card} flex gap-4`}>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                  <Icon className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="font-heading text-base font-semibold text-slate-900">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works — numbered steps (editable in /website-content) */}
      <section className={`${container} ${sectionY}`}>
        <SectionHeading kicker="How it works" title="Simple steps to get started" />
        <ol className="relative mt-14 grid grid-cols-1 gap-8 lg:grid-cols-5 lg:gap-6">
          {content.howItWorksSteps.map((step, i) => {
            const Icon = STEP_ICONS[i % STEP_ICONS.length];
            const last = i === content.howItWorksSteps.length - 1;
            return (
              <li key={i} className="relative flex gap-5 lg:flex-col lg:items-center lg:text-center">
                {!last && (
                  <span
                    aria-hidden
                    className="absolute left-7 top-16 h-[calc(100%-2rem)] w-px bg-slate-200 lg:left-[calc(50%+2.5rem)] lg:top-7 lg:h-px lg:w-[calc(100%-5rem+1.5rem)]"
                  />
                )}
                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-rose-600 shadow-sm ring-1 ring-slate-200">
                  <Icon className="h-6 w-6" />
                  <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-600 text-xs font-semibold text-white ring-2 ring-white">
                    {i + 1}
                  </span>
                </div>
                <div className="pb-2 lg:mt-5">
                  <h3 className="font-heading text-base font-semibold text-slate-900">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{step.text}</p>
                </div>
              </li>
            );
          })}
        </ol>
        <div className="mt-12 text-center">
          <Link href="/find-a-tutor" className={btnPrimary}>
            Get started — it&apos;s free <ArrowRightIcon />
          </Link>
        </div>
      </section>

      {/* Featured tutors — only once at least one is featured */}
      {featured.length > 0 && (
        <section className="bg-slate-50">
          <div className={`${container} ${sectionY}`}>
            <SectionHeading kicker="Featured tutors" title="Meet some of our tutors" intro="ID-checked by our team, with the grades and experience to back it up." />
            {/* Centred, so one or two featured tutors don't sit off to the left. */}
            <div className="mt-12 flex flex-wrap justify-center gap-6">
              {featured.slice(0, 3).map((t) => (
                <div key={t.id} className="flex w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] [&>a]:w-full">
                  <TutorCard tutor={t} />
                </div>
              ))}
            </div>
            <p className="mt-10 text-center">
              <Link href="/our-tutors" className={btnSecondary}>
                See all tutors <ArrowRightIcon />
              </Link>
            </p>
          </div>
        </section>
      )}

      {/* What's near you — verified tutors for parents, tuitions for tutors */}
      <NearYouSection listings={listings} tutorCounts={tutorCounts} />

      {/* Tutor call-out */}
      <section className={`${container} pb-16 sm:pb-24`}>
        <div className="grid items-center gap-10 overflow-hidden rounded-3xl bg-slate-900 px-6 py-12 sm:px-12 lg:grid-cols-2 lg:py-16">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-rose-400">For tutors</p>
            <h2 className="mt-2 font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl">Looking for tuitions near you?</h2>
            <p className="mt-4 text-base leading-relaxed text-slate-300">{content.tutorPitch}</p>
            <ul className="mt-6 space-y-2.5 text-sm text-slate-200">
              {["Free to register", "Students from your own area — less travel", "Matched to the subjects you're strongest in"].map((t) => (
                <li key={t} className="flex items-center gap-2.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500/20 text-rose-300">
                    <CheckIcon />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/become-a-tutor" className={btnPrimary}>
                Register as a tutor
              </Link>
              <Link href="/opportunities" className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white ring-1 ring-inset ring-white/30 transition hover:bg-white/10">
                Browse tuition jobs
              </Link>
            </div>
          </div>
          <div className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/15 text-rose-300">
                <BriefcaseIcon className="h-6 w-6" />
              </span>
              <p className="font-heading text-lg font-semibold text-white">
                {listings.length > 0
                  ? `${listings.length} open tuition${listings.length === 1 ? "" : "s"} right now`
                  : "New tuitions every week"}
              </p>
            </div>
            {listings.length > 0 ? (
              <ul className="mt-5 divide-y divide-white/10">
                {listings.slice(0, 4).map((l) => (
                  <li key={l.opportunityCode} className="flex items-center justify-between gap-4 py-3 text-sm">
                    <span className="min-w-0 truncate font-medium text-white">{l.subjects.join(", ") || "Tutor needed"}</span>
                    <span className="shrink-0 text-slate-400">{l.deliveryMode === "online" ? "Online" : l.area}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm leading-relaxed text-slate-400">
                Register now and we&apos;ll match you as soon as a student near you needs a tutor.
              </p>
            )}
            <Link href="/opportunities" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-rose-300 hover:text-rose-200">
              See all tuition jobs <ArrowRightIcon />
            </Link>
          </div>
        </div>
      </section>

      {/* Live Google rating + reviews (hidden until a Place ID is set) */}
      <GoogleReviewsSection data={googleReviews} />

      {/* Testimonials */}
      {content.testimonials.length > 0 && (
        <section className="bg-slate-50">
          <div className={`${container} ${sectionY}`}>
            <SectionHeading kicker="Testimonials" title="What families say" />
            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {content.testimonials.map((t, i) => (
                <figure key={i} className={`${card} flex flex-col`}>
                  <div className="flex gap-0.5 text-amber-400">
                    {Array.from({ length: 5 }, (_, s) => (
                      <span key={s} aria-hidden>
                        ★
                      </span>
                    ))}
                  </div>
                  <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-slate-700">&ldquo;{t.quote}&rdquo;</blockquote>
                  <figcaption className="mt-5 flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-100 text-sm font-semibold text-rose-700">
                      {t.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="text-sm font-semibold text-slate-900">{t.name}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      {parentFaqs.length > 0 && (
        <section className={`${container} ${sectionY}`}>
          <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
            <div>
              <p className={eyebrow}>FAQ</p>
              <h2 className="mt-2 font-heading text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Questions parents ask</h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600">
                Can&apos;t find your answer? See all questions, or get in touch — we&apos;re happy to help.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/faq" className={btnSecondary}>
                  All questions
                </Link>
                <Link href="/contact" className="inline-flex items-center gap-1.5 px-2 py-3 text-sm font-semibold text-rose-600 hover:text-rose-700">
                  Contact us <ArrowRightIcon />
                </Link>
              </div>
            </div>
            <FaqList faqs={parentFaqs} />
          </div>
        </section>
      )}

      {/* Contact strip — only the channels that are set */}
      {hasContact && (
        <section className={`${container} pb-10`}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {whatsapp && (
              <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className={`${card} flex items-center gap-4 hover:ring-slate-300`}>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <WhatsAppIcon className="h-6 w-6 fill-current" />
                </span>
                <span className="text-sm">
                  <span className="block font-semibold text-slate-900">WhatsApp us</span>
                  <span className="text-slate-600">{content.whatsappNumber}</span>
                </span>
              </a>
            )}
            {content.phoneNumber && (
              <a href={`tel:+${internationalDigits(content.phoneNumber)}`} className={`${card} flex items-center gap-4 hover:ring-slate-300`}>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                  <PhoneIcon className="h-6 w-6" />
                </span>
                <span className="text-sm">
                  <span className="block font-semibold text-slate-900">Call us</span>
                  <span className="text-slate-600">{content.phoneNumber}</span>
                </span>
              </a>
            )}
            {content.contactEmail && (
              <a href={`mailto:${content.contactEmail}`} className={`${card} flex items-center gap-4 hover:ring-slate-300`}>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                  <MailIcon className="h-6 w-6" />
                </span>
                <span className="min-w-0 text-sm">
                  <span className="block font-semibold text-slate-900">Email us</span>
                  <span className="block truncate text-slate-600">{content.contactEmail}</span>
                </span>
              </a>
            )}
          </div>
        </section>
      )}

      <CtaBand />
    </>
  );
}
