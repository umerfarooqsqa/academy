// Staff-only (session-checked by middleware). Update / publish / unpublish /
// delete one blog article (SEO + GEO, 2026-10-15).

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseArticleInput } from "@/lib/articles";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await prisma.article.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const parsed = parseArticleInput(body, true);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const data: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.slug && parsed.data.slug !== existing.slug) {
    const clash = await prisma.article.findUnique({ where: { slug: parsed.data.slug } });
    if (clash) return NextResponse.json({ error: "Another article already uses that address." }, { status: 409 });
  }
  // First publish sets the date; unpublishing keeps it for a later re-publish.
  if (parsed.data.status === "published" && !existing.publishedAt) data.publishedAt = new Date();
  const article = await prisma.article.update({ where: { id }, data });
  return NextResponse.json({ article });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.article.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
