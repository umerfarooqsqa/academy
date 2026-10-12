// POST /api/matching/run — manually trigger matching for a ParentRequest
// (CLAUDE.md Section 8). Also called automatically after parent intake (6.1 step 6).
//
// Delegates entirely to lib/matching/run.ts (DB fetch + writes) and
// lib/matching/engine.ts (pure 6.3 scoring, zero LLM/external calls).

import { NextRequest, NextResponse } from "next/server";
import { runMatchingForParent } from "@/lib/matching/run";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let parentRequestId: string | undefined;
  try {
    const body = (await req.json()) as { parentRequestId?: string };
    parentRequestId = body.parentRequestId;
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  if (!parentRequestId) {
    return NextResponse.json({ error: "parentRequestId is required" }, { status: 400 });
  }

  const result = await runMatchingForParent(parentRequestId);
  return NextResponse.json(result);
}
