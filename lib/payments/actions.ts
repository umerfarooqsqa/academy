// Payment lifecycle actions (CLAUDE.md 6.7). The JazzCash gateway call itself
// (generating the actual payment link, verifying the webhook signature) is the
// "api things" piece left for later per the operator's current instruction —
// these are the deterministic DB-side actions a webhook (or the /payments
// dashboard, for manual/testing use) calls once a payment event is known.

import { prisma } from "@/lib/db";
import { splitPayment } from "@/lib/config";
import { notifyOperator, sendText } from "@/lib/whatsapp/client";

/** Generate the first-month payment record once a demo is scheduled/confirmed (6.7 step 1). */
export async function createPaymentForMatch(matchId: string, amount: number) {
  const { commission, tutorPayout } = splitPayment(amount);
  return prisma.payment.create({
    data: { matchId, amount, commission, tutorPayout, status: "pending", provider: "jazzcash" },
  });
}

/** Payment webhook confirmation (6.7 step 2) — marks collected, notifies operator + tutor. */
export async function markPaymentCollected(paymentId: string) {
  const updated = await prisma.payment.update({ where: { id: paymentId }, data: { status: "collected" } });
  await prisma.match.update({ where: { id: updated.matchId }, data: { status: "paid" } });

  // Re-fetch with relations now that both writes have landed, so the returned
  // object (and its nested match) reflects the final state, not a snapshot
  // from before the match status flip.
  const payment = await prisma.payment.findUniqueOrThrow({
    where: { id: paymentId },
    include: { match: { include: { tutor: true, parentRequest: true } } },
  });

  await notifyOperator(
    `💰 Payment collected for match ${payment.matchId} — Rs ${payment.amount} ` +
      `(commission Rs ${payment.commission}, tutor payout Rs ${payment.tutorPayout}).`,
  );
  await sendText(
    payment.match.tutor.whatsappId,
    `Good news! The parent has paid for the demo/first month. Your payout of Rs ${payment.tutorPayout} ` +
      `will be transferred manually — we'll confirm once it's sent.`,
  );
  return payment;
}

/** Manual payout marking from /payments (6.7 step 3) — no automated disbursement in Phase 1. */
export async function markPaymentPaidOut(paymentId: string) {
  return prisma.payment.update({ where: { id: paymentId }, data: { status: "paid_out" } });
}
