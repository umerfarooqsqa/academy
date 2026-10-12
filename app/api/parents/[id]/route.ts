import { NextResponse } from "next/server";
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
    "subjectGroup",
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

  const parent = await prisma.parentRequest.update({ where: { id }, data });
  return NextResponse.json({ parent });
}
