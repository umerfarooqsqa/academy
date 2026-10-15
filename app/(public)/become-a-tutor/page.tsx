// Public, unauthenticated (2026-10-13 public website feature). Tutor
// registration form where Lili asks one question at a time (2026-10-14) —
// submits straight into the same Tutor pipeline every other intake path uses
// (see app/api/public/tutor-apply/route.ts). Nav header/footer come from this
// route group's layout.tsx.

import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import BecomeATutorForm from "./BecomeATutorForm";
import { CheckIcon } from "../icons";
import { checkDot, container, eyebrow } from "../ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Become a tutor",
  description: "Register free and get matched with students close to you — save on travel time and fuel cost.",
};

export default async function BecomeATutorPage() {
  const zones = await prisma.areaZone.findMany({
    select: { name: true, latitude: true, longitude: true, maxKm: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="bg-gradient-to-b from-sky-50/70 to-white">
      <div className={`${container} max-w-2xl py-12 sm:py-16`}>
        <div className="text-center">
          <p className={eyebrow}>Become a tutor</p>
          <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Teach students near you</h1>
          <p className="mx-auto mt-3 max-w-md text-base text-slate-600">
            Get matched with students close to you — save on travel time and fuel cost.
          </p>
          <ul className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-slate-700">
            {["Free to register", "Students from your area", "Takes 3 minutes"].map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <span className={checkDot}>
                  <CheckIcon />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <BecomeATutorForm zones={zones} />
      </div>
    </div>
  );
}
