// /sitemap.xml (SEO, 2026-10-15) — fixed pages plus everything generated from
// the database: area pages (AreaZone), subject pages, featured tutor
// profiles and published articles. Built per request (never at build time —
// CI has no database).

import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { buildSitemap } from "@/lib/seo/routes";
import { areaPath } from "@/lib/seo/areas";
import { PUBLIC_SUBJECTS, subjectPath } from "@/lib/publicSubjects";
import { getFeaturedTutors } from "@/lib/tutors/publicProfile";
import { getPublishedArticles } from "@/lib/articles";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [zones, tutors, articles] = await Promise.all([
    prisma.areaZone.findMany({ select: { name: true } }),
    getFeaturedTutors(),
    getPublishedArticles(),
  ]);
  return buildSitemap([
    ...zones.map((z) => ({ path: areaPath(z.name), priority: 0.8 })),
    ...PUBLIC_SUBJECTS.map((s) => ({ path: subjectPath(s), priority: 0.8 })),
    ...tutors.map((t) => ({ path: `/our-tutors/${t.id}`, priority: 0.5 })),
    ...articles.map((a) => ({ path: `/blog/${a.slug}`, lastModified: a.updatedAt, priority: 0.6 })),
  ]);
}
