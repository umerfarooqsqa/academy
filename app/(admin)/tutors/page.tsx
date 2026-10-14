// /tutors — CLAUDE.md Section 7: list/search/edit tutor profiles, activate/
// deactivate, subscription management (linked from each row's detail page).

import Link from "next/link";
import { prisma } from "@/lib/db";
import { computeLiveTier } from "@/lib/tutors/tier";
import { SUBJECT_GROUP_LABELS, type SubjectGroup } from "@/lib/subjectGroups";
import { pageTitle, table, th, td, badge, statusTone, input, btnPrimary } from "@/app/components/ui";

export const dynamic = "force-dynamic";

export default async function TutorsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status, q } = await searchParams;

  const tutors = await prisma.tutor.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { whatsappId: { contains: q } }] } : {}),
    },
    include: { subscriptions: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main>
      <div className="flex items-center justify-between">
        <h1 className={pageTitle}>Tutors</h1>
        <Link href="/tutors/new" className={btnPrimary}>
          + Add tutor
        </Link>
      </div>

      <form className="mt-3 flex flex-wrap gap-2" method="GET">
        <input className={`${input} max-w-xs`} name="q" placeholder="Search name or WhatsApp ID" defaultValue={q} />
        <select className={input} name="status" defaultValue={status ?? ""}>
          <option value="">All statuses</option>
          <option value="pending">pending</option>
          <option value="active">active</option>
          <option value="inactive">inactive</option>
        </select>
        <button className={btnPrimary} type="submit">
          Filter
        </button>
      </form>

      <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className={table}>
          <thead>
            <tr>
              <th className={th}>Name</th>
              <th className={th}>Subjects</th>
              <th className={th}>Area</th>
              <th className={th}>Tier</th>
              <th className={th}>Rating</th>
              <th className={th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {tutors.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className={td}>
                  <Link href={`/tutors/${t.id}`} className="font-medium text-gray-900 hover:underline">
                    {t.name || "(unnamed)"}
                  </Link>
                  <div className="text-xs text-gray-500">{t.whatsappId}</div>
                </td>
                <td className={td}>
                  <div>{t.subjects.join(", ") || "—"}</div>
                  <div className="text-xs text-gray-500">
                    {SUBJECT_GROUP_LABELS[t.subjectGroup as SubjectGroup] ?? t.subjectGroup}
                  </div>
                </td>
                <td className={td}>{t.area}</td>
                <td className={td}>
                  <span className={badge(computeLiveTier(t.subscriptions) === "premium" ? "blue" : "gray")}>
                    {computeLiveTier(t.subscriptions)}
                  </span>
                </td>
                <td className={td}>{t.ratingCount > 0 ? `${t.rating.toFixed(1)} (${t.ratingCount})` : "—"}</td>
                <td className={td}>
                  <span className={badge(statusTone(t.status))}>{t.status}</span>
                  {t.cnicVerifiedAt && <span className={`${badge("green")} ml-1`}>CNIC ✓</span>}
                </td>
              </tr>
            ))}
            {tutors.length === 0 && (
              <tr>
                <td className={td} colSpan={6}>
                  No tutors match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
