// /tutors-in-karachi/<area> — one page per AreaZone (SEO + GEO, 2026-10-15),
// e.g. "home tutor in Gulshan-e-Iqbal". Unique, real content per area: live
// verified tutors in and around it, open tuitions near it, its nearby areas
// (zones within its own maxKm — the same rule matching uses), featured tutors
// based there, and an optional local intro written by the operator on /zones
// (AreaZone.description). A zone added on /zones gets its page automatically.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSiteContent } from "@/lib/siteContent";
import { getVerifiedTutorCounts } from "@/lib/tutors/verified";
import { verifiedNear } from "@/lib/tutors/nearbyCounts";
import { getOpenOpportunityListings } from "@/lib/opportunities/digest";
import { nearbyStatus } from "@/lib/opportunities/nearby";
import { getFeaturedTutors } from "@/lib/tutors/publicProfile";
import { SUBJECT_GROUP_LABELS, type SubjectGroup } from "@/lib/subjectGroups";
import { areaPath, findZoneBySlug, nearbyZones, zonesByDistance } from "@/lib/seo/areas";
import { breadcrumbLd, faqLd, serviceLd } from "@/lib/seo/jsonLd";
import { PUBLIC_SUBJECTS, subjectPath } from "@/lib/publicSubjects";
import JsonLd from "../../JsonLd";
import TutorCard from "../../our-tutors/TutorCard";
import { CtaBand, FaqList } from "../../sections";
import { FactGrid, LandingHero, LinkGrid, Prose, plural } from "../../landing";
import { container } from "../../ui";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ area: string }> };

async function loadZone(slug: string) {
  const zones = await prisma.areaZone.findMany({ orderBy: { name: "asc" } });
  return { zones, zone: findZoneBySlug(zones, slug) };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { area } = await params;
  const [{ zone }, c] = await Promise.all([loadZone(area), getSiteContent()]);
  if (!zone) return { title: "Area not found", robots: { index: false } };
  const path = areaPath(zone.name);
  const description = `Home tutors in ${zone.name}, Karachi — ID-checked tutors from your own area for O/A-levels, Matric, FSc and more. Online classes too. Free demo class.`;
  return {
    title: { absolute: `Home Tutors in ${zone.name}, Karachi | ${c.siteName}` },
    description,
    alternates: { canonical: path },
    openGraph: { url: path, title: `Home tutors in ${zone.name}, Karachi`, description },
  };
}

export default async function AreaPage({ params }: Props) {
  const { area } = await params;
  const { zones, zone } = await loadZone(area);
  if (!zone) notFound();

  const [c, counts, listings, featured] = await Promise.all([
    getSiteContent(),
    getVerifiedTutorCounts(),
    getOpenOpportunityListings(),
    getFeaturedTutors(),
  ]);
  const near = verifiedNear(counts, zone.latitude, zone.longitude);
  const topGroups = Object.entries(near.bySubjectGroup)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  const neighbours = nearbyZones(zone, zones);
  const neighbourNames = neighbours.slice(0, 4).map((z) => z.name);
  const tuitionsHere = listings.filter((l) => l.deliveryMode !== "online" && nearbyStatus(l, zone.latitude, zone.longitude).near);
  const featuredHere = featured.filter((t) => t.area === zone.name).slice(0, 3);
  const path = areaPath(zone.name);
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Tutors in Karachi", path: "/tutors-in-karachi" },
    { name: zone.name, path },
  ];
  const nearbyText = neighbourNames.length ? ` or a nearby area such as ${neighbourNames.join(", ")}` : "";
  const faqs = [
    {
      q: `How do I find a home tutor in ${zone.name}?`,
      a: `Request a tutor on our website or WhatsApp and choose ${zone.name} as your area. We'll suggest ID-checked tutors who live in ${zone.name}${nearbyText}, ranked by their own grades in your subjects. Your first demo class is free.`,
    },
    {
      q: `Do tutors in ${zone.name} come to our home?`,
      a: `Yes — that's home tuition. Because we only suggest tutors from ${zone.name} or close by, they don't have to travel across Karachi to reach you.`,
    },
    {
      q: `Can I get a female tutor in ${zone.name}?`,
      a: "Yes. Tell us you'd prefer a female (or male) tutor when you request one, and we'll only suggest tutors who match.",
    },
    {
      q: `Are online classes available in ${zone.name}?`,
      a: "Yes. Choose online when you request a tutor — online tutors can teach you from anywhere.",
    },
  ];

  return (
    <>
      <JsonLd data={breadcrumbLd(crumbs)} />
      <JsonLd
        data={serviceLd({
          name: `Home tuition in ${zone.name}, Karachi`,
          serviceType: "Home tuition",
          path,
          description: `Home tutors in ${zone.name}, Karachi.`,
          areaServed: [`${zone.name}, Karachi`, ...neighbourNames.map((n) => `${n}, Karachi`)],
        })}
      />
      <JsonLd data={faqLd(faqs)} />
      <LandingHero
        breadcrumbs={crumbs}
        kicker={`${zone.name}, Karachi`}
        title={`Home tutors in ${zone.name}, Karachi`}
        intro={`${c.siteName} matches students in ${zone.name} with ID-checked home tutors who live in ${zone.name}${nearbyText} — for primary, Matric, O/A-levels, FSc, Computer Science and university subjects. Online classes are available too, and your first demo class is free.`}
        primary={{ href: `/find-a-tutor?area=${encodeURIComponent(zone.name)}`, label: `Find a tutor in ${zone.name}` }}
      />
      <div className={`${container} space-y-16 py-14 sm:py-20`}>
        {zone.description && (
          <Prose title={`About tuition in ${zone.name}`}>
            {zone.description
              .split(/\n\s*\n/)
              .map((p) => p.trim())
              .filter(Boolean)
              .map((p, i) => (
                <p key={i}>{p}</p>
              ))}
          </Prose>
        )}

        <Prose title={`Tutors in and around ${zone.name}`}>
          {near.total > 0 ? (
            <p>
              We have <strong>{plural(near.total, "verified tutor", "verified tutors")}</strong> in and around {zone.name} right now
              {topGroups.length > 0 &&
                ` — including ${topGroups.map(([g, n]) => `${n} ${SUBJECT_GROUP_LABELS[g as SubjectGroup] ?? g}`).join(", ")}`}
              . Every one has had their CNIC checked by our team.
            </p>
          ) : (
            <p>
              We&apos;re adding verified tutors in {zone.name} every week. Request a tutor and we&apos;ll search {zone.name}
              {neighbourNames.length > 0 && ` and nearby ${neighbourNames.join(", ")}`} for you — or choose online classes and pick from
              tutors anywhere.
            </p>
          )}
          {tuitionsHere.length > 0 && (
            <p>
              {plural(tuitionsHere.length, "student", "students")} near {zone.name} {tuitionsHere.length === 1 ? "is" : "are"} looking for a
              tutor right now — tutors can see them on our <a href="/opportunities" className="font-semibold text-rose-600">tuition jobs</a> page.
            </p>
          )}
        </Prose>

        {featuredHere.length > 0 && (
          <div>
            <h2 className="font-heading text-2xl font-bold text-slate-900">Featured tutors in {zone.name}</h2>
            <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredHere.map((t) => (
                <TutorCard key={t.id} tutor={t} />
              ))}
            </div>
          </div>
        )}

        <FactGrid
          facts={[
            { title: "Tutors from your own area", text: `Only tutors from ${zone.name} or close by — no long commutes.` },
            { title: "Free demo class", text: "Meet the tutor before you commit to anything." },
            { title: "ID-checked tutors", text: "Every CNIC is checked by our team." },
            { title: "Female or male tutor", text: "Tell us your preference and we'll match it." },
          ]}
        />

        <LinkGrid
          title={`Subjects we teach in ${zone.name}`}
          links={PUBLIC_SUBJECTS.map((s) => ({ href: subjectPath(s), label: s.seoTitle, note: s.levels }))}
        />

        {/* Areas within this zone's own radius are "nearby" (the matching rule);
            if there are none, the three closest are shown as "other areas". */}
        <LinkGrid
          title={neighbours.length > 0 ? "Nearby areas" : "Other areas of Karachi"}
          links={[
            ...(neighbours.length > 0 ? neighbours : zonesByDistance(zone, zones).slice(0, 3)).map((z) => ({
              href: areaPath(z.name),
              label: `Tutors in ${z.name}`,
              note: `about ${z.km.toFixed(1)} km away`,
            })),
            { href: "/tutors-in-karachi", label: "All areas of Karachi" },
          ]}
        />

        <div>
          <h2 className="font-heading text-2xl font-bold text-slate-900">Questions about tutors in {zone.name}</h2>
          <div className="mt-5">
            <FaqList faqs={faqs.map((f) => ({ ...f, audience: "parent" as const }))} />
          </div>
        </div>
      </div>
      <CtaBand title={`Find your tutor in ${zone.name}`} />
    </>
  );
}
