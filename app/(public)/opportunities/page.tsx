// /opportunities — CLAUDE.md Section 7: public, NOT behind admin auth. Lists
// open, unclaimed requests with no parent contact info — the free-tier
// alternative to a paid WhatsApp push (6.5). Nav header/footer come from this
// route group's layout.tsx (2026-10-13: moved here for the same branding as
// the rest of the public site).

import { getOpenOpportunityListings } from "@/lib/opportunities/digest";
import OpportunitiesClient from "./OpportunitiesClient";

export const dynamic = "force-dynamic";

export default async function OpportunitiesPage() {
  const listings = await getOpenOpportunityListings();

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <h1 className="font-heading text-3xl font-extrabold tracking-tight text-gray-900">Open tutoring opportunities</h1>
      <p className="mt-2 max-w-2xl text-sm text-gray-600">
        Interested in one of these? Message us on WhatsApp and mention the reference code — no need to wait for an
        invite.
      </p>
      <div className="mt-6">
        <OpportunitiesClient listings={listings} />
      </div>
    </div>
  );
}
