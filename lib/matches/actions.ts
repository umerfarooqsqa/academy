// Match approval + opportunity notification/publishing actions (CLAUDE.md 6.4,
// 6.5). These back both the WhatsApp admin-approval reply protocol and the
// /matches dashboard's manual approve/reject/edit fallback (Section 7) — one
// set of DB actions, two front doors.

import { prisma } from "@/lib/db";
import { config } from "@/lib/config";
import { notifyOperator, sendText } from "@/lib/whatsapp/client";
import { tutorOpportunityNotification } from "@/lib/messages";
import { computeLiveTier } from "@/lib/tutors/tier";
import { generateOpportunityCode } from "@/lib/opportunities/code";

export type ApprovalAction = "approved" | "rejected" | "edited";

/**
 * Approve/reject/edit one Match (6.4). Logs before/after to ApprovalLog
 * regardless of front door (WhatsApp reply parser or the dashboard).
 */
export async function decideMatch(
  matchId: string,
  action: ApprovalAction,
  opts: { note?: string | null; actor?: string } = {},
) {
  const before = await prisma.match.findUnique({
    where: { id: matchId },
    include: { tutor: { include: { subscriptions: true } }, parentRequest: true },
  });
  if (!before) throw new Error(`Match ${matchId} not found`);

  const nextStatus = action === "rejected" ? "rejected" : "approved";
  const updated = await prisma.match.update({
    where: { id: matchId },
    data: {
      status: nextStatus,
      internalNote: opts.note !== undefined ? opts.note : before.internalNote,
    },
  });

  await prisma.approvalLog.create({
    data: {
      matchId,
      action,
      before: { status: before.status, score: before.score, internalNote: before.internalNote },
      after: { status: updated.status, internalNote: updated.internalNote, actor: opts.actor ?? "dashboard" },
    },
  });

  if (nextStatus === "approved") {
    await triggerNotificationForMatch(matchId);
    // triggerNotificationForMatch writes notifyAt after `updated` was captured
    // above — re-fetch so the caller (API response) reflects it rather than a
    // stale pre-notification snapshot.
    return prisma.match.findUniqueOrThrow({ where: { id: matchId } });
  }

  return updated;
}

/**
 * After approval (6.4), decide the notification channel per tier (6.5):
 * premium -> instant private WhatsApp ping + a confirmation deadline; free ->
 * no paid push at all, immediately eligible for public /opportunities
 * publishing on the next scheduled check.
 */
export async function triggerNotificationForMatch(matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { tutor: { include: { subscriptions: true } }, parentRequest: true },
  });
  if (!match) return;

  const tier = computeLiveTier(match.tutor.subscriptions);
  const now = new Date();

  if (tier === "premium") {
    const subject = match.parentRequest.subjects[0] ?? "tutoring";
    await sendText(
      match.tutor.whatsappId,
      tutorOpportunityNotification(subject, match.parentRequest.curriculum, match.parentRequest.area),
    );
    const notifyAt = new Date(now.getTime() + config.premiumNotificationDelayMinutes * 60_000);
    await prisma.match.update({ where: { id: matchId }, data: { notifyAt } });
  } else {
    // Free tutors get zero paid WhatsApp pushes (6.5 step 3) — immediately
    // eligible for the next publish-check run.
    await prisma.match.update({ where: { id: matchId }, data: { notifyAt: now } });
  }
}

/**
 * Periodic check (POST /api/matches/check-notification-delay, 6.5 step 7):
 * publish any approved Match past its notifyAt deadline with no confirmed
 * interest yet. Publishing is a DB write, not a WhatsApp message — zero cost.
 */
export async function publishDueOpportunities(now: Date = new Date()) {
  const due = await prisma.match.findMany({
    where: {
      status: "approved",
      publishedToPageAt: null,
      interestedTutorId: null,
      notifyAt: { lte: now },
    },
  });

  const published: string[] = [];
  for (const match of due) {
    let code = generateOpportunityCode();
    // Retry on the (rare) unique clash against Match.opportunityCode.
    for (let attempt = 0; attempt < 5; attempt++) {
      const clash = await prisma.match.findUnique({ where: { opportunityCode: code } });
      if (!clash) break;
      code = generateOpportunityCode();
    }
    await prisma.match.update({
      where: { id: match.id },
      data: { opportunityCode: code, publishedToPageAt: now },
    });
    published.push(match.id);
  }
  return published;
}

/** A tutor confirms interest — either a premium tutor's WhatsApp "YES" reply, or
 * any tutor messaging an OPP-XXXX code from the public page (6.5 steps 4-5). */
export async function confirmTutorInterest(matchId: string, tutorId: string) {
  return prisma.match.update({
    where: { id: matchId },
    data: { interestedTutorId: tutorId },
  });
}

/** A premium tutor declines (WhatsApp "NO" reply) — clears their candidacy so
 * the match becomes eligible for publishing on the next check. */
export async function declineTutorInterest(matchId: string) {
  return prisma.match.update({
    where: { id: matchId },
    data: { notifyAt: new Date() },
  });
}

/** Match statuses a tutor can still be unmatched from — after approval and
 * before payment (2026-10-15). */
export const UNMATCHABLE_STATUSES = ["approved", "sent_to_parent", "selected", "demo_scheduled"];

export type UnmatchReason = "tutor_declined" | "demo_failed";

const UNMATCH_REASON_TEXT: Record<UnmatchReason, string> = {
  tutor_declined: "tutor declined to teach",
  demo_failed: "demo didn't work out",
};

/**
 * Unmatch a tutor from a request (2026-10-15 operator request): the tutor
 * won't take the student, or the demo failed. The Match becomes "unmatched"
 * (logged to ApprovalLog like any decision), the request goes back on
 * /opportunities and is re-posted to the Facebook Page at the next 3-hourly
 * run, and the matching engine won't propose this tutor for it again
 * (lib/matching/run.ts skips tutors already matched to the request).
 */
export async function unmatchMatch(
  matchId: string,
  reason: UnmatchReason,
  opts: { note?: string | null; actor?: string } = {},
) {
  const before = await prisma.match.findUnique({ where: { id: matchId } });
  if (!before) throw new Error(`Match ${matchId} not found`);
  if (!UNMATCHABLE_STATUSES.includes(before.status)) {
    throw new Error(`A match that is "${before.status}" can't be unmatched`);
  }

  const reasonText = UNMATCH_REASON_TEXT[reason];
  const internalNote = [`unmatched — ${reasonText}`, opts.note?.trim(), before.internalNote].filter(Boolean).join("; ");
  const updated = await prisma.match.update({ where: { id: matchId }, data: { status: "unmatched", internalNote } });

  await prisma.approvalLog.create({
    data: {
      matchId,
      action: "unmatched",
      before: { status: before.status, score: before.score, internalNote: before.internalNote },
      after: { status: "unmatched", reason, note: opts.note ?? null, actor: opts.actor ?? "dashboard" },
    },
  });

  // Back to looking for a tutor: pending again unless another live match
  // remains, and re-advertised on the Facebook Page.
  const live = await prisma.match.count({
    where: { parentRequestId: before.parentRequestId, status: { notIn: ["rejected", "unmatched"] } },
  });
  await prisma.parentRequest.update({
    where: { id: before.parentRequestId },
    data: { facebookPostedAt: null, ...(live === 0 ? { status: "pending" } : {}) },
  });

  return updated;
}
