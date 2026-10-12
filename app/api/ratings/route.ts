// POST /api/ratings — inbound star rating from a parent (CLAUDE.md 6.8 step 2,
// Section 8). Updates Tutor.rating/ratingCount via the running-average formula.

import { NextResponse } from "next/server";
import { applyRating } from "@/lib/ratings/actions";

export async function POST(req: Request) {
  const body = await req.json();
  if (!body.matchId || body.stars == null) {
    return NextResponse.json({ error: "matchId and stars are required" }, { status: 400 });
  }
  const stars = Number(body.stars);
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
    return NextResponse.json({ error: "stars must be an integer 1-5" }, { status: 400 });
  }
  const rating = await applyRating(body.matchId, stars, body.comment ?? null);
  return NextResponse.json({ rating }, { status: 201 });
}
