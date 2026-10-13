// Public, unauthenticated (2026-10-13 public website feature). Tutor
// registration form — submits straight into the same Tutor pipeline every
// other intake path uses (see app/api/public/tutor-apply/route.ts). Nav
// header/footer come from this route group's layout.tsx.

import { prisma } from "@/lib/db";
import BecomeATutorForm from "./BecomeATutorForm";

export const dynamic = "force-dynamic";

export default async function BecomeATutorPage() {
  const zones = await prisma.areaZone.findMany({ select: { name: true }, orderBy: { name: "asc" } });

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <div className="text-center">
        <h1 className="font-heading text-4xl font-extrabold tracking-tight text-gray-900">Become a tutor</h1>
        <p className="mx-auto mt-3 max-w-md text-base text-gray-600">
          Get matched with students close to you — save on travel time and fuel cost.
        </p>
      </div>
      <BecomeATutorForm zoneNames={zones.map((z) => z.name)} />
    </div>
  );
}
