// "Request this tutor" on a featured tutor's public profile (2026-10-15).
// After the normal intake + matching run, make sure the tutor the parent
// picked is proposed too — but only if they pass the same hard rules every
// match does (category, subject, gender, and the area rule — Section 1's
// "never match across town" applies even when the parent chose the tutor).
// If they don't, the request just gets a note for the operator to follow up.
// Either way the operator still approves before the parent hears anything.

import { prisma } from "@/lib/db";
import { notifyOperator } from "@/lib/whatsapp/client";
import { checkRequestedTutor, runMatchingEngine } from "@/lib/matching/engine";
import { toParentInput, toTutorCandidate } from "@/lib/matching/run";
import { PUBLIC_TUTOR_WHERE, displayName } from "@/lib/tutors/publicProfile";

export const REQUESTED_NOTE = "parent requested this tutor";

export type RequestedTutorOutcome = "ignored" | "already_matched" | "match_created" | "noted_ineligible";

function appendNote(existing: string | null, note: string): string {
  return existing ? `${existing}; ${note}` : note;
}

export async function applyRequestedTutor(parentRequestId: string, tutorId: unknown): Promise<RequestedTutorOutcome> {
  if (typeof tutorId !== "string" || !/^[A-Za-z0-9_-]{1,64}$/.test(tutorId)) return "ignored";
  // Only a currently featured + verified tutor can be requested from the site.
  const tutor = await prisma.tutor.findFirst({
    where: { ...PUBLIC_TUTOR_WHERE, id: tutorId },
    include: { subscriptions: true },
  });
  const pr = await prisma.parentRequest.findUnique({ where: { id: parentRequestId } });
  if (!tutor || !pr) return "ignored";

  await prisma.parentRequest.update({ where: { id: pr.id }, data: { preferredTutorId: tutor.id } });

  const existing = await prisma.match.findFirst({ where: { parentRequestId: pr.id, tutorId: tutor.id } });
  if (existing) {
    await prisma.match.update({
      where: { id: existing.id },
      data: { internalNote: appendNote(existing.internalNote, REQUESTED_NOTE) },
    });
    return "already_matched";
  }

  const zones = await prisma.areaZone.findMany();
  const candidate = toTutorCandidate(tutor);
  const parent = toParentInput(pr);
  const check = checkRequestedTutor(candidate, parent, zones);

  if (!check.eligible) {
    await prisma.parentRequest.update({
      where: { id: pr.id },
      data: {
        internalNote: appendNote(pr.internalNote, `parent asked for ${displayName(tutor.name)} (${tutor.id}) — ${check.reason}, check`),
      },
    });
    await notifyOperator(
      `ℹ️ Parent request ${pr.id} asked for featured tutor ${tutor.name}, but they don't fit (${check.reason}). Not proposed — follow up on /parents.`,
    );
    return "noted_ineligible";
  }

  const [scored] = runMatchingEngine(parent, [candidate], zones);
  await prisma.match.create({
    data: {
      parentRequestId: pr.id,
      tutorId: tutor.id,
      score: scored?.score ?? 0,
      status: "awaiting_approval",
      internalNote: [REQUESTED_NOTE, scored?.internalNote ?? check.note].filter(Boolean).join("; "),
    },
  });
  if (pr.status === "pending") {
    await prisma.parentRequest.update({ where: { id: pr.id }, data: { status: "matched" } });
  }
  await notifyOperator(
    `🔔 Parent request ${pr.id} (${pr.subjects.join("/")}, ${pr.area}) asked for featured tutor ${tutor.name} — proposed, awaiting your approval on /matches.`,
  );
  return "match_created";
}
