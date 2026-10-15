// /blog — guides for parents and tutors (SEO + GEO, 2026-10-15). Only
// published articles (lib/articles.ts); written by staff on /articles.

import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedArticles } from "@/lib/articles";
import { formatArticleDate as formatDate, readingMinutes } from "@/lib/richText";
import { CtaBand, PageHeader } from "../sections";
import { ArrowRightIcon } from "../icons";
import { cardHover, container } from "../ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog — Tuition Guides for Parents & Tutors",
  description: "Practical guides on finding a home tutor in Karachi, online tuition in Pakistan, O/A-levels, Matric and more.",
  alternates: { canonical: "/blog" },
};

export default async function BlogPage() {
  const articles = await getPublishedArticles();
  return (
    <>
      <PageHeader kicker="Blog" title="Tuition guides" intro="Practical advice on finding the right tutor, home and online tuition, and every stage from primary to university." />
      <section className={`${container} py-14 sm:py-20`}>
        {articles.length === 0 ? (
          <p className="text-center text-slate-600">Our first guides are on their way.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => (
              <Link key={a.slug} href={`/blog/${a.slug}`} className={`${cardHover} flex flex-col`}>
                <p className="text-xs font-medium text-slate-500">
                  {formatDate(a.publishedAt)} · {readingMinutes(a.body)} min read
                </p>
                <h2 className="mt-3 font-heading text-lg font-semibold leading-snug text-slate-900">{a.title}</h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{a.description}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-rose-600">
                  Read guide <ArrowRightIcon />
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
      <CtaBand />
    </>
  );
}
