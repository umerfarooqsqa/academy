import { NextResponse } from "next/server";
import { categoryFields } from "@/lib/subjectGroups";
import { prisma } from "@/lib/db";
import { runMatchingForParent } from "@/lib/matching/run";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const area = searchParams.get("area");

  const parents = await prisma.parentRequest.findMany({
    where: { ...(status ? { status } : {}), ...(area ? { area } : {}) },
    include: { campaign: true, matches: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ parents });
}

// Manual parent request creation from the dashboard (fallback to WhatsApp intake, 6.1).
export async function POST(req: Request) {
  const body = await req.json();
  const required = ["whatsappId", "curriculum", "area"];
  for (const f of required) {
    if (!body[f]) return NextResponse.json({ error: `${f} is required` }, { status: 400 });
  }
  const groups = categoryFields(body);
  if (!groups) return NextResponse.json({ error: "Pick at least one category" }, { status: 400 });

  const parent = await prisma.parentRequest.create({
    data: {
      whatsappId: body.whatsappId,
      studentInfo: body.studentInfo ?? null,
      subjects: body.subjects ?? [],
      ...groups,
      curriculum: body.curriculum,
      area: body.area,
      budget: body.budget ?? null,
      deliveryMode: body.deliveryMode ?? "in_person",
      availability: body.availability ?? [],
      status: body.status ?? "pending",
      internalNote: body.budget == null ? "budget not provided — confirm with parent" : (body.internalNote ?? null),
      rawMessage: body.rawMessage ?? "(entered manually via dashboard)",
      campaignId: body.campaignId ?? null,
    },
  });

  if (body.runMatching !== false) {
    try {
      await runMatchingForParent(parent.id);
    } catch (err) {
      console.error("[api/parents] matching trigger failed:", err);
    }
  }

  // Matching (if it ran) flips status to "matched" after `parent` was captured
  // above — re-fetch so the response reflects that rather than a stale "pending".
  const fresh = await prisma.parentRequest.findUnique({ where: { id: parent.id } });
  return NextResponse.json({ parent: fresh ?? parent }, { status: 201 });
}
