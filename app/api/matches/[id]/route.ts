import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { decideMatch, confirmTutorInterest, type ApprovalAction } from "@/lib/matches/actions";
import { currentUserEmail } from "@/lib/auth/currentUser";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = await prisma.match.findUnique({
    where: { id },
    include: { tutor: true, parentRequest: true, payments: true, ratings: true, approvalLogs: true },
  });
  if (!match) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ match });
}

// Handles every /matches dashboard action (Section 7): approve/reject/edit
// (6.4), demoSlots entry + demoScheduledAt confirmation (6.6), and marking a
// tutor's confirmed interest (6.5 step 5, manual fallback while WhatsApp
// confirmation isn't wired live).
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  if (body.action === "approve" || body.action === "reject" || body.action === "edit") {
    const action: ApprovalAction = body.action === "approve" ? "approved" : body.action === "reject" ? "rejected" : "edited";
    const actor = (await currentUserEmail()) ?? "dashboard";
    const match = await decideMatch(id, action, { note: body.note, actor });
    return NextResponse.json({ match });
  }

  if (body.action === "confirm_interest") {
    if (!body.tutorId) return NextResponse.json({ error: "tutorId is required" }, { status: 400 });
    const match = await confirmTutorInterest(id, body.tutorId);
    return NextResponse.json({ match });
  }

  // Plain field updates: demoSlots, demoScheduledAt, status, internalNote.
  const editable = ["demoSlots", "demoScheduledAt", "status", "internalNote"] as const;
  const data: Record<string, unknown> = {};
  for (const f of editable) if (f in body) data[f] = body[f];
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No recognised action or fields provided" }, { status: 400 });
  }
  const match = await prisma.match.update({ where: { id }, data });
  return NextResponse.json({ match });
}
