import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createPaymentForMatch } from "@/lib/payments/actions";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const payments = await prisma.payment.findMany({
    where: status ? { status } : {},
    include: { match: { include: { tutor: true, parentRequest: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ payments });
}

// Generates the first-month payment record (6.7 step 1). The actual JazzCash
// payment-link generation is the "api things" piece left for later — this
// creates the Payment row a real webhook would otherwise create/confirm, so
// the rest of the dashboard (commission split, payout tracking) is fully
// testable without the live gateway.
export async function POST(req: Request) {
  const body = await req.json();
  if (!body.matchId || body.amount == null) {
    return NextResponse.json({ error: "matchId and amount are required" }, { status: 400 });
  }
  const payment = await createPaymentForMatch(body.matchId, body.amount);
  return NextResponse.json({ payment }, { status: 201 });
}
