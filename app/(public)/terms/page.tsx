// /terms — public Terms & Conditions (2026-10-15). The sections are edited by
// staff in /website-content (SiteContent.terms; starting draft in
// lib/defaultTerms.ts) and rendered as plain text — paragraphs and "- "
// bullet lists only (LegalSections / lib/legalText.ts), never HTML. "Last updated" is
// stamped automatically when the terms are saved with changes.

import type { Metadata } from "next";
import Link from "next/link";
import { getSiteContent, internationalDigits } from "@/lib/siteContent";
import LegalSections, { formatLegalDate } from "../LegalSections";
import { container, textLink } from "../ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: "/terms" },
  title: "Terms & Conditions",
  description: "The terms for families and tutors using our tutor-matching service.",
};

export default async function TermsPage() {
  const c = await getSiteContent();
  const sections = c.terms.filter((s) => s.heading.trim() || s.body.trim());
  const wa = c.whatsappNumber ? internationalDigits(c.whatsappNumber) : "";

  return (
    <div className={`${container} max-w-3xl py-14 sm:py-16`}>
      <h1 className="font-heading text-4xl font-bold tracking-tight text-slate-900">Terms &amp; Conditions</h1>
      <p className="mt-2 text-sm text-slate-500">Last updated {formatLegalDate(c.termsUpdatedOn)}</p>

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
        <h2 className="font-heading text-lg font-semibold text-slate-900">Questions about these terms?</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {wa && (
            <>
              WhatsApp us on{" "}
              <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className={textLink}>
                {c.whatsappNumber}
              </a>
              {c.contactEmail ? " or email " : "."}
            </>
          )}
          {c.contactEmail && (
            <>
              {!wa && "Email us at "}
              <a href={`mailto:${c.contactEmail}`} className={textLink}>
                {c.contactEmail}
              </a>
              .
            </>
          )}
          {!wa && !c.contactEmail && (
            <Link href="/contact" className={textLink}>
              Contact us
            </Link>
          )}{" "}
          See also our{" "}
          <Link href="/privacy" className={textLink}>
            Privacy Policy
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
