import { NextResponse } from "next/server";
import { markPaymentCollected, markPaymentPaidOut } from "@/lib/payments/actions";
import { markRatingRequestSent } from "@/lib/ratings/actions";

// PATCH /api/payments/:id { action: "collect" | "paid_out" | "mark_rating_requested" } —
// the /payments dashboard's "mark manual payouts as complete" action (Section
// 7), a manual stand-in for the JazzCash webhook confirmation (6.7 step 2)
// until the live gateway is wired, and (2026-10 chat-export pivot) the "copy
// to send" rating-request fallback's "mark as sent" button (6.8).
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  if (body.action === "collect") {
    const payment = await markPaymentCollected(id);
    return NextResponse.json({ payment });
  }
  if (body.action === "paid_out") {
    const payment = await markPaymentPaidOut(id);
    return NextResponse.json({ payment });
  }
  if (body.action === "mark_rating_requested") {
    const payment = await markRatingRequestSent(id);
    return NextResponse.json({ payment });
  }
  return NextResponse.json({ error: "action must be 'collect', 'paid_out', or 'mark_rating_requested'" }, { status: 400 });
}
