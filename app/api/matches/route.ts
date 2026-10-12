import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const matches = await prisma.match.findMany({
    where: status ? { status } : {},
    include: { tutor: true, parentRequest: true, payments: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ matches });
}

// Manual Match creation — a dashboard fallback for pairing a specific tutor with
// a parent request outside the automated engine (Section 7/8 CRUD backing).
// To run the deterministic engine itself, use POST /api/matching/run instead.
export async function POST(req: Request) {
  const body = await req.json();
  if (!body.parentRequestId || !body.tutorId) {
    return NextResponse.json({ error: "parentRequestId and tutorId are required" }, { status: 400 });
  }
  const match = await prisma.match.create({
    data: {
      parentRequestId: body.parentRequestId,
      tutorId: body.tutorId,
      score: body.score ?? 0,
      status: "awaiting_approval",
      internalNote: body.internalNote ?? "manually created via dashboard",
    },
  });
  return NextResponse.json({ match }, { status: 201 });
}
