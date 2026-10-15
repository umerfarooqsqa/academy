// Periodic route (CLAUDE.md 6.5 step 7, Section 8) — triggered by Vercel Cron
// every 15 minutes (vercel.json), no queue service. Publishes any approved
// Match whose notifyAt deadline has passed with no confirmed tutor interest yet.

import { NextResponse } from "next/server";
import { publishDueOpportunities } from "@/lib/matches/actions";
import { assignMissingOpportunityCodes } from "@/lib/opportunities/requestCode";
import { checkCronSecret } from "@/lib/cron/guard";

export async function POST(req: Request) {
  const unauthorized = checkCronSecret(req);
  if (unauthorized) return unauthorized;

  const published = await publishDueOpportunities();
  // Every open request is a public opportunity (2026-10-15) — make sure each
  // has its OPP code, e.g. requests from before that change.
  const codesAssigned = await assignMissingOpportunityCodes();
  return NextResponse.json({ published: published.length, matchIds: published, codesAssigned });
}
