import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { computeLiveTier } from "@/lib/tutors/tier";
import { card, pageTitle } from "@/app/components/ui";
import { DOCUMENT_TITLES, type AgreementDocument } from "@/lib/agreementSnapshot";
import TutorDetailClient from "./TutorDetailClient";

export const dynamic = "force-dynamic";

export default async function TutorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tutor = await prisma.tutor.findUnique({
    where: { id },
    include: {
      subscriptions: true,
      termsAcceptances: { orderBy: { acceptedAt: "desc" } },
    },
  });
  if (!tutor) notFound();
  const { termsAcceptances, ...tutorFields } = tutor;

  return (
    <main>
      <h1 className={pageTitle}>{tutor.name || "(unnamed tutor)"}</h1>
      <p className="mt-1 text-sm text-gray-500">
        {tutor.whatsappId}
        {tutor.termsAcceptedAt && (
          <span className="ml-2">· agreed to the Terms &amp; Conditions on {tutor.termsAcceptedAt.toISOString().slice(0, 10)}</span>
        )}
      </p>
      <div className="mt-4">
        <TutorDetailClient
          tutor={{ ...tutorFields, tier: computeLiveTier(tutor.subscriptions) }}
          subscriptions={tutor.subscriptions.map((s) => ({
            ...s,
            periodStart: s.periodStart.toISOString(),
            periodEnd: s.periodEnd.toISOString(),
          }))}
        />
      </div>
      <Agreements acceptances={termsAcceptances} />
    </main>
  );
}

// Evidence of what the tutor agreed to on /become-a-tutor (2026-10-19) —
// the exact copy they were shown, with time, number, IP and device. This is
// what to show if a tutor ever disputes the no-direct-dealing rule.
function Agreements({
  acceptances,
}: {
  acceptances: {
    id: string;
    document: string;
    version: string;
    updatedOn: string;
    text: string;
    whatsappId: string;
    ipAddress: string | null;
    userAgent: string | null;
    acceptedAt: Date;
  }[];
}) {
  return (
    <section className={`${card} mt-6`}>
      <h2 className="text-base font-semibold text-gray-900">Agreements accepted</h2>
      {acceptances.length === 0 ? (
        <p className="mt-2 text-sm text-gray-500">
          No signed copy on record — this tutor didn&apos;t register through the website form after 19 Oct 2026. Ask them to
          register (or re-register with the same number) on /become-a-tutor to accept the Tutor Agreement.
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {acceptances.map((a) => (
            <li key={a.id} className="rounded border border-gray-200 p-3 text-sm">
              <p className="font-medium text-gray-900">
                {DOCUMENT_TITLES[a.document as AgreementDocument] ?? a.document}{" "}
                <span className="font-normal text-gray-500">
                  (last updated {a.updatedOn}, version {a.version})
                </span>
              </p>
              <p className="mt-1 text-gray-600">
                Accepted{" "}
                {a.acceptedAt.toLocaleString("en-GB", { timeZone: "Asia/Karachi", dateStyle: "medium", timeStyle: "short" })} PKT ·
                number {a.whatsappId} · IP {a.ipAddress ?? "unknown"}
              </p>
              {a.userAgent && <p className="mt-0.5 break-words text-xs text-gray-500">Device: {a.userAgent}</p>}
              <details className="mt-2">
                <summary className="cursor-pointer text-blue-600 hover:underline">Show the exact text they agreed to</summary>
                <pre className="mt-2 max-h-96 overflow-y-auto whitespace-pre-wrap rounded bg-gray-50 p-3 font-sans text-xs leading-relaxed text-gray-800">
                  {a.text}
                </pre>
              </details>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
