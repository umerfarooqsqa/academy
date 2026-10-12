// /dashboard — overview (CLAUDE.md Section 7): pending approvals, active
// tutors, open parent requests, this month's revenue/commission, and the
// calls-needed queue surfaced prominently (6.1 step 5).

import Link from "next/link";
import { prisma } from "@/lib/db";
import { calculateFinanceMetrics } from "@/lib/finance/calculator";
import { card, pageTitle, badge, statusTone } from "@/app/components/ui";

export const dynamic = "force-dynamic";

async function loadOverview() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [pendingApprovals, activeTutors, openParentRequests, callsNeeded, payments] = await Promise.all([
    prisma.match.count({ where: { status: "awaiting_approval" } }),
    prisma.tutor.count({ where: { status: "active" } }),
    prisma.parentRequest.count({ where: { status: "pending" } }),
    prisma.parentRequest.findMany({
      where: { internalNote: { contains: "call", mode: "insensitive" } },
      // Oldest first — whoever's waited longest for a callback should be at
      // the top, not buried (neglected-parent alert, 2026-10 planning session).
      orderBy: { createdAt: "asc" },
      take: 10,
    }),
    prisma.payment.findMany({
      select: {
        status: true,
        commission: true,
        createdAt: true,
        match: { select: { parentRequest: { select: { area: true } } } },
      },
    }),
  ]);

  const paymentRows = payments.map((p) => ({
    status: p.status,
    commission: p.commission,
    createdAt: p.createdAt,
    area: p.match.parentRequest.area,
  }));
  const metrics = calculateFinanceMetrics([], paymentRows, { start: monthStart, end: monthEnd });

  return { pendingApprovals, activeTutors, openParentRequests, callsNeeded, metrics };
}

function StatTile({ label, value, href }: { label: string; value: string | number; href?: string }) {
  const inner = (
    <div className={card}>
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default async function DashboardPage() {
  const { pendingApprovals, activeTutors, openParentRequests, callsNeeded, metrics } = await loadOverview();

  return (
    <main>
      <h1 className={pageTitle}>Dashboard</h1>
      <p className="mt-1 text-sm text-gray-500">Overview of this month's pipeline.</p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Pending approvals" value={pendingApprovals} href="/matches?status=awaiting_approval" />
        <StatTile label="Active tutors" value={activeTutors} href="/tutors?status=active" />
        <StatTile label="Open parent requests" value={openParentRequests} href="/parents?status=pending" />
        <StatTile label="Calls needed" value={callsNeeded.length} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile label="This month's commission" value={`Rs ${metrics.totalCommission.toLocaleString()}`} />
        <StatTile label="Successful deals this month" value={metrics.successfulDeals} />
        <StatTile
          label="Profit per deal"
          value={metrics.profitPerDeal != null ? `Rs ${Math.round(metrics.profitPerDeal).toLocaleString()}` : "—"}
        />
      </div>

      <section className={`${card} mt-6`}>
        <h2 className="text-sm font-semibold text-gray-900">
          Parents needing a call ({callsNeeded.length})
        </h2>
        <p className="mt-1 text-xs text-gray-500">
          Work these in the Fri/Sat/Sun or evening call slots (6.1 step 5).
        </p>
        {callsNeeded.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">Nothing pending — all clear.</p>
        ) : (
          <ul className="mt-3 divide-y divide-gray-100">
            {callsNeeded.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <Link href={`/parents/${p.id}`} className="font-medium text-gray-900 hover:underline">
                    {p.whatsappId}
                  </Link>
                  <span className="ml-2 text-gray-500">
                    {p.subjects.join("/") || "?"} · {p.area || "?"}
                  </span>
                </div>
                <span className={badge(statusTone(p.status))}>{p.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
