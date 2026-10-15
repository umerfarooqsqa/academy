// /home-tuition — "home tuition", "home tutor", "home tutor Karachi" (SEO +
// GEO, 2026-10-15). Home tuition is Karachi-only; links to every area page.

import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getSiteContent } from "@/lib/siteContent";
import { areaPath } from "@/lib/seo/areas";
import { breadcrumbLd, faqLd, serviceLd } from "@/lib/seo/jsonLd";
import { PUBLIC_SUBJECTS, subjectPath } from "@/lib/publicSubjects";
import JsonLd from "../JsonLd";
import { CtaBand, FaqList } from "../sections";
import { FactGrid, LandingHero, LinkGrid, Prose } from "../landing";
import { container } from "../ui";

export const dynamic = "force-dynamic";

const PATH = "/home-tuition";
const DESCRIPTION =
  "Home tuition in Karachi with ID-checked home tutors from your own area — male or female tutors, every class. Your first demo class is free.";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getSiteContent();
  return {
    title: { absolute: `Home Tuition & Home Tutors in Karachi | ${c.siteName}` },
    description: DESCRIPTION,
    alternates: { canonical: PATH },
    openGraph: { url: PATH, title: `Home tuition in Karachi | ${c.siteName}`, description: DESCRIPTION },
  };
}

export default async function HomeTuitionPage() {
  const [c, zones] = await Promise.all([getSiteContent(), prisma.areaZone.findMany({ select: { name: true }, orderBy: { name: "asc" } })]);
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Home tuition", path: PATH },
  ];
  const faqs = [
    {
      q: "What is home tuition?",
      a: "Home tuition means a tutor comes to your home and teaches your child one-on-one, at times that suit your family.",
    },
    {
      q: "How do you choose a home tutor?",
      a: "We only suggest tutors who live in your area of Karachi or a nearby one, who teach the subjects you need, and we rank them by their own grades in those subjects. Our team checks every match before you see it.",
    },
    {
      q: "Is it safe to have a tutor at home?",
      a: "Every tutor's CNIC is checked by our team before they're ever suggested to you. For young students we recommend that a parent or another adult is at home during lessons.",
    },
    {
      q: "Can I ask for a female home tutor?",
      a: "Yes. Tell us you'd prefer a female (or male) tutor and we'll only suggest tutors who match.",
    },
    {
      q: "Do you offer home tuition outside Karachi?",
      a: "Home tuition is in Karachi for now. Students in other cities can take online tuition with our tutors.",
    },
  ];

  return (
    <>
      <JsonLd data={breadcrumbLd(crumbs)} />
      <JsonLd
        data={serviceLd({
          name: "Home tuition in Karachi",
          serviceType: "Home tuition",
          path: PATH,
          description: DESCRIPTION,
          areaServed: ["Karachi", ...zones.map((z) => `${z.name}, Karachi`)],
        })}
      />
      <JsonLd data={faqLd(faqs)} />
      <LandingHero
        breadcrumbs={crumbs}
        kicker="Home tuition"
        title="Home tuition in Karachi with a tutor from your own area"
        intro={`${c.siteName} arranges home tuition in Karachi: an ID-checked tutor who lives in your area comes to your home and teaches one-on-one — every class from primary and Matric to O/A-levels, FSc and university. You can ask for a female or male tutor, and your first demo class is free.`}
      />
      <div className={`${container} space-y-16 py-14 sm:py-20`}>
        <FactGrid
          facts={[
            { title: "A tutor from your own area", text: "Never someone travelling across Karachi — so lessons start on time." },
            { title: "ID-checked", text: "Every tutor's CNIC is checked by our team." },
            { title: "Female or male tutor", text: "Tell us your preference and we'll match it." },
            { title: "Free demo class", text: "Meet the tutor at home before you commit." },
          ]}
        />
        <LinkGrid title="Home tutors by area" links={[...zones.map((z) => ({ href: areaPath(z.name), label: `Home tutors in ${z.name}` })), { href: "/tutors-in-karachi", label: "All of Karachi" }]} />
        <Prose title="Not in Karachi?">
          <p>
            Our tutors also teach <a href="/online-tuition" className="font-semibold text-rose-600">online</a> — for students anywhere in
            Pakistan and abroad.
          </p>
        </Prose>
        <LinkGrid title="Home tutors by subject" links={PUBLIC_SUBJECTS.map((s) => ({ href: subjectPath(s), label: s.seoTitle, note: s.levels }))} />
        <div>
          <h2 className="font-heading text-2xl font-bold text-slate-900">Questions about home tuition</h2>
          <div className="mt-5">
            <FaqList faqs={faqs.map((f) => ({ ...f, audience: "parent" as const }))} />
          </div>
        </div>
      </div>
      <CtaBand title="Find a home tutor near you" />
    </>
  );
}
