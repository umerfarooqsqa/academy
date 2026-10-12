// Automatic rating request trigger + application (CLAUDE.md 6.8). The request
// fires exactly RATING_REQUEST_DELAY_DAYS after Payment.status becomes
// "collected", via the same periodic scheduled-check pattern as 6.5 — no new
// infrastructure, no operator action required.

import { prisma } from "@/lib/db";
import { config } from "@/lib/config";
import { sendText } from "@/lib/whatsapp/client";
import { ratingRequestMessage } from "@/lib/messages";
import { nextRatingAverage } from "@/lib/ratings/updateRating";

/** Collected payments whose RATING_REQUEST_DELAY_DAYS window has elapsed and no
 * request has been sent yet (ratingRequestedAt still null). Exposed separately
 * from sendDueRatingRequests so the /payments dashboard can list them for a
 * manual "copy to send" fallback (2026-10 chat-export pivot — live WhatsApp
 * sends are no longer assumed to be configured) without triggering a send. */
export async function findDueRatingRequests(now: Date = new Date()) {
  const cutoff = new Date(now.getTime() - config.ratingRequestDelayDays * 24 * 60 * 60 * 1000);
  return prisma.payment.findMany({
    where: { status: { in: ["collected", "paid_out"] }, ratingRequestedAt: null, createdAt: { lte: cutoff } },
    include: { match: { include: { tutor: true, parentRequest: true } } },
  });
}

/** Finds due payments and sends the WhatsApp star-rating request, marking each
 * sent (ratingRequestedAt) so it's never re-sent on a later periodic check.
 * Still runs on the Vercel Cron schedule (vercel.json) — a no-op in practice
 * once live WhatsApp credentials aren't configured, since sendText degrades
 * gracefully, but left wired in case Meta setup is finished later. */
export async function sendDueRatingRequests(now: Date = new Date()) {
  const due = await findDueRatingRequests(now);

  const sent: string[] = [];
  for (const payment of due) {
    await sendText(payment.match.parentRequest.whatsappId, ratingRequestMessage(payment.match.tutor.name));
    await prisma.payment.update({ where: { id: payment.id }, data: { ratingRequestedAt: now } });
    sent.push(payment.id);
  }
  return sent;
}

/** Marks a rating request as sent without actually sending it — the manual
 * "copy to send" counterpart on /payments (operator pastes the message
 * themselves, then clicks this to stop it showing as due). */
export async function markRatingRequestSent(paymentId: string, now: Date = new Date()) {
  return prisma.payment.update({ where: { id: paymentId }, data: { ratingRequestedAt: now } });
}

/** Applies one inbound star rating (POST /api/ratings) — creates the Rating row
 * and updates the tutor's running average (6.8 step 2-3). */
export async function applyRating(matchId: string, stars: number, comment?: string | null) {
  const match = await prisma.match.findUnique({ where: { id: matchId }, include: { tutor: true } });
  if (!match) throw new Error(`Match ${matchId} not found`);

  const rating = await prisma.rating.create({
    data: { matchId, tutorId: match.tutorId, stars, comment: comment ?? null },
  });

  const { rating: newAvg, ratingCount } = nextRatingAverage(match.tutor.rating, match.tutor.ratingCount, stars);
  await prisma.tutor.update({ where: { id: match.tutorId }, data: { rating: newAvg, ratingCount } });
  await prisma.match.update({ where: { id: matchId }, data: { status: "completed" } });

  return rating;
}
