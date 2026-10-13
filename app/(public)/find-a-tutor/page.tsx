// Public, unauthenticated (2026-10-13 public website feature). Parent
// request form — submits straight into the same ParentRequest pipeline every
// other intake path uses (see app/api/public/parent-request/route.ts). Nav
// header/footer come from this route group's layout.tsx.

import { prisma } from "@/lib/db";
import FindATutorForm from "./FindATutorForm";

export const dynamic = "force-dynamic";

export default async function FindATutorPage() {
  const zones = await prisma.areaZone.findMany({ select: { name: true }, orderBy: { name: "asc" } });

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Find a tutor</h1>
        <p className="mx-auto mt-3 max-w-md text-base text-gray-600">
          Tell us what you&apos;re looking for and we&apos;ll match you with a short list of vetted tutors from your
          own area.
        </p>
      </div>
      <FindATutorForm zoneNames={zones.map((z) => z.name)} />
    </div>
  );
}
