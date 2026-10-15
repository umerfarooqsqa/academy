// Public /contact (2026-10-15 redesign) — the channels set in
// /website-content (each hidden while empty) plus the two forms, which are
// always the quickest way in.

import type { Metadata } from "next";
import Link from "next/link";
import { getSiteContent, internationalDigits } from "@/lib/siteContent";
import { PageHeader } from "../sections";
import { ArrowRightIcon, BriefcaseIcon, FacebookFIcon, MailIcon, PhoneIcon, PinIcon, SearchIcon } from "../icons";
import { WhatsAppIcon } from "../WhatsAppButton";
import { card, cardHover, container } from "../ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Get in touch on WhatsApp, by phone or email — or request a tutor online in two minutes.",
};

function Channel({ href, external, icon, tint, title, detail }: { href: string; external?: boolean; icon: React.ReactNode; tint: string; title: string; detail: string }) {
  return (
    <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className={`${cardHover} flex items-center gap-4`}>
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${tint}`}>{icon}</span>
      <span className="min-w-0">
        <span className="block font-heading text-base font-semibold text-slate-900">{title}</span>
        <span className="block truncate text-sm text-slate-600">{detail}</span>
      </span>
    </a>
  );
}

export default async function ContactPage() {
  const c = await getSiteContent();
  const wa = c.whatsappNumber ? internationalDigits(c.whatsappNumber) : "";

  return (
    <>
      <PageHeader kicker="Contact" title="We're here to help" intro="Questions about tutors, fees or tuition jobs? Reach us any way you like." />
      <div className={`${container} grid gap-10 py-16 sm:py-20 lg:grid-cols-[1.3fr_1fr]`}>
        <div>
          <h2 className="font-heading text-xl font-semibold text-slate-900">Get in touch</h2>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {wa && (
              <Channel
                href={`https://wa.me/${wa}?text=${encodeURIComponent("Hi! I have a question.")}`}
                external
                icon={<WhatsAppIcon className="h-6 w-6 fill-current" />}
                tint="bg-emerald-50 text-emerald-600"
                title="WhatsApp"
                detail={c.whatsappNumber}
              />
            )}
            {c.phoneNumber && (
              <Channel
                href={`tel:+${internationalDigits(c.phoneNumber)}`}
                icon={<PhoneIcon className="h-6 w-6" />}
                tint="bg-sky-50 text-sky-600"
                title="Call us"
                detail={c.phoneNumber}
              />
            )}
            {c.contactEmail && (
              <Channel
                href={`mailto:${c.contactEmail}`}
                icon={<MailIcon className="h-6 w-6" />}
                tint="bg-rose-50 text-rose-600"
                title="Email"
                detail={c.contactEmail}
              />
            )}
            {c.facebookUrl && (
              <Channel
                href={c.facebookUrl}
                external
                icon={<FacebookFIcon className="h-6 w-6" />}
                tint="bg-blue-50 text-[#1877F2]"
                title="Facebook"
                detail="Message us on our Page"
              />
            )}
          </div>
          {c.serviceArea && (
            <p className="mt-6 inline-flex items-center gap-2 text-sm text-slate-600">
              <PinIcon className="h-4 w-4 text-slate-400" /> Serving families across {c.serviceArea}.
            </p>
          )}
        </div>
        <div className={`${card} bg-slate-50 p-7`}>
          <h2 className="font-heading text-xl font-semibold text-slate-900">The quickest way</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Skip the back-and-forth — our short forms give us everything we need, and we usually reply within hours.
          </p>
          <div className="mt-6 space-y-3">
            <Link href="/find-a-tutor" className="flex items-center gap-4 rounded-xl bg-white p-4 ring-1 ring-slate-200 transition hover:ring-rose-300">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                <SearchIcon className="h-5 w-5" />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-semibold text-slate-900">I need a tutor</span>
                <span className="text-xs text-slate-500">Free demo class included</span>
              </span>
              <ArrowRightIcon className="h-4 w-4 text-slate-400" />
            </Link>
            <Link href="/become-a-tutor" className="flex items-center gap-4 rounded-xl bg-white p-4 ring-1 ring-slate-200 transition hover:ring-rose-300">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                <BriefcaseIcon className="h-5 w-5" />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-semibold text-slate-900">I want to teach</span>
                <span className="text-xs text-slate-500">Free to register</span>
              </span>
              <ArrowRightIcon className="h-4 w-4 text-slate-400" />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
