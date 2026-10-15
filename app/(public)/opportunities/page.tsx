// /opportunities — CLAUDE.md Section 7: public, NOT behind admin auth. Lists
// open, unclaimed requests with no parent contact info — the free-tier
// alternative to a paid WhatsApp push (6.5). Nav header/footer come from this
// route group's layout.tsx. 2026-10-14 redesign: Lili-led header, "near you"
// split, category filter, and an on-site "I'm interested" button (see
// OpportunitiesClient.tsx and app/api/public/opportunity-interest).

import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getOpenOpportunityListings } from "@/lib/opportunities/digest";
import OpportunitiesClient from "./OpportunitiesClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tuition jobs",
  description: "Open home and online tuitions near you. Registered tutors can tap “I'm interested” to apply.",
};

export default async function OpportunitiesPage() {
  const [listings, areas] = await Promise.all([
    getOpenOpportunityListings(),
    prisma.areaZone.findMany({ select: { name: true, latitude: true, longitude: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="bg-gradient-to-b from-sky-50/70 via-white to-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <OpportunitiesClient listings={listings} areas={areas} />
      </div>
    </div>
  );
}
