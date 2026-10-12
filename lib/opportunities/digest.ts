// Daily Facebook Page digest (CLAUDE.md 6.5, 8: POST /api/opportunities/post-facebook-digest).
// One post per day, not one per opportunity. Guards against duplicate posts via
// SystemState["last_facebook_digest_posted_at"] (6.9's generic singleton table).

import { prisma } from "@/lib/db";
import { postToFacebookPage } from "@/lib/facebook/client";
import { formatDigestText, type OpportunityListing } from "@/lib/opportunities/formatText";

const STATE_KEY = "last_facebook_digest_posted_at";

function isSameUtcDay(a: Date, b: Date): boolean {
  return a.toISOString().slice(0, 10) === b.toISOString().slice(0, 10);
}

export async function getOpenOpportunityListings(): Promise<OpportunityListing[]> {
  const matches = await prisma.match.findMany({
    where: { publishedToPageAt: { not: null }, interestedTutorId: null },
    include: { parentRequest: true },
    orderBy: { publishedToPageAt: "desc" },
  });
  return matches
    .filter((m) => m.opportunityCode)
    .map((m) => ({
      opportunityCode: m.opportunityCode as string,
      subjects: m.parentRequest.subjects,
      subjectGroup: m.parentRequest.subjectGroup,
      curriculum: m.parentRequest.curriculum,
      area: m.parentRequest.area,
    }));
}

export async function postDailyFacebookDigest(now: Date = new Date()) {
  const state = await prisma.systemState.findUnique({ where: { key: STATE_KEY } });
  if (state && isSameUtcDay(new Date(state.value), now)) {
    return { posted: false, reason: "Already posted today" };
  }

  const listings = await getOpenOpportunityListings();
  const text = formatDigestText(listings);
  const result = await postToFacebookPage(text);

  if (result.ok) {
    await prisma.systemState.upsert({
      where: { key: STATE_KEY },
      create: { key: STATE_KEY, value: now.toISOString() },
      update: { value: now.toISOString() },
    });
  }

  return { posted: result.ok, error: result.error, listingCount: listings.length };
}
