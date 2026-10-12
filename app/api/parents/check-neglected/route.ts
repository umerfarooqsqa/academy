// Periodic route (vercel.json, every 15 min) — emails the operator a digest
// when a ParentRequest has sat pending, or a Match has sat awaiting_approval,
// for 3+ hours (repeats every 3h while still unresolved). Via Resend, not
// WhatsApp — deliberately kept off the WhatsApp cost budget (CLAUDE.md Section 1).

import { NextResponse } from "next/server";
import { sendNeglectDigestIfNeeded } from "@/lib/parents/actions";
import { checkCronSecret } from "@/lib/cron/guard";

export async function POST(req: Request) {
  const unauthorized = checkCronSecret(req);
  if (unauthorized) return unauthorized;

  const result = await sendNeglectDigestIfNeeded();
  return NextResponse.json(result);
}
