// /opportunities — CLAUDE.md Section 7: public, NOT behind admin auth. Lists
// open, unclaimed requests with no parent contact info — the free-tier
// alternative to a paid WhatsApp push (6.5).

import { getOpenOpportunityListings } from "@/lib/opportunities/digest";
import OpportunitiesClient from "./OpportunitiesClient";

export const dynamic = "force-dynamic";

export default async function OpportunitiesPage() {
  const listings = await getOpenOpportunityListings();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-gray-900">Open tutoring opportunities</h1>
      <p className="mt-1 max-w-2xl text-sm text-gray-600">
        Interested in one of these? Message us on WhatsApp and mention the reference code — no
        need to wait for an invite.
      </p>
      <div className="mt-6">
        <OpportunitiesClient listings={listings} />
      </div>
    </main>
  );
}
