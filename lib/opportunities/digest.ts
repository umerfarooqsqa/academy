// Public opportunities (/opportunities, GET /api/opportunities, the homepage)
// and the Facebook Page posts (CLAUDE.md 6.5, 8: POST
// /api/opportunities/post-facebook-digest).
//
// 2026-10-15 operator decision: every open parent request is listed (rules in
// lib/opportunities/openListings.ts), and every 3 hours any open tuition not
// yet posted to the Page is posted — together in one post, each tuition once
// (ParentRequest.facebookPostedAt). Nothing new → no post.
//
// 2026-10-19: each posted tuition is also shared as its own Page Story — a
// picture with the full details (lib/facebook/storyCard.ts), drawn by
// Cloudflare Browser Rendering. ParentRequest.facebookStoryPostedAt marks it
// done; failures and anything over the per-run cap are retried next run.

import { prisma } from "@/lib/db";
import { postPhotoStoryToFacebookPage, postToFacebookPage } from "@/lib/facebook/client";
import { STORY_HEIGHT, STORY_WIDTH, storyCardHtml } from "@/lib/facebook/storyCard";
import { renderHtmlToPng } from "@/lib/cloudflare/screenshot";
import { getSiteContent } from "@/lib/siteContent";
import { formatTuitionsPost, type OpportunityListing } from "@/lib/opportunities/formatText";
import { filterOpenListings, isOpenRequest, openListingCutoff, toListing } from "@/lib/opportunities/openListings";
import { assignMissingOpportunityCodes } from "@/lib/opportunities/requestCode";
import { PUBLIC_SITE_URL } from "@/lib/site";

// Browser Rendering's free plan allows 6 screenshots a minute — one run never
// needs to wait. More than this in 3 hours just carries over to the next run.
const MAX_STORIES_PER_RUN = 6;

function fetchRequests(
  now: Date,
  extraWhere: { facebookPostedAt?: null | { not: null }; facebookStoryPostedAt?: null } = {},
) {
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
      schoolName: true,
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

  let post: { posted: boolean; reason?: string; error?: string; postId?: string; count: number };
  if (fresh.length === 0) {
    post = { posted: false, reason: "No new tuitions", count: 0 };
  } else {
    const text = formatTuitionsPost(
      fresh.map((r) => toListing(r, zones)),
      PUBLIC_SITE_URL,
    );
    const result = await postToFacebookPage(text);
    if (result.ok) {
      await prisma.parentRequest.updateMany({ where: { id: { in: fresh.map((r) => r.id) } }, data: { facebookPostedAt: now } });
    }
    post = { posted: result.ok, error: result.error, postId: result.postId, count: fresh.length };
  }
  return { ...post, stories: await postTuitionStories(now) };
}

/** One Page Story per open tuition that's on the Page but has no story yet
 * (oldest first, at most MAX_STORIES_PER_RUN). */
export async function postTuitionStories(now: Date = new Date()) {
  const [rows, zones, content] = await Promise.all([
    fetchRequests(now, { facebookPostedAt: { not: null }, facebookStoryPostedAt: null }),
    prisma.areaZone.findMany(),
    getSiteContent(),
  ]);
  const due = rows
    .filter((r) => isOpenRequest(r, now))
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .slice(0, MAX_STORIES_PER_RUN);

  let posted = 0;
  const errors: string[] = [];
  for (const r of due) {
    const html = storyCardHtml(toListing(r, zones), { siteName: content.siteName, siteUrl: PUBLIC_SITE_URL });
    const image = await renderHtmlToPng(html, { width: STORY_WIDTH, height: STORY_HEIGHT });
    if (!image.ok) {
      errors.push(`${r.opportunityCode}: ${image.error}`);
      // Not configured or out of today's allowance — the rest would fail too.
      break;
    }
    const story = await postPhotoStoryToFacebookPage(image.png);
    if (!story.ok) {
      errors.push(`${r.opportunityCode}: ${story.error}`);
      continue;
    }
    await prisma.parentRequest.update({ where: { id: r.id }, data: { facebookStoryPostedAt: new Date() } });
    posted++;
  }
  if (errors.length) console.error(`[facebook stories] ${errors.join(" | ")}`);
  return { due: due.length, posted, errors };
}
