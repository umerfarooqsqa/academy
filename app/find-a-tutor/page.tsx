// Public, unauthenticated (2026-10-13 public website feature). Parent
// request form — submits straight into the same ParentRequest pipeline every
// other intake path uses (see app/api/public/parent-request/route.ts).

import { prisma } from "@/lib/db";
import FindATutorForm from "./FindATutorForm";

export const dynamic = "force-dynamic";

export default async function FindATutorPage() {
  const zones = await prisma.areaZone.findMany({ select: { name: true }, orderBy: { name: "asc" } });

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-semibold text-gray-900">Find a tutor</h1>
      <p className="mt-1 text-sm text-gray-600">
        Tell us what you&apos;re looking for and we&apos;ll match you with a short list of vetted tutors from your
        own area.
      </p>
      <FindATutorForm zoneNames={zones.map((z) => z.name)} />
    </main>
  );
}
