// JazzCash confirmation webhook (CLAUDE.md 6.7 step 2, Section 8).
//
// "api things" — left for later per the operator's current instruction. JazzCash
// isn't wired live yet (no merchant credentials configured), so this route
// currently only validates shape and 200s; it does not verify JazzCash's
// integrity-salt signature or advance a Payment's status. Once
// JAZZCASH_MERCHANT_ID/PASSWORD/INTEGRITY_SALT are set and the real payload
// shape is confirmed against JazzCash's docs, wire this to call
// lib/payments/actions.ts#markPaymentCollected (already built and used by the
// /payments dashboard's manual "mark collected" fallback in the meantime).

import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const configured = Boolean(process.env.JAZZCASH_INTEGRITY_SALT);
  if (!configured) {
    console.warn("[payments/webhook] JazzCash env vars not configured — ignoring inbound webhook.");
    return NextResponse.json({ received: true, processed: false, reason: "not configured" });
  }

  // TODO once credentials exist: verify the integrity-salt signature, look up
  // the Payment by JazzCash's transaction reference, and call
  // markPaymentCollected(paymentId) from lib/payments/actions.ts.
  await req.json().catch(() => null);
  return NextResponse.json({ received: true, processed: false, reason: "handler not yet wired — Phase 0/4 blocked" });
}
