// Public, unauthenticated — the "I'm interested" button on /opportunities
// (2026-10-14 operator decision: interest is recorded on the site itself,
// replacing "message us and mention the code" for the website, so it works
// before the Meta WhatsApp API is live and costs nothing).
//
// The tutor types their WhatsApp number; it's matched to a registered tutor
// by its last 10 digits (lib/tutors/phone.ts). Outcomes:
//   - active tutor   → interest recorded on the Match (hides the listing),
//                      operator alerted; it also shows on /matches + /dashboard
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

type Outcome = "claimed" | "pending" | "unregistered" | "taken";

function reply(outcome: Outcome, message: string, status = 200) {
  return NextResponse.json({ outcome, message }, { status });
}

async function alertOperator(text: string) {
  try {
    const result = await notifyOperator(text);
    if (!result.ok) console.warn(`[public/opportunity-interest] operator alert not sent: ${result.error}`);
  } catch (err) {
    console.error("[public/opportunity-interest] operator alert failed:", err);
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const code = typeof body.opportunityCode === "string" ? parseOpportunityCode(body.opportunityCode) : null;
  const number = typeof body.whatsappNumber === "string" ? body.whatsappNumber : "";
  if (!code) return NextResponse.json({ error: "Unknown opportunity." }, { status: 400 });
  if (!phoneKey(number)) {
    return NextResponse.json({ error: "Please enter your full WhatsApp number, e.g. 0300 1234567." }, { status: 400 });
  }

  const listing = (await getOpenOpportunityListings()).find((l) => l.opportunityCode === code);
  if (!listing) return reply("taken", "Sorry, this one was just taken — have a look at the others!");

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

  // Claim atomically: only if nobody claimed this match in the meantime.
  const claimed = await prisma.match.updateMany({
    where: { opportunityCode: code, interestedTutorId: null },
    data: { interestedTutorId: tutor.id },
  });
  if (claimed.count === 0) return reply("taken", "Sorry, this one was just taken — have a look at the others!");

  await alertOperator(
    `Website: ${tutor.name} (${tutor.whatsappId}; teaches ${tutor.subjects.join(", ")}) is interested in ${summary}. Review it on /matches.`,
  );
  const first = tutor.name.trim().split(/\s+/)[0] || "there";
  return reply("claimed", `Thanks, ${first}! We'll confirm with you on WhatsApp shortly.`);
}
