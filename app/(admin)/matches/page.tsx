// /matches — CLAUDE.md Section 7: list of Match rows with status, filter by
// status, manual approve/reject/edit as a fallback to the WhatsApp approval
// flow (6.4), and demoSlots entry (6.6).

import Link from "next/link";
import { prisma } from "@/lib/db";
import { computeLiveTier } from "@/lib/tutors/tier";
import { pageTitle, table, th, td, btnSecondary } from "@/app/components/ui";
import MatchRow from "./MatchRow";

export const dynamic = "force-dynamic";

const STATUSES = [
  "awaiting_approval",
  "approved",
  "rejected",
  "sent_to_parent",
  "selected",
  "demo_scheduled",
  "paid",
  "completed",
];

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  const matches = await prisma.match.findMany({
    where: status ? { status } : {},
    include: { tutor: { include: { subscriptions: true } }, parentRequest: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main>
      <div className="flex items-center justify-between">
        <h1 className={pageTitle}>Matches</h1>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Link href="/matches" className={btnSecondary} aria-current={!status}>
          All
        </Link>
        {STATUSES.map((s) => (
          <Link key={s} href={`/matches?status=${s}`} className={btnSecondary}>
            {s}
          </Link>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className={table}>
          <thead>
            <tr>
              <th className={th}>Tutor</th>
              <th className={th}>Parent request</th>
              <th className={th}>Score</th>
              <th className={th}>Status</th>
              <th className={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((m) => (
              <MatchRow
                key={m.id}
                match={{
                  ...m,
                  publishedToPageAt: m.publishedToPageAt?.toISOString() ?? null,
                  demoScheduledAt: m.demoScheduledAt?.toISOString() ?? null,
                  tutor: { ...m.tutor, tier: computeLiveTier(m.tutor.subscriptions) },
                }}
              />
            ))}
            {matches.length === 0 && (
              <tr>
                <td className={td} colSpan={5}>
                  No matches for this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
