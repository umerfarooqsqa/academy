// /about — who we are, in plain facts (SEO E-E-A-T + GEO, 2026-10-15): what
// the academy is, how tutors are verified, how matching works, where we
// teach. AI assistants quote pages like this, so every statement here must
// stay true — it mirrors the actual rules in lib/matching and
// lib/tutors/verified.ts.

import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getSiteContent } from "@/lib/siteContent";
import { areaPath } from "@/lib/seo/areas";
import { breadcrumbLd } from "@/lib/seo/jsonLd";
import JsonLd from "../JsonLd";
import { CtaBand } from "../sections";
import { LandingHero, LinkGrid, Prose } from "../landing";
import { container } from "../ui";

export const dynamic = "force-dynamic";

const PATH = "/about";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getSiteContent();
  const description = `${c.siteName} is a tutor academy in Karachi: ID-checked home tutors from your own area, and online tutors across Pakistan and abroad.`;
  return {
    title: "About us — a tutor academy in Karachi",
    description,
    alternates: { canonical: PATH },
    openGraph: { url: PATH, description },
  };
}

export default async function AboutPage() {
  const [c, zones] = await Promise.all([getSiteContent(), prisma.areaZone.findMany({ select: { name: true }, orderBy: { name: "asc" } })]);
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "About us", path: PATH },
  ];

  return (
    <>
      <JsonLd data={breadcrumbLd(crumbs)} />
      <LandingHero
        breadcrumbs={crumbs}
        kicker="About us"
        title={`About ${c.siteName}`}
        intro={`${c.siteName} is a tutor academy based in Karachi, Pakistan, and part of Suntex Services. We match students with ID-checked home tutors who live in their own area of Karachi, and with online tutors for students anywhere in Pakistan and abroad — for every class from primary to university.`}
      />
      <div className={`${container} max-w-4xl space-y-14 py-14 sm:py-20`}>
        <Prose title="What we do">
          <p>
            Families tell us the class, subjects and area they need help with. We suggest a short list of suitable tutors — usually
            within hours — and the family chooses one. The first demo class is free; if it goes well, lessons begin.
          </p>
          <p>Tutors register with us free, and we match them with students close to where they live, so they spend less time travelling.</p>
        </Prose>
        <Prose title="How we check tutors">
          <p>
            Every tutor shares a photo of their CNIC, which our team checks by hand before the tutor can be suggested as verified. Tutors
            also tell us the grades they achieved in each subject they teach and share their marksheets; tutors marked “Grades verified”
            have had those marksheets checked by our team.
          </p>
        </Prose>
        <Prose title="How we match students and tutors">
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong>Same area first.</strong> For home tuition we only consider tutors from the student&apos;s own area, or a nearby one
              when there&apos;s nobody in the same area — never across the city.
            </li>
            <li>
              <strong>Right subjects and level.</strong> Tutors must teach the subjects and level the student needs.
            </li>
            <li>
              <strong>Ranked by strength.</strong> Tutors are ranked by their own grades in those subjects, ratings from other families
              and availability.
            </li>
            <li>
              <strong>Your preferences.</strong> Families can ask for a female or male tutor, and choose home or online lessons.
            </li>
            <li>
              <strong>Checked by people.</strong> Our team reviews every match before a family sees it.
            </li>
          </ul>
        </Prose>
        <LinkGrid
          title="Where we teach"
          links={[
            ...zones.map((z) => ({ href: areaPath(z.name), label: `Home tutors in ${z.name}` })),
            { href: "/online-tuition", label: "Online — anywhere in Pakistan and abroad" },
          ]}
        />
        <Prose title="Contact us">
          <p>
            {c.whatsappNumber && <>WhatsApp: {c.whatsappNumber}. </>}
            {c.contactEmail && <>Email: {c.contactEmail}. </>}
            Or visit our <a href="/contact" className="font-semibold text-rose-600">contact page</a>.
          </p>
        </Prose>
      </div>
      <CtaBand />
    </>
  );
}
