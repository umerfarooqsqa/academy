import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { pageTitle } from "@/app/components/ui";
import ParentDetailClient from "./ParentDetailClient";

export const dynamic = "force-dynamic";

export default async function ParentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [parent, campaigns] = await Promise.all([
    prisma.parentRequest.findUnique({ where: { id }, include: { matches: { include: { tutor: true } } } }),
    prisma.campaign.findMany({ select: { id: true, name: true } }),
  ]);
  if (!parent) notFound();

  return (
    <main>
      <h1 className={pageTitle}>{parent.whatsappId}</h1>
      <p className="mt-1 text-sm text-gray-500">
        {parent.subjects.join(", ") || "—"} · {parent.curriculum} · {parent.area} ·{" "}
        {parent.budget ? `Rs ${parent.budget}/mo` : "budget not provided"}
        {parent.tutorGenderPreference !== "any" && ` · wants a ${parent.tutorGenderPreference} tutor`}
        {parent.preferredTutorId && (
          <>
            {" · "}
            <a href={`/tutors/${parent.preferredTutorId}`} className="text-blue-600 hover:underline">
              asked for a featured tutor
            </a>
          </>
        )}
      </p>
      {parent.schoolName && <p className="mt-1 text-sm text-gray-500">School: {parent.schoolName}</p>}
      {parent.studentInfo && <p className="mt-1 text-sm text-gray-500">{parent.studentInfo}</p>}
      <div className="mt-4">
        <ParentDetailClient parent={parent} campaigns={campaigns} matches={parent.matches} />
      </div>
    </main>
  );
}
