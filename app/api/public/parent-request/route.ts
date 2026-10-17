// Public, unauthenticated — the /find-a-tutor web form posts here. A
// structured form already gives clean fields, so this skips the LLM
// extraction step entirely (CLAUDE.md 6.2 is for free-text WhatsApp messages
// only) and goes straight into the same pipeline every other parent-intake
// path uses: lib/intake/persist.ts#createParentRequest (zone resolution,
// missing-budget note) + lib/matching/run.ts#runMatchingForParent.

import { NextResponse } from "next/server";
import { allowAttempt, clientIp, HOUR } from "@/lib/security/rateLimit";
import { createParentRequest, fillAreaFromPreciseLocation } from "@/lib/intake/persist";
import { resolveCampaignRef } from "@/lib/campaigns/ref";
import { missingParentFields, type ParentDraft } from "@/lib/intake/helpers";
import { runMatchingForParent } from "@/lib/matching/run";
import { parseCoordPair } from "@/lib/geo/zoneLookup";
import { normalizeGenderPreference } from "@/lib/tutors/gender";
import { applyRequestedTutor } from "@/lib/matching/requestedTutor";

export async function POST(req: Request) {
  // Spam-flood brake (2026-10-15): 10 submissions per hour per IP.
  if (!(await allowAttempt(`parent-form-ip:${clientIp(req)}`, 10, HOUR))) {
    return NextResponse.json({ error: "Too many submissions — please try again in an hour." }, { status: 429 });
  }
  const body = await req.json();
  const whatsappId = typeof body.whatsappId === "string" ? body.whatsappId.trim() : "";
  if (!whatsappId) {
    return NextResponse.json({ error: "A WhatsApp/contact number is required" }, { status: 400 });
  }

  const draft: ParentDraft = {
    studentInfo: body.studentInfo || null,
    subjects: Array.isArray(body.subjects) ? body.subjects.filter(Boolean) : null,
    subjectGroup: body.subjectGroup || null,
    curriculum: body.curriculum || null,
    area: body.area || null,
    budget: body.budget ? Number(body.budget) : null,
    deliveryMode: body.deliveryMode || "in_person",
    availability: Array.isArray(body.availability) ? body.availability.filter(Boolean) : null,
    tutorGenderPreference: normalizeGenderPreference(body.tutorGenderPreference),
    schoolName: typeof body.schoolName === "string" ? body.schoolName.trim().slice(0, 120) || null : null,
  };

  // From the Lili chat's "Share my location" button (browser geolocation).
  // Validated here — invalid or missing values are ignored and the picked
  // `area` is used instead. A location-only submission gets its area from
  // the nearest in-range zone before the required-field check below.
  const coords = parseCoordPair(body.latitude, body.longitude);
  if (coords) {
    draft.preciseLatitude = coords.latitude;
    draft.preciseLongitude = coords.longitude;
    await fillAreaFromPreciseLocation(draft);
  }

  // Required on the website form (2026-10-17).
  const missing = [...missingParentFields(draft), ...(draft.schoolName ? [] : ["school"])];
  if (missing.length > 0) {
    return NextResponse.json({ error: `Missing required fields: ${missing.join(", ")}` }, { status: 400 });
  }

  // Every level is accepted — Matric and primary classes included (operator
  // decision 2026-10-15; the old curriculum decline check is gone).

  const parent = await createParentRequest({
    whatsappId,
    draft,
    rawMessage: "(submitted via website)",
    // Campaign tracking link the visitor arrived through, if any (2026-10-15).
    campaignId: await resolveCampaignRef(body.campaignRef),
    status: "pending",
  });

  try {
    await runMatchingForParent(parent.id);
  } catch (err) {
    console.error(`[public/parent-request] matching trigger failed for ${parent.id}:`, err);
  }

  // "Request this tutor" from a featured tutor's profile (2026-10-15).
  if (body.preferredTutorId) {
    try {
      await applyRequestedTutor(parent.id, body.preferredTutorId);
    } catch (err) {
      console.error(`[public/parent-request] requested-tutor step failed for ${parent.id}:`, err);
    }
  }

  return NextResponse.json({ declined: false, message: "Thanks! We'll be in touch shortly with your matches." });
}
