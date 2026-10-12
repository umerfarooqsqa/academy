// Neglected-parent digest — the I/O half of lib/parents/neglect.ts. Fetches the
// two failure modes (pending ParentRequests, Matches stuck awaiting approval),
// delegates the "who's actually due an alert" decision to the pure function,
// sends one digest email via Resend, and stamps neglectAlertedAt on everything
// included so the next check (every 15 min, vercel.json) doesn't re-send until
// it's genuinely due again.

import { prisma } from "@/lib/db";
import { config } from "@/lib/config";
import { sendEmail } from "@/lib/email/resend";
import { buildNeglectDigest, type NeglectedParentRow, type NeglectedMatchRow } from "@/lib/parents/neglect";

export interface NeglectDigestResult {
  sent: boolean;
  parentCount: number;
  matchCount: number;
  error?: string;
}

export async function sendNeglectDigestIfNeeded(now: Date = new Date()): Promise<NeglectDigestResult> {
  const [pendingParents, stuckMatches] = await Promise.all([
    prisma.parentRequest.findMany({
      where: { status: "pending" },
      select: { id: true, whatsappId: true, area: true, subjects: true, createdAt: true, neglectAlertedAt: true },
    }),
    prisma.match.findMany({
      where: { status: "awaiting_approval" },
      select: {
        id: true,
        createdAt: true,
        neglectAlertedAt: true,
        tutor: { select: { name: true } },
        parentRequest: { select: { whatsappId: true, area: true } },
      },
    }),
  ]);

  const parentRows: NeglectedParentRow[] = pendingParents;
  const matchRows: NeglectedMatchRow[] = stuckMatches.map((m) => ({
    id: m.id,
    tutorName: m.tutor.name,
    parentWhatsappId: m.parentRequest.whatsappId,
    area: m.parentRequest.area,
    createdAt: m.createdAt,
    neglectAlertedAt: m.neglectAlertedAt,
  }));

  const digest = buildNeglectDigest(parentRows, matchRows, now);
  if (!digest) {
    return { sent: false, parentCount: 0, matchCount: 0 };
  }

  if (!config.email.operatorEmail) {
    return { sent: false, parentCount: 0, matchCount: 0, error: "OPERATOR_EMAIL not configured" };
  }

  const result = await sendEmail({ to: config.email.operatorEmail, subject: digest.subject, html: digest.html });
  if (!result.ok) {
    console.error(`[neglect] email send failed: ${result.error}`);
    return { sent: false, parentCount: digest.parentIds.length, matchCount: digest.matchIds.length, error: result.error };
  }

  await prisma.$transaction([
    ...digest.parentIds.map((id) => prisma.parentRequest.update({ where: { id }, data: { neglectAlertedAt: now } })),
    ...digest.matchIds.map((id) => prisma.match.update({ where: { id }, data: { neglectAlertedAt: now } })),
  ]);

  return { sent: true, parentCount: digest.parentIds.length, matchCount: digest.matchIds.length };
}
