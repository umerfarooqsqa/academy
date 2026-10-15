// /articles — write and publish blog guides for /blog (SEO + GEO,
// 2026-10-15). Staff-accessible.

import { prisma } from "@/lib/db";
import { pageTitle } from "@/app/components/ui";
import ArticlesClient from "./ArticlesClient";

export const dynamic = "force-dynamic";

export default async function ArticlesPage() {
  const articles = await prisma.article.findMany({ orderBy: [{ updatedAt: "desc" }] });
  return (
    <main>
      <h1 className={pageTitle}>Blog articles</h1>
      <p className="mt-1 text-sm text-gray-500">
        Guides published at <a href="/blog" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">/blog</a> help the
        site rank on Google and get quoted by AI assistants. Write for parents and tutors, answer one real question per article, and link to
        pages like /tutors-in-karachi or /online-tuition.
      </p>
      <ArticlesClient
        articles={articles.map((a) => ({ ...a, publishedAt: a.publishedAt?.toISOString() ?? null, updatedAt: a.updatedAt.toISOString(), createdAt: a.createdAt.toISOString() }))}
      />
    </main>
  );
}
