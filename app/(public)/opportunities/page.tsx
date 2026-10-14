// /opportunities — CLAUDE.md Section 7: public, NOT behind admin auth. Lists
// open, unclaimed requests with no parent contact info — the free-tier
// alternative to a paid WhatsApp push (6.5). Nav header/footer come from this
// route group's layout.tsx. 2026-10-14 redesign: Lili-led header, "near you"
// split, category filter, and an on-site "I'm interested" button (see
// OpportunitiesClient.tsx and app/api/public/opportunity-interest).

import { getOpenOpportunityListings } from "@/lib/opportunities/digest";
import OpportunitiesClient from "./OpportunitiesClient";

export const dynamic = "force-dynamic";

export default async function OpportunitiesPage() {
  const listings = await getOpenOpportunityListings();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <OpportunitiesClient listings={listings} />
    </div>
  );
}
