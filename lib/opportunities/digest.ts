// Public opportunities (/opportunities, GET /api/opportunities, the homepage)
// and the Facebook Page posts (CLAUDE.md 6.5, 8: POST
// /api/opportunities/post-facebook-digest).
//
// 2026-10-15 operator decision: every open parent request is listed (rules in
// lib/opportunities/openListings.ts), and every 3 hours any open tuition not
// yet posted to the Page is posted — together in one post, each tuition once
// (ParentRequest.facebookPostedAt). Nothing new → no post.

import { prisma } from "@/lib/db";
import { postToFacebookPage } from "@/lib/facebook/client";
import { formatTuitionsPost, type OpportunityListing } from "@/lib/opportunities/formatText";
import { filterOpenListings, isOpenRequest, openListingCutoff, toListing } from "@/lib/opportunities/openListings";
import { assignMissingOpportunityCodes } from "@/lib/opportunities/requestCode";
import { PUBLIC_SITE_URL } from "@/lib/site";

function fetchRequests(now: Date, extraWhere: { facebookPostedAt?: null } = {}) {
  return prisma.parentRequest.findMany({
    where: {
      status: { not: "closed" },
      publicHiddenAt: null,
      opportunityCode: { not: null },
      createdAt: { gte: openListingCutoff(now) },
      ...extraWhere,
    },
    select: {
      id: true,
      status: true,
      opportunityCode: true,
      publicHiddenAt: true,
      createdAt: true,
      subjects: true,
      subjectGroup: true,
      curriculum: true,
      area: true,
      deliveryMode: true,
      availability: true,
      matches: { select: { status: true, interestedTutorId: true } },
    },
  });
}

export async function getOpenOpportunityListings(now: Date = new Date()): Promise<OpportunityListing[]> {
  const [rows, zones] = await Promise.all([
    fetchRequests(now),
    // Same AreaZone data the admin manages via /zones — zone centroids only,
    // never the parent's own coordinate.
    prisma.areaZone.findMany(),
  ]);
  return filterOpenListings(rows, zones, now);
}

/** Posts every open tuition that hasn't been posted to the Facebook Page yet,
 * in one post. Called every 3 hours by the scheduled job. */
export async function postNewTuitionsToFacebook(now: Date = new Date()) {
  await assignMissingOpportunityCodes();
  const [rows, zones] = await Promise.all([fetchRequests(now, { facebookPostedAt: null }), prisma.areaZone.findMany()]);
  const fresh = rows.filter((r) => isOpenRequest(r, now)).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  if (fresh.length === 0) return { posted: false, reason: "No new tuitions", count: 0 };

  const text = formatTuitionsPost(
    fresh.map((r) => toListing(r, zones)),
    PUBLIC_SITE_URL,
  );
  const result = await postToFacebookPage(text);
  if (result.ok) {
    await prisma.parentRequest.updateMany({ where: { id: { in: fresh.map((r) => r.id) } }, data: { facebookPostedAt: now } });
  }
  return { posted: result.ok, error: result.error, postId: result.postId, count: fresh.length };
}
