// POST /api/opportunities/post-facebook-digest — scheduled every 3 hours
// (wrangler.jsonc triggers + worker.ts; 2026-10-15, was once daily). Posts
// every open tuition not yet on the Facebook Page, together in one post, each
// tuition once (lib/opportunities/digest.ts#postNewTuitionsToFacebook).
// Nothing new → no post. Guarded by CRON_SECRET like the other cron routes.

import { NextResponse } from "next/server";
import { postNewTuitionsToFacebook } from "@/lib/opportunities/digest";
import { checkCronSecret } from "@/lib/cron/guard";

export async function POST(req: Request) {
  const unauthorized = checkCronSecret(req);
  if (unauthorized) return unauthorized;

  const result = await postNewTuitionsToFacebook();
  return NextResponse.json(result);
}
