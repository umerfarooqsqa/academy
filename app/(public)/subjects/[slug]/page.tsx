// /subjects/<slug> — one landing page per subject level (SEO + GEO,
// 2026-10-15): "O level tutor", "Matric tuition", "FSc tutor Karachi"…
// Content lives in lib/publicSubjects.ts (title, direct-answer intro, FAQs).

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PUBLIC_SUBJECTS, findTutorHref, subjectPath } from "@/lib/publicSubjects";
import { areaPath } from "@/lib/seo/areas";
import { breadcrumbLd, faqLd, serviceLd } from "@/lib/seo/jsonLd";
import JsonLd from "../../JsonLd";
import { CtaBand, FaqList } from "../../sections";
import { FactGrid, LandingHero, LinkGrid, Prose } from "../../landing";
import { container } from "../../ui";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

const find = (slug: string) => PUBLIC_SUBJECTS.find((s) => s.slug === slug) ?? null;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const s = find((await params).slug);
  if (!s) return { title: "Subject not found", robots: { index: false } };
  return {
    title: s.seoTitle,
    description: s.metaDescription,
    alternates: { canonical: subjectPath(s) },
    openGraph: { url: subjectPath(s), title: s.seoTitle, description: s.metaDescription },
  };
}

export default async function SubjectPage({ params }: Props) {
  const s = find((await params).slug);
  if (!s) notFound();
  const zones = await prisma.areaZone.findMany({ select: { name: true }, orderBy: { name: "asc" } });
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Subjects", path: "/subjects" },
    { name: s.title, path: subjectPath(s) },
  ];

  return (
    <>
      <JsonLd data={breadcrumbLd(crumbs)} />
      <JsonLd
        data={serviceLd({
          name: s.seoTitle,
          serviceType: `${s.title} tuition`,
          path: subjectPath(s),
          description: s.metaDescription,
          areaServed: ["Karachi", "Pakistan"],
        })}
      />
      <JsonLd data={faqLd(s.faqs)} />
      <LandingHero
        breadcrumbs={crumbs}
        kicker={s.levels}
        title={s.seoTitle}
        intro={s.intro}
        primary={{ href: findTutorHref(s), label: `Find a ${s.title} tutor` }}
      />
      <div className={`${container} space-y-16 py-14 sm:py-20`}>
        <Prose title={`What do our ${s.title} tutors teach?`}>
          <p>{s.description}</p>
          <ul className="flex flex-wrap gap-2">
            {s.subjects.map((x) => (
              <li key={x} className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">
                {x}
              </li>
            ))}
          </ul>
          <p className="text-sm text-slate-500">Don&apos;t see your subject? Ask anyway — tell us what you need and we&apos;ll look for the right tutor.</p>
        </Prose>
        <FactGrid
          facts={[
            { title: "Matched by grades", text: "Tutors are ranked by their own grades in the subjects you need." },
            { title: "Home or online", text: "A home tutor from your area of Karachi, or online from anywhere." },
            { title: "Free demo class", text: "Meet the tutor before you commit." },
            { title: "Female or male tutor", text: "Tell us your preference and we'll match it." },
          ]}
        />
        <LinkGrid
          title={`${s.title} tutors near you`}
          links={[
            ...zones.map((z) => ({ href: areaPath(z.name), label: `Tutors in ${z.name}` })),
            { href: "/online-tuition", label: `Online ${s.title} tuition` },
          ]}
        />
        <LinkGrid
          title="Other subjects"
          links={PUBLIC_SUBJECTS.filter((x) => x.slug !== s.slug).map((x) => ({ href: subjectPath(x), label: x.seoTitle, note: x.levels }))}
        />
        <div>
          <h2 className="font-heading text-2xl font-bold text-slate-900">Questions about {s.title} tuition</h2>
          <div className="mt-5">
            <FaqList faqs={s.faqs.map((f) => ({ ...f, audience: "parent" as const }))} />
          </div>
        </div>
      </div>
      <CtaBand title={`Find a ${s.title} tutor`} />
    </>
  );
}
