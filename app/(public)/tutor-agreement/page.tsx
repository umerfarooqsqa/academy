// /tutor-agreement — public Tutor Agreement (2026-10-19): what tutors must
// read and agree to before registering, including the no-direct-dealing rule.
// Edited by staff in /website-content (SiteContent.tutorAgreement; starting
// draft in lib/defaultTutorAgreement.ts). The same text is shown in full on
// /become-a-tutor, and each tutor's accepted copy is kept in TermsAcceptance.

import type { Metadata } from "next";
import Link from "next/link";
import { getSiteContent, internationalDigits } from "@/lib/siteContent";
import { visibleSections } from "@/lib/agreementSnapshot";
import LegalSections, { formatLegalDate } from "../LegalSections";
import { container, textLink } from "../ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: "/tutor-agreement" },
  title: "Tutor Agreement",
  description: "The agreement every tutor accepts when registering with us, including how introductions to families work.",
};

export default async function TutorAgreementPage() {
  const c = await getSiteContent();
  const sections = visibleSections(c.tutorAgreement);
  const wa = c.whatsappNumber ? internationalDigits(c.whatsappNumber) : "";

  return (
    <div className={`${container} max-w-3xl py-14 sm:py-16`}>
      <h1 className="font-heading text-4xl font-bold tracking-tight text-slate-900">Tutor Agreement</h1>
      <p className="mt-2 text-sm text-slate-500">Last updated {formatLegalDate(c.tutorAgreementUpdatedOn)}</p>
      <p className="mt-4 text-base leading-relaxed text-slate-600">
        Every tutor agrees to this when they register with {c.siteName}. Please read it carefully — it explains how
        introductions to families work and what happens if a tuition is arranged without us.
      </p>

      {sections.length > 1 && (
        <nav aria-label="Contents" className="mt-8 rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
          <p className="text-sm font-semibold text-slate-900">Contents</p>
          <ol className="mt-3 grid list-decimal gap-x-8 gap-y-1.5 pl-5 text-sm text-slate-600 sm:grid-cols-2">
            {sections.map((s, i) => (
              <li key={i}>
                <a href={`#section-${i + 1}`} className="hover:text-rose-600">
                  {s.heading || `Section ${i + 1}`}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}

      <LegalSections sections={sections} />

      <section className="mt-12 rounded-2xl bg-slate-50 p-6 ring-1 ring-slate-200">
        <h2 className="font-heading text-lg font-semibold text-slate-900">Questions about this agreement?</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {wa ? (
            <>
              WhatsApp us on{" "}
              <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className={textLink}>
                {c.whatsappNumber}
              </a>{" "}
              before you register.
            </>
          ) : (
            <>
              <Link href="/contact" className={textLink}>
                Contact us
              </Link>{" "}
              before you register.
            </>
          )}{" "}
          See also our{" "}
          <Link href="/terms" className={textLink}>
            Terms &amp; Conditions
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className={textLink}>
            Privacy Policy
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
