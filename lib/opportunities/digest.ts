// Daily Facebook Page digest (CLAUDE.md 6.5, 8: POST /api/opportunities/post-facebook-digest).
// One post per day, not one per opportunity. Guards against duplicate posts via
// SystemState["last_facebook_digest_posted_at"] (6.9's generic singleton table).

import { prisma } from "@/lib/db";
import { postToFacebookPage } from "@/lib/facebook/client";
import { formatDigestText, type OpportunityListing } from "@/lib/opportunities/formatText";
import { filterOpenListings, openListingCutoff } from "@/lib/opportunities/openListings";

const STATE_KEY = "last_facebook_digest_posted_at";

function isSameUtcDay(a: Date, b: Date): boolean {
  return a.toISOString().slice(0, 10) === b.toISOString().slice(0, 10);
}

/** Open opportunities for /opportunities, GET /api/opportunities and the
 * daily Facebook digest. The open/expiry/one-per-request rules live in
 * lib/opportunities/openListings.ts; this only fetches the rows — every Match
 * of each parent request with a recently published one, so a sibling's
 * confirmed interest hides the listing. */
export async function getOpenOpportunityListings(now: Date = new Date()): Promise<OpportunityListing[]> {
  const [matches, zones] = await Promise.all([
    prisma.match.findMany({
      where: { parentRequest: { matches: { some: { publishedToPageAt: { gte: openListingCutoff(now) } } } } },
      include: { parentRequest: true },
    }),
    // Same AreaZone data the admin manages via /zones and /heatmap — zone
    // centroids only, never the parent's own coordinate.
    prisma.areaZone.findMany(),
  ]);
  return filterOpenListings(matches, zones, now);
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
