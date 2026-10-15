// Public, unauthenticated — the "I'm interested" button on /opportunities
// (2026-10-14: interest is recorded on the site itself, so it works before
// the Meta WhatsApp API is live and costs nothing).
//
// Since 2026-10-15 every open parent request is listed (not only approved
// matches), so interest is recorded as a Match between that request and the
// tutor: an existing Match is marked, otherwise a new one is created with
// status "awaiting_approval" — it appears on /matches for the operator to
// review like any other match. Either way the listing disappears from
// /opportunities (lib/opportunities/openListings.ts).
//
// The tutor types their WhatsApp number; it's matched to a registered tutor
// by its last 10 digits (lib/tutors/phone.ts). Outcomes:
//   - active tutor   → interest recorded, operator alerted
//   - pending tutor  → not claimed (not in the matching pool yet); operator alerted
//   - unknown number → asked to register first
//   - code not open  → "just taken"
// Nothing about the parent is ever returned.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOpenOpportunityListings } from "@/lib/opportunities/digest";
import { parseOpportunityCode } from "@/lib/opportunities/code";
import { phoneKey, samePhone } from "@/lib/tutors/phone";
import { notifyOperator } from "@/lib/whatsapp/client";
import { allowAttempt, clientIp, HOUR } from "@/lib/security/rateLimit";

type Outcome = "claimed" | "pending" | "unregistered" | "taken";

function reply(outcome: Outcome, message: string, status = 200) {
  return NextResponse.json({ outcome, message }, { status });
}

const TAKEN = "Sorry, this one was just taken — have a look at the others!";

async function alertOperator(text: string) {
  try {
    const result = await notifyOperator(text);
    if (!result.ok) console.warn(`[public/opportunity-interest] operator alert not sent: ${result.error}`);
  } catch (err) {
    console.error("[public/opportunity-interest] operator alert failed:", err);
  }
}

export async function POST(req: Request) {
  // Stops anyone trying number after number to learn which ones belong to
  // tutors (2026-10-15): 10 tries per hour per IP.
  if (!(await allowAttempt(`interest-ip:${clientIp(req)}`, 10, HOUR))) {
    return NextResponse.json({ error: "Too many tries — please try again in an hour." }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const code = typeof body.opportunityCode === "string" ? parseOpportunityCode(body.opportunityCode) : null;
  const number = typeof body.whatsappNumber === "string" ? body.whatsappNumber : "";
  if (!code) return NextResponse.json({ error: "Unknown opportunity." }, { status: 400 });
  if (!phoneKey(number)) {
    return NextResponse.json({ error: "Please enter your full WhatsApp number, e.g. 0300 1234567." }, { status: 400 });
  }

  const listing = (await getOpenOpportunityListings()).find((l) => l.opportunityCode === code);
  const request = listing ? await prisma.parentRequest.findUnique({ where: { opportunityCode: code }, select: { id: true } }) : null;
  if (!listing || !request) return reply("taken", TAKEN);

  // Tutor lists are small at this stage, so compare in code rather than
  // normalizing every stored whatsappId (they're stored as entered).
  const tutors = await prisma.tutor.findMany({ select: { id: true, name: true, whatsappId: true, status: true, subjects: true } });
  const tutor = tutors.find((t) => samePhone(t.whatsappId, number));
  const summary = `${code} (${listing.subjects.join(", ") || "tutor"}, ${listing.deliveryMode === "online" ? "online" : listing.area})`;

  if (!tutor) {
    return reply("unregistered", "I don't have a tutor profile for that number yet — register first (it takes 3 minutes), then come back and tap I'm interested.");
  }

  if (tutor.status !== "active") {
    await alertOperator(
      `Website: ${tutor.name || "a tutor"} (${tutor.whatsappId}, status ${tutor.status}) is interested in ${summary} — profile not active yet, so not claimed.`,
    );
    return reply("pending", "Your profile is still being verified — I've passed your interest to the team and they'll be in touch.");
  }

  // Someone may have claimed it a moment ago — re-check before recording.
  const claimedAlready = await prisma.match.findFirst({
    where: { parentRequestId: request.id, interestedTutorId: { not: null }, status: { notIn: ["rejected", "unmatched"] } },
    select: { id: true },
  });
  if (claimedAlready) return reply("taken", TAKEN);

  const existing = await prisma.match.findFirst({
    where: { parentRequestId: request.id, tutorId: tutor.id },
    select: { id: true, status: true },
  });
  // A tutor already turned down / unmatched for this student (2026-10-15).
  if (existing && (existing.status === "rejected" || existing.status === "unmatched")) {
    return reply("taken", "Thanks — this one isn't available to you, but have a look at the others!");
  }
  if (existing) {
    await prisma.match.update({ where: { id: existing.id }, data: { interestedTutorId: tutor.id } });
  } else {
    await prisma.match.create({
      data: {
        parentRequestId: request.id,
        tutorId: tutor.id,
        score: 0,
        status: "awaiting_approval",
        interestedTutorId: tutor.id,
        internalNote: `tutor said "I'm interested" on /opportunities (${code}) — not from the matching engine, check fit`,
      },
    });
  }

  await alertOperator(
    `Website: ${tutor.name} (${tutor.whatsappId}; teaches ${tutor.subjects.join(", ")}) is interested in ${summary}. Review it on /matches.`,
  );
  // No name in the reply — it would confirm whose number this is.
  return reply("claimed", "Thanks! We'll confirm with you on WhatsApp shortly.");
}
