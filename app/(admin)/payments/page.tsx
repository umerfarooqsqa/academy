// /payments — CLAUDE.md Section 7: list of Payment rows, mark manual payouts as
// complete. The JazzCash payment-link generation itself is the "api things"
// piece left for later; "Generate payment record" here is the manual/testing
// substitute a real webhook confirmation would otherwise create.

import { prisma } from "@/lib/db";
import { computeLiveTier } from "@/lib/tutors/tier";
import { findDueRatingRequests } from "@/lib/ratings/actions";
import { pageTitle } from "@/app/components/ui";
import PaymentsClient from "./PaymentsClient";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const [payments, candidateMatches, dueRatingRequests] = await Promise.all([
    prisma.payment.findMany({
      include: { match: { include: { tutor: { include: { subscriptions: true } }, parentRequest: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.match.findMany({
      where: { status: { in: ["demo_scheduled", "selected", "approved"] }, payments: { none: {} } },
      include: { tutor: true, parentRequest: true },
    }),
    findDueRatingRequests(),
  ]);

  return (
    <main>
      <h1 className={pageTitle}>Payments</h1>
      <p className="mt-1 text-sm text-gray-500">
        Commission split at {process.env.COMMISSION_PERCENT ?? 50}% (first month only) — 6.7.
      </p>
      <div className="mt-4">
        <PaymentsClient
          payments={payments.map((p) => ({
            ...p,
            createdAt: p.createdAt.toISOString(),
            match: { ...p.match, tutor: { ...p.match.tutor, tier: computeLiveTier(p.match.tutor.subscriptions) } },
          }))}
          openMatches={candidateMatches.map((m) => ({
            id: m.id,
            tutorName: m.tutor.name,
            parentWhatsappId: m.parentRequest.whatsappId,
          }))}
          dueRatingRequests={dueRatingRequests.map((p) => ({
            id: p.id,
            tutorName: p.match.tutor.name,
            parentWhatsappId: p.match.parentRequest.whatsappId,
          }))}
        />
      </div>
    </main>
  );
}
