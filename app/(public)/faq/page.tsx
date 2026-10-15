// Public /faq (2026-10-15 redesign) — every question from /website-content,
// grouped for parents and tutors, plus FAQPage structured data for Google.

import type { Metadata } from "next";
import Link from "next/link";
import { getSiteContent } from "@/lib/siteContent";
import { CtaBand, FaqList, PageHeader } from "../sections";
import { container, eyebrow, textLink } from "../ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Frequently asked questions",
  description: "How matching works, the free demo class, fees, verification, home and online tuition, and becoming a tutor.",
};

export default async function FaqPage() {
  const content = await getSiteContent();
  const parent = content.faqs.filter((f) => f.audience === "parent");
  const tutor = content.faqs.filter((f) => f.audience === "tutor");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: content.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <PageHeader kicker="FAQ" title="Frequently asked questions" intro="Everything families and tutors usually ask us. Still unsure? Just get in touch.">
        <div className="mt-6 flex justify-center gap-6 text-sm">
          {parent.length > 0 && (
            <a href="#for-parents" className={textLink}>
              For parents
            </a>
          )}
          {tutor.length > 0 && (
            <a href="#for-tutors" className={textLink}>
              For tutors
            </a>
          )}
        </div>
      </PageHeader>
      <div className={`${container} max-w-3xl space-y-14 py-16 sm:py-20`}>
        {parent.length > 0 && (
          <section id="for-parents" className="scroll-mt-24">
            <p className={eyebrow}>For parents</p>
            <h2 className="mb-6 mt-1 font-heading text-2xl font-bold text-slate-900">Finding a tutor</h2>
            <FaqList faqs={parent} />
          </section>
        )}
        {tutor.length > 0 && (
          <section id="for-tutors" className="scroll-mt-24">
            <p className={eyebrow}>For tutors</p>
            <h2 className="mb-6 mt-1 font-heading text-2xl font-bold text-slate-900">Teaching with us</h2>
            <FaqList faqs={tutor} />
          </section>
        )}
        <p className="text-center text-sm text-slate-600">
          Didn&apos;t find your answer?{" "}
          <Link href="/contact" className={textLink}>
            Contact us
          </Link>
        </p>
      </div>
      <CtaBand />
    </>
  );
}
