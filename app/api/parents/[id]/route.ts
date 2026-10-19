import { NextResponse } from "next/server";
import { categoryFields } from "@/lib/subjectGroups";
import { prisma } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parent = await prisma.parentRequest.findUnique({
    where: { id },
    include: { campaign: true, matches: { include: { tutor: true } } },
  });
  if (!parent) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ parent });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const editable = [
    "studentInfo",
    "subjects",
    "curriculum",
    "area",
    "budget",
    "deliveryMode",
    "availability",
    "status",
    "internalNote",
    "campaignId",
  ] as const;
  const data: Record<string, unknown> = {};
  for (const f of editable) if (f in body) data[f] = body[f];
  // Categories (several allowed since 2026-10-19) — at least one.
  if ("subjectGroups" in body || "subjectGroup" in body) {
    const groups = categoryFields(body);
    if (!groups) return NextResponse.json({ error: "Pick at least one category" }, { status: 400 });
    Object.assign(data, groups);
  }
  // "Hide from public" — keeps the request off /opportunities and the Facebook
  // Page (2026-10-15: every open request is public by default).
  if (typeof body.publicHidden === "boolean") data.publicHiddenAt = body.publicHidden ? new Date() : null;

  const parent = await prisma.parentRequest.update({ where: { id }, data });
  return NextResponse.json({ parent });
}
