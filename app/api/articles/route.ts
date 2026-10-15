// Staff-only (session-checked by middleware — /api/articles is not public).
// Blog articles for /blog (SEO + GEO, 2026-10-15): list all (drafts too) and
// create. Publishing stamps publishedAt the first time.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseArticleInput } from "@/lib/articles";

export async function GET() {
  const articles = await prisma.article.findMany({ orderBy: [{ updatedAt: "desc" }] });
  return NextResponse.json({ articles });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const parsed = parseArticleInput(body, false);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const { title, slug, description, body: text, status = "draft" } = parsed.data;
  if (await prisma.article.findUnique({ where: { slug: slug! } })) {
    return NextResponse.json({ error: "Another article already uses that address — change the title or slug." }, { status: 409 });
  }
  const article = await prisma.article.create({
    data: { title: title!, slug: slug!, description: description!, body: text!, status, publishedAt: status === "published" ? new Date() : null },
  });
  return NextResponse.json({ article }, { status: 201 });
}
