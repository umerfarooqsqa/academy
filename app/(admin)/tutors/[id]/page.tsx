import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { computeLiveTier } from "@/lib/tutors/tier";
import { pageTitle } from "@/app/components/ui";
import TutorDetailClient from "./TutorDetailClient";

export const dynamic = "force-dynamic";

export default async function TutorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tutor = await prisma.tutor.findUnique({ where: { id }, include: { subscriptions: true } });
  if (!tutor) notFound();

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
          tutor={{ ...tutor, tier: computeLiveTier(tutor.subscriptions) }}
          subscriptions={tutor.subscriptions.map((s) => ({
            ...s,
            periodStart: s.periodStart.toISOString(),
            periodEnd: s.periodEnd.toISOString(),
          }))}
        />
      </div>
    </main>
  );
}
