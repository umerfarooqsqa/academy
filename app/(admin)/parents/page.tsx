// /parents — CLAUDE.md Section 7: list/search parent requests, status. Parents
// needing a call surface here too (6.1 step 5), same query as /dashboard.

import Link from "next/link";
import { prisma } from "@/lib/db";
import { pageTitle, table, th, td, badge, statusTone, input, btnPrimary } from "@/app/components/ui";
import { NEGLECT_THRESHOLD_HOURS } from "@/lib/parents/neglect";

export const dynamic = "force-dynamic";

function waitingHours(createdAt: Date, now: Date): number {
  return (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
}

export default async function ParentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const now = new Date();

  const parents = await prisma.parentRequest.findMany({
    where: status ? { status } : {},
    include: { campaign: true, matches: true },
    // Oldest first — the longest-waiting parent should never be buried
    // (neglected-parent alert, 2026-10 planning session).
    orderBy: { createdAt: "asc" },
  });

  return (
    <main>
      <div className="flex items-center justify-between">
        <h1 className={pageTitle}>Parent requests</h1>
        <Link href="/parents/new" className={btnPrimary}>
          + Add request
        </Link>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {["", "pending", "matched", "closed"].map((s) => (
          <Link
            key={s || "all"}
            href={s ? `/parents?status=${s}` : "/parents"}
            className="rounded border border-gray-300 px-2.5 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
          >
            {s || "All"}
          </Link>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className={table}>
          <thead>
            <tr>
              <th className={th}>Parent</th>
              <th className={th}>Requirement</th>
              <th className={th}>Budget</th>
              <th className={th}>Matches</th>
              <th className={th}>Waiting</th>
              <th className={th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {parents.map((p) => {
              const hours = waitingHours(p.createdAt, now);
              const stillOpen = p.status === "pending";
              return (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className={td}>
                    <Link href={`/parents/${p.id}`} className="font-medium text-gray-900 hover:underline">
                      {p.whatsappId}
                    </Link>
                    {p.campaign && <div className="text-xs text-gray-500">{p.campaign.name}</div>}
                  </td>
                  <td className={td}>
                    <div>{p.subjects.join(", ") || "—"}</div>
                    <div className="text-xs text-gray-500">
                      {p.area} · {p.curriculum} · {p.deliveryMode}
                    </div>
                    {p.internalNote && <div className="text-xs text-amber-700">{p.internalNote}</div>}
                  </td>
                  <td className={td}>{p.budget ? `Rs ${p.budget}` : "not provided"}</td>
                  <td className={td}>{p.matches.length}</td>
                  <td className={td}>
                    {stillOpen ? (
                      <span className={badge(hours >= NEGLECT_THRESHOLD_HOURS ? "red" : "amber")}>
                        {hours.toFixed(1)}h
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className={td}>
                    <span className={badge(statusTone(p.status))}>{p.status}</span>
                  </td>
                </tr>
              );
            })}
            {parents.length === 0 && (
              <tr>
                <td className={td} colSpan={6}>
                  {"No parent requests for this filter."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
