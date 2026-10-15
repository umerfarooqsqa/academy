// Blog articles (/blog, SEO + GEO, 2026-10-15). Public reads only ever see
// published articles — drafts 404 and never reach the sitemap or llms.txt.

import { prisma } from "@/lib/db";
import { slugify } from "@/lib/richText";

export const PUBLISHED = { status: "published" } as const;

export function getPublishedArticles() {
  return prisma.article.findMany({
    where: PUBLISHED,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    select: { slug: true, title: true, description: true, body: true, publishedAt: true, updatedAt: true },
  });
}

export function getPublishedArticle(slug: string) {
  return prisma.article.findFirst({ where: { ...PUBLISHED, slug } });
}

export const ARTICLE_LIMITS = { title: 120, description: 200, body: 30000 } as const;

/** Validates staff input for creating/updating an article (2026-10-15). */
export function parseArticleInput(
  body: Record<string, unknown>,
  partial: boolean,
): { data: { title?: string; slug?: string; description?: string; body?: string; status?: "draft" | "published" } } | { error: string } {
  const data: { title?: string; slug?: string; description?: string; body?: string; status?: "draft" | "published" } = {};
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  if ("title" in body || !partial) {
    const t = str(body.title);
    if (!t) return { error: "Title is required" };
    if (t.length > ARTICLE_LIMITS.title) return { error: `Title must be ${ARTICLE_LIMITS.title} characters or fewer` };
    data.title = t;
  }
  if ("slug" in body || !partial) {
    const s = slugify(str(body.slug) || data.title || "");
    if (!s) return { error: "The address (slug) needs letters or numbers" };
    data.slug = s;
  }
  if ("description" in body || !partial) {
    const d = str(body.description);
    if (!d) return { error: "A short description is required (it's what Google shows)" };
    if (d.length > ARTICLE_LIMITS.description) return { error: `Description must be ${ARTICLE_LIMITS.description} characters or fewer` };
    data.description = d;
  }
  if ("body" in body || !partial) {
    const b = typeof body.body === "string" ? body.body.replace(/\r\n/g, "\n").trim() : "";
    if (!b) return { error: "The article is empty" };
    if (b.length > ARTICLE_LIMITS.body) return { error: "The article is too long" };
    data.body = b;
  }
  if ("status" in body) {
    if (body.status !== "draft" && body.status !== "published") return { error: "Status must be draft or published" };
    data.status = body.status;
  }
  return { data };
}
