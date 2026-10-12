// /logs — CLAUDE.md Section 7: browse ApprovalLog entries (for reviewing
// correction patterns over time — 6.4).

import { prisma } from "@/lib/db";
import { pageTitle, table, th, td, badge } from "@/app/components/ui";

export const dynamic = "force-dynamic";

function tone(action: string): "green" | "red" | "amber" {
  if (action === "approved") return "green";
  if (action === "rejected") return "red";
  return "amber";
}

export default async function LogsPage() {
  const logs = await prisma.approvalLog.findMany({
    include: { match: { include: { tutor: true, parentRequest: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <main>
      <h1 className={pageTitle}>Approval logs</h1>
      <p className="mt-1 text-sm text-gray-500">
        Every approve/reject/edit decision (6.4) — the dataset that improves matching weights and
        prompt few-shot examples over time.
      </p>
      <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className={table}>
          <thead>
            <tr>
              <th className={th}>When</th>
              <th className={th}>Match</th>
              <th className={th}>Action</th>
              <th className={th}>Before</th>
              <th className={th}>After</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id}>
                <td className={td}>{l.createdAt.toISOString().slice(0, 16).replace("T", " ")}</td>
                <td className={td}>
                  {l.match.tutor.name} → {l.match.parentRequest.whatsappId}
                </td>
                <td className={td}>
                  <span className={badge(tone(l.action))}>{l.action}</span>
                </td>
                <td className={`${td} max-w-xs truncate text-xs text-gray-500`}>{JSON.stringify(l.before)}</td>
                <td className={`${td} max-w-xs truncate text-xs text-gray-500`}>{JSON.stringify(l.after)}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td className={td} colSpan={5}>
                  No approval decisions logged yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
