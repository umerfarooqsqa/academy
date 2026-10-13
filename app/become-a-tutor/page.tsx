// Public, unauthenticated (2026-10-13 public website feature). Tutor
// registration form — submits straight into the same Tutor pipeline every
// other intake path uses (see app/api/public/tutor-apply/route.ts).

import { prisma } from "@/lib/db";
import BecomeATutorForm from "./BecomeATutorForm";

export const dynamic = "force-dynamic";

export default async function BecomeATutorPage() {
  const zones = await prisma.areaZone.findMany({ select: { name: true }, orderBy: { name: "asc" } });

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-semibold text-gray-900">Become a tutor</h1>
      <p className="mt-1 text-sm text-gray-600">
        Get matched with students close to you — save on travel time and fuel cost.
      </p>
      <BecomeATutorForm zoneNames={zones.map((z) => z.name)} />
    </main>
  );
}
