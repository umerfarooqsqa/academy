// Public "OPP-1234" reference codes for parent requests (2026-10-15 — every
// non-closed request is a public opportunity; see openListings.ts). Unique
// across ParentRequest codes and the older Match codes, so a code typed on
// /opportunities can only ever mean one thing.

import { prisma } from "@/lib/db";
import { generateOpportunityCode } from "@/lib/opportunities/code";

export async function newOpportunityCode(): Promise<string> {
  for (let attempt = 0; attempt < 25; attempt++) {
    const code = generateOpportunityCode();
    const [request, match] = await Promise.all([
      prisma.parentRequest.findUnique({ where: { opportunityCode: code }, select: { id: true } }),
      prisma.match.findUnique({ where: { opportunityCode: code }, select: { id: true } }),
    ]);
    if (!request && !match) return code;
  }
  throw new Error("Could not find a free opportunity code");
}

/** Gives a code to any open request that doesn't have one yet (e.g. requests
 * from before 2026-10-15). Run by the 15-minute scheduled check and before
 * each Facebook post. Returns how many were assigned. */
export async function assignMissingOpportunityCodes(): Promise<number> {
  const missing = await prisma.parentRequest.findMany({
    where: { status: { not: "closed" }, opportunityCode: null },
    select: { id: true },
  });
  for (const r of missing) {
    await prisma.parentRequest.update({ where: { id: r.id }, data: { opportunityCode: await newOpportunityCode() } });
  }
  return missing.length;
}
