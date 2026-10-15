// /blog/<slug> — one published article (SEO + GEO, 2026-10-15), with
// BlogPosting + breadcrumb structured data. Drafts 404.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedArticle, getPublishedArticles } from "@/lib/articles";
import { getSiteContent } from "@/lib/siteContent";
import { formatArticleDate as formatDate, readingMinutes } from "@/lib/richText";
import { articleLd, breadcrumbLd } from "@/lib/seo/jsonLd";
import JsonLd from "../../JsonLd";
import RichText from "../../RichText";
import { Breadcrumbs } from "../../landing";
import { CtaBand } from "../../sections";
import { ArrowRightIcon } from "../../icons";
import { container } from "../../ui";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = await getPublishedArticle((await params).slug);
  if (!a) return { title: "Article not found", robots: { index: false } };
  return {
    title: a.title,
    description: a.description,
    alternates: { canonical: `/blog/${a.slug}` },
    openGraph: {
      type: "article",
      url: `/blog/${a.slug}`,
      title: a.title,
      description: a.description,
      ...(a.publishedAt ? { publishedTime: a.publishedAt.toISOString() } : {}),
      modifiedTime: a.updatedAt.toISOString(),
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const slug = (await params).slug;
  const [a, c, all] = await Promise.all([getPublishedArticle(slug), getSiteContent(), getPublishedArticles()]);
  if (!a) notFound();
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog" },
    { name: a.title, path: `/blog/${a.slug}` },
  ];
  const more = all.filter((x) => x.slug !== a.slug).slice(0, 3);
  const updated = a.publishedAt && a.updatedAt.getTime() - a.publishedAt.getTime() > 86_400_000;

  return (
    <>
      <JsonLd data={articleLd(a, c.siteName)} />
      <JsonLd data={breadcrumbLd(crumbs)} />
      <article className={`${container} max-w-3xl py-10 sm:py-14`}>
        <Breadcrumbs items={crumbs} />
        <h1 className="mt-8 font-heading text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl">{a.title}</h1>
        <p className="mt-4 text-lg leading-relaxed text-slate-600">{a.description}</p>
        <p className="mt-4 text-sm text-slate-500">
          By {c.siteName} · {formatDate(a.publishedAt)}
          {updated && ` · Updated ${formatDate(a.updatedAt)}`} · {readingMinutes(a.body)} min read
        </p>
        <hr className="my-8 border-slate-200" />
        <RichText body={a.body} />
      </article>
      {more.length > 0 && (
        <section className={`${container} max-w-3xl pb-14`}>
          <h2 className="font-heading text-xl font-semibold text-slate-900">More guides</h2>
          <ul className="mt-4 divide-y divide-slate-200 rounded-2xl ring-1 ring-slate-200">
            {more.map((m) => (
              <li key={m.slug}>
                <Link href={`/blog/${m.slug}`} className="flex items-center justify-between gap-4 px-5 py-4 text-sm hover:bg-slate-50">
                  <span className="font-medium text-slate-900">{m.title}</span>
                  <ArrowRightIcon className="h-4 w-4 shrink-0 text-slate-400" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <CtaBand />
    </>
  );
}
