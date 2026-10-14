// Public, unauthenticated (2026-10-13 public website feature). Parent request
// chat with Lili (one question at a time, 2026-10-14) — submits straight into
// the same ParentRequest pipeline every other intake path uses (see
// app/api/public/parent-request/route.ts). Nav header/footer come from this
// route group's layout.tsx.

import { prisma } from "@/lib/db";
import FindATutorChat from "./FindATutorChat";

export const dynamic = "force-dynamic";

export default async function FindATutorPage() {
  const zones = await prisma.areaZone.findMany({
    select: { name: true, latitude: true, longitude: true, maxKm: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <div className="text-center">
        <h1 className="font-heading text-4xl font-extrabold tracking-tight text-gray-900">Find a tutor</h1>
        <p className="mx-auto mt-3 max-w-md text-base text-gray-600">
          Tell us what you&apos;re looking for and we&apos;ll match you with a short list of great tutors from your
          own area.
        </p>
      </div>
      <FindATutorChat zones={zones} />
    </div>
  );
}
