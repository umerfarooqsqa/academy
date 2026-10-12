// GET /api/opportunities — public, unauthenticated (Section 8). Returns open,
// unclaimed Match rows with publishedToPageAt set — subject, subjectGroup,
// area, curriculum, opportunityCode ONLY, never parent contact info (6.5).

import { NextResponse } from "next/server";
import { getOpenOpportunityListings } from "@/lib/opportunities/digest";

export async function GET() {
  const listings = await getOpenOpportunityListings();
  return NextResponse.json({ opportunities: listings });
}
