// /tutors-in-karachi — "tutor in Karachi", "home tutor Karachi", "tuition
// Karachi", "tutor academy Karachi" (SEO + GEO, 2026-10-15). Real data only:
// live verified-tutor counts per area (lib/tutors/verified.ts) and open
// tuitions (lib/opportunities/digest.ts). Each area links to its own page.

import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getSiteContent } from "@/lib/siteContent";
import { getVerifiedTutorCounts } from "@/lib/tutors/verified";
import { getOpenOpportunityListings } from "@/lib/opportunities/digest";
import { areaPath } from "@/lib/seo/areas";
import { breadcrumbLd, faqLd, serviceLd } from "@/lib/seo/jsonLd";
import { PUBLIC_SUBJECTS, subjectPath } from "@/lib/publicSubjects";
import JsonLd from "../JsonLd";
import { CtaBand, FaqList } from "../sections";
import { FactGrid, LandingHero, LinkGrid, Prose, plural } from "../landing";
import { container } from "../ui";

export const dynamic = "force-dynamic";

const PATH = "/tutors-in-karachi";
const DESCRIPTION =
  "Find ID-checked home tutors in Karachi from your own area — Gulshan, Clifton, DHA, North Nazimabad and more. O/A-levels, Matric, FSc. Free demo class.";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getSiteContent();
  return {
    title: { absolute: `Tutors in Karachi — Home Tutors by Area | ${c.siteName}` },
    description: DESCRIPTION,
    alternates: { canonical: PATH },
    openGraph: { url: PATH, title: `Tutors in Karachi | ${c.siteName}`, description: DESCRIPTION },
  };
}

export default async function TutorsInKarachiPage() {
  const [c, zones, counts, listings] = await Promise.all([
    getSiteContent(),
    prisma.areaZone.findMany({ orderBy: { name: "asc" } }),
    getVerifiedTutorCounts(),
    getOpenOpportunityListings(),
  ]);
  const totalVerified = counts.reduce((n, z) => n + z.verified, 0);
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Tutors in Karachi", path: PATH },
  ];
  const faqs = [
    {
      q: "How do I find a good home tutor in Karachi?",
      a: `Tell us the class, subjects and your area on our website or WhatsApp. ${c.siteName} suggests a short list of ID-checked tutors who live in your area or a nearby one, ranked by their own grades in your subjects — and your first demo class is free.`,
    },
    {
      q: "Which areas of Karachi do you cover?",
      a: `We currently match home tutors in ${zones.map((z) => z.name).join(", ")}. Online classes are available anywhere.`,
    },
    {
      q: "Will the tutor live near me?",
      a: "Yes. For home tuition we only suggest tutors from your own area or a nearby one — never someone travelling across the city.",
    },
    {
      q: "Can I choose a female or male tutor in Karachi?",
      a: "Yes. Tell us your preference when you request a tutor and we'll only suggest tutors who match it.",
    },
    {
      q: "Are your tutors verified?",
      a: "Every tutor shares their CNIC, which our team checks by hand. Tutors marked “Grades verified” have also had their marksheets checked.",
    },
  ];
  const areaLinks = zones.map((z) => {
    const n = counts.find((x) => x.name === z.name)?.verified ?? 0;
    return { href: areaPath(z.name), label: `Tutors in ${z.name}`, note: n > 0 ? plural(n, "verified tutor", "verified tutors") : "Home & online tuition" };
  });

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
        kicker="Tutor academy in Karachi"
        title="Home tutors in Karachi, from your own area"
        intro={`${c.siteName} is a tutor academy in Karachi that matches students with ID-checked home tutors who live nearby — for every class from primary and Matric to O/A-levels, FSc and university. Tell us what you need and we'll suggest a short list, usually within hours. Your first demo class is free.`}
      />
      <div className={`${container} space-y-16 py-14 sm:py-20`}>
        <LinkGrid title="Find a tutor in your area of Karachi" links={areaLinks} />
        <Prose title="Why choose a tutor from your own area?">
          <p>
            A tutor who lives nearby arrives on time, doesn&apos;t cancel because of traffic, and can keep teaching for the whole
            year. That&apos;s why we never match a family with a home tutor from across the city.
          </p>
          {(totalVerified > 0 || listings.length > 0) && (
            <p>
              Right now we have{" "}
              {totalVerified > 0 && <strong>{plural(totalVerified, "verified tutor", "verified tutors")}</strong>}
              {totalVerified > 0 && listings.length > 0 && " and "}
              {listings.length > 0 && <strong>{plural(listings.length, "student", "students")} looking for a tutor</strong>} in Karachi.
            </p>
          )}
        </Prose>
        <FactGrid
          facts={[
            { title: "Free demo class", text: "Meet the tutor before you commit to anything." },
            { title: "ID-checked tutors", text: "Every CNIC is checked by our team." },
            { title: "Female or male tutor", text: "Tell us your preference — we'll only suggest tutors who match." },
            { title: "Home or online", text: "Lessons at home in Karachi, or online from anywhere." },
          ]}
        />
        <LinkGrid
          title="Tutors by subject"
          links={[
            ...PUBLIC_SUBJECTS.map((s) => ({ href: subjectPath(s), label: s.seoTitle, note: s.levels })),
            { href: "/home-tuition", label: "Home tuition in Karachi" },
            { href: "/online-tuition", label: "Online tuition" },
          ]}
        />
        <div>
          <h2 className="font-heading text-2xl font-bold text-slate-900">Questions about tutors in Karachi</h2>
          <div className="mt-5">
            <FaqList faqs={faqs.map((f) => ({ ...f, audience: "parent" as const }))} />
          </div>
        </div>
      </div>
      <CtaBand title="Find your tutor in Karachi" />
    </>
  );
}
