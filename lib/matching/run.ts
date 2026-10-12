// Matching trigger (CLAUDE.md 6.3 + 8: /api/matching/run, also called
// automatically after a parent intake completes — 6.1 step 6).
//
// Fetches candidate rows from Prisma, delegates all scoring logic to the pure
// lib/matching/engine.ts, writes the resulting Match rows (status:
// "awaiting_approval" — 6.3 Step 5), and sends the operator a WhatsApp summary
// for approval (6.4). Never runs matching logic itself — that stays 100%
// deterministic and DB-free in engine.ts.

import { prisma } from "@/lib/db";
import { notifyOperator } from "@/lib/whatsapp/client";
import { computeLiveTier } from "@/lib/tutors/tier";
import { runMatchingEngine, type TutorCandidate } from "@/lib/matching/engine";

export interface MatchingResult {
  parentRequestId: string;
  matchesCreated: number;
  matchIds: string[];
  note: string;
}

export async function runMatchingForParent(parentRequestId: string): Promise<MatchingResult> {
  const pr = await prisma.parentRequest.findUnique({ where: { id: parentRequestId } });
  if (!pr) {
    return { parentRequestId, matchesCreated: 0, matchIds: [], note: "ParentRequest not found" };
  }

  const [tutors, zones] = await Promise.all([
    prisma.tutor.findMany({
      where: { status: "active" },
      include: { subscriptions: true },
    }),
    prisma.areaZone.findMany(),
  ]);

  const candidates: TutorCandidate[] = tutors.map((t) => ({
    id: t.id,
    subjects: t.subjects,
    subjectGroup: t.subjectGroup,
    area: t.area,
    deliveryMode: t.deliveryMode,
    availability: t.availability,
    expectedFee: t.expectedFee,
    rating: t.rating,
    ratingCount: t.ratingCount,
    gradesBySubject: (t.gradesBySubject as Record<string, string> | null) ?? null,
    status: t.status,
    tier: computeLiveTier(t.subscriptions),
    radiusOverrideKm: t.radiusOverrideKm,
  }));

  const results = runMatchingEngine(
    {
      id: pr.id,
      subjects: pr.subjects,
      subjectGroup: pr.subjectGroup,
      area: pr.area,
      deliveryMode: pr.deliveryMode,
      budget: pr.budget,
      availability: pr.availability,
    },
    candidates,
    zones,
  );

  if (results.length === 0) {
    await notifyOperator(
      `ℹ️ No matching tutors found for parent request ${pr.id} ` +
        `(subjects=${pr.subjects.join("/")}, area=${pr.area}). No active tutor in the pool clears the hard filters yet.`,
    );
    return { parentRequestId, matchesCreated: 0, matchIds: [], note: "No candidates passed the hard filters." };
  }

  const created = await prisma.$transaction(
    results.map((r) =>
      prisma.match.create({
        data: {
          parentRequestId: pr.id,
          tutorId: r.tutorId,
          score: r.score,
          status: "awaiting_approval",
          internalNote: r.internalNote,
        },
      }),
    ),
  );

  await prisma.parentRequest.update({ where: { id: pr.id }, data: { status: "matched" } });

  const tutorNames = new Map(tutors.map((t) => [t.id, t.name]));
  const summary = created
    .map(
      (m, i) =>
        `${i + 1}) ${tutorNames.get(m.tutorId) ?? m.tutorId} — score ${m.score.toFixed(2)}` +
        (m.internalNote ? ` (${m.internalNote})` : ""),
    )
    .join("\n");
  await notifyOperator(
    `🔔 New matches for parent request ${pr.id} (${pr.subjects.join("/")}, ${pr.area}):\n${summary}\n\n` +
      `Reply "1 yes", "1 no", or "1 edit: <note>" per candidate, or use the /matches dashboard.`,
  );

  return {
    parentRequestId,
    matchesCreated: created.length,
    matchIds: created.map((m) => m.id),
    note: `Created ${created.length} Match row(s), awaiting operator approval (6.4).`,
  };
}
