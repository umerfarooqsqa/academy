// /online-tuition — "online tuition", "online tutor", "tutor in Pakistan",
// online tuition for overseas students (SEO + GEO, 2026-10-15). Operator
// confirmed: online students are taken from anywhere in Pakistan and abroad
// (home tuition stays Karachi-only). No country list we can't back up —
// "students abroad" only.

import type { Metadata } from "next";
import { getSiteContent } from "@/lib/siteContent";
import { breadcrumbLd, faqLd, serviceLd } from "@/lib/seo/jsonLd";
import { PUBLIC_SUBJECTS, subjectPath } from "@/lib/publicSubjects";
import JsonLd from "../JsonLd";
import { CtaBand, FaqList } from "../sections";
import { FactGrid, LandingHero, LinkGrid, Prose } from "../landing";
import { container } from "../ui";

export const dynamic = "force-dynamic";

const PATH = "/online-tuition";
const DESCRIPTION =
  "Online tuition with ID-checked tutors for students anywhere in Pakistan and abroad — O/A-levels, Matric, FSc, Computer Science and more. Free demo class.";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getSiteContent();
  return {
    title: { absolute: `Online Tuition in Pakistan & Abroad | ${c.siteName}` },
    description: DESCRIPTION,
    alternates: { canonical: PATH },
    openGraph: { url: PATH, title: `Online tuition | ${c.siteName}`, description: DESCRIPTION },
  };
}

export default async function OnlineTuitionPage() {
  const c = await getSiteContent();
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Online tuition", path: PATH },
  ];
  const faqs = [
    {
      q: "How does online tuition work?",
      a: "Tell us the class, subjects and times that suit you. We suggest ID-checked tutors who teach those subjects online; you meet your chosen tutor in a free demo class, and lessons then happen one-on-one over a video call.",
    },
    {
      q: "Can students outside Karachi take online classes?",
      a: "Yes. Online tuition is open to students anywhere in Pakistan — Lahore, Islamabad, Rawalpindi, Faisalabad, Peshawar or anywhere else — and to Pakistani and international students living abroad.",
    },
    {
      q: "Do you teach students living abroad?",
      a: "Yes. Students abroad can take online classes with our tutors — just tell us your time zone and the times that suit you when you request a tutor.",
    },
    {
      q: "Is online tuition as good as home tuition?",
      a: "For most subjects, yes — and for Computer Science it's often better, because tutor and student can share screens. Some younger children focus better in person, which is why we offer both.",
    },
    {
      q: "Is the first online class free?",
      a: "Yes. Your first demo class with the tutor you choose is free.",
    },
  ];

  return (
    <>
      <JsonLd data={breadcrumbLd(crumbs)} />
      <JsonLd
        data={serviceLd({ name: "Online tuition", serviceType: "Online tuition", path: PATH, description: DESCRIPTION, areaServed: ["Pakistan", "Worldwide"] })}
      />
      <JsonLd data={faqLd(faqs)} />
      <LandingHero
        breadcrumbs={crumbs}
        kicker="Online tuition"
        title="Online tuition with verified tutors — anywhere in Pakistan and abroad"
        intro={`${c.siteName} offers one-on-one online tuition with ID-checked tutors for students anywhere in Pakistan and abroad — primary, Matric, O/A-levels, FSc, Computer Science, skills and university subjects. Tutors are matched by their own grades in your subjects, and your first demo class is free.`}
        primary={{ href: "/find-a-tutor?mode=online", label: "Find an online tutor" }}
      />
      <div className={`${container} space-y-16 py-14 sm:py-20`}>
        <Prose title="Who is online tuition for?">
          <p>
            Online tuition suits students in any city of Pakistan, families living abroad who want a tutor who knows the Pakistani or
            Cambridge syllabus, and anyone whose schedule makes travel hard. All you need is a phone, tablet or computer and a stable
            internet connection.
          </p>
          <p>
            Live in Karachi and prefer a tutor at home? See <a href="/home-tuition" className="font-semibold text-rose-600">home tuition in Karachi</a>.
          </p>
        </Prose>
        <FactGrid
          facts={[
            { title: "Anywhere in Pakistan and abroad", text: "Study from any city, or from overseas — just tell us your time zone." },
            { title: "Free demo class", text: "Meet your tutor online before you commit." },
            { title: "Grade-matched tutors", text: "Tutors are ranked by their own grades in your subjects." },
            { title: "Female or male tutor", text: "Tell us your preference and we'll match it." },
          ]}
        />
        <LinkGrid title="Online tutors by subject" links={PUBLIC_SUBJECTS.map((s) => ({ href: subjectPath(s), label: s.seoTitle, note: s.levels }))} />
        <div>
          <h2 className="font-heading text-2xl font-bold text-slate-900">Questions about online tuition</h2>
          <div className="mt-5">
            <FaqList faqs={faqs.map((f) => ({ ...f, audience: "parent" as const }))} />
          </div>
        </div>
      </div>
      <CtaBand title="Start online tuition" text="Tell us what you need — it takes about two minutes, and your first demo class is free." />
    </>
  );
}
