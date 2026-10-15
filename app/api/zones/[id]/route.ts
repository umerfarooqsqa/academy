import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const editable = ["name", "latitude", "longitude", "maxKm"] as const;
  const data: Record<string, unknown> = {};
  for (const f of editable) if (f in body) data[f] = body[f];
  // Optional intro on the public area page (SEO, 2026-10-15) — plain text, capped.
  if ("description" in body) {
    const d = typeof body.description === "string" ? body.description.trim().slice(0, 3000) : "";
    data.description = d || null;
  }
  const zone = await prisma.areaZone.update({ where: { id }, data });
  return NextResponse.json({ zone });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.areaZone.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
