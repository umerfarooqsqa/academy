// Public, unauthenticated — the /become-a-tutor web form posts here
// (multipart, since it may include CNIC/marksheet files). Same pipeline every
// other tutor-intake path uses (lib/intake/persist.ts#upsertTutor), minus the LLM step a structured form doesn't
// need. CNIC-gated activation rule unchanged from chat-import (CLAUDE.md 6.1
// step 10): active only once all required fields are present AND a CNIC
// image was uploaded, otherwise pending with a note, fixable later from
// /tutors/[id].
//
// Unlike chat-import's ordinal "first image = CNIC" inference, the form here
// explicitly labels which file is which, so lib/intake/documents.ts's
// classifyDocumentSlot ordinal heuristic isn't needed — more reliable than
// guessing from order.

import { NextResponse } from "next/server";
import { normalizeGender } from "@/lib/tutors/gender";
import { allowAttempt, clientIp, HOUR } from "@/lib/security/rateLimit";
import { prisma } from "@/lib/db";
import { upsertTutor, recordTutorDocument, fillAreaFromPreciseLocation } from "@/lib/intake/persist";
import { resolveCampaignRef } from "@/lib/campaigns/ref";
import { missingTutorFields, type TutorDraft } from "@/lib/intake/helpers";
import { extensionForMime, buildDocumentStoragePath } from "@/lib/intake/documents";
import { uploadToSupabaseStorage } from "@/lib/storage/supabase";
import { parseCoordPair } from "@/lib/geo/zoneLookup";
import { getSiteContent } from "@/lib/siteContent";
import { DOCUMENT_TITLES, agreementPlainText, agreementVersion } from "@/lib/agreementSnapshot";

function parseGradesBySubject(raw: FormDataEntryValue | null): Record<string, string> | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

async function uploadDocument(whatsappId: string, kind: "cnic" | "marksheet", file: File): Promise<string | null> {
  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = extensionForMime(file.type);
  const path = buildDocumentStoragePath(whatsappId, kind, ext);
  const upload = await uploadToSupabaseStorage(path, bytes, file.type || "image/jpeg");
  if (!upload.ok || !upload.publicUrl) {
    console.error(`[public/tutor-apply] ${kind} upload failed for ${whatsappId}: ${upload.error}`);
    return null;
  }
  await recordTutorDocument(whatsappId, kind, upload.publicUrl);
  return upload.publicUrl;
}

export async function POST(req: Request) {
  // Spam-flood brake (2026-10-15): 10 submissions per hour per IP.
  if (!(await allowAttempt(`tutor-form-ip:${clientIp(req)}`, 10, HOUR))) {
    return NextResponse.json({ error: "Too many submissions — please try again in an hour." }, { status: 429 });
  }
  const form = await req.formData();
  const whatsappId = (form.get("whatsappId") as string | null)?.trim() ?? "";
  if (!whatsappId) {
    return NextResponse.json({ error: "A WhatsApp/contact number is required" }, { status: 400 });
  }
  // Tutors must agree to the Terms & Conditions to register (2026-10-15);
  // when they agreed is recorded on Tutor.termsAcceptedAt below, and since
  // 2026-10-19 an exact copy of the Tutor Agreement + Terms in TermsAcceptance.
  // Required on the website form (2026-10-17): where the tutor studied.
  if (!((form.get("schoolName") as string | null) ?? "").trim()) {
    return NextResponse.json({ error: "Please tell us which school or college you studied at." }, { status: 400 });
  }
  if (form.get("acceptedTerms") !== "yes") {
    return NextResponse.json({ error: "Please agree to the Tutor Agreement and Terms & Conditions to register." }, { status: 400 });
  }
  // The Tutor Agreement shown on the form (2026-10-19) must be the current
  // one, so the copy stored as evidence below is exactly what the tutor read.
  const content = await getSiteContent();
  const shownVersion = await agreementVersion(content.tutorAgreement);
  if (form.get("agreementVersion") !== shownVersion) {
    return NextResponse.json(
      { error: "Our Tutor Agreement was just updated — please reload the page, read the new version and send again." },
      { status: 409 },
    );
  }

  const subjectsRaw = form.get("subjects") as string | null;
  const availabilityRaw = form.getAll("availability") as string[];

  const draft: TutorDraft = {
    name: (form.get("name") as string | null) || null,
    area: (form.get("area") as string | null) || null,
    subjects: subjectsRaw ? subjectsRaw.split(",").map((s) => s.trim()).filter(Boolean) : null,
    subjectGroup: (form.get("subjectGroup") as string | null) || null,
    curriculum: (form.get("curriculum") as string | null) || null,
    qualification: (form.get("qualification") as string | null) || null,
    gradesBySubject: parseGradesBySubject(form.get("gradesBySubject")),
    availability: availabilityRaw.length > 0 ? availabilityRaw : null,
    expectedFee: form.get("expectedFee") ? Number(form.get("expectedFee")) : null,
    gender: normalizeGender(form.get("gender")),
    schoolName: ((form.get("schoolName") as string | null) ?? "").trim().slice(0, 120) || null,
  };

  // From the Lili chat's "Share my location" button (browser geolocation).
  // Validated here — invalid or missing values are ignored and the picked
  // `area` is used instead. A location-only submission gets its area from
  // the nearest in-range zone before the required-field check below.
  const coords = parseCoordPair(form.get("latitude"), form.get("longitude"));
  if (coords) {
    draft.preciseLatitude = coords.latitude;
    draft.preciseLongitude = coords.longitude;
    await fillAreaFromPreciseLocation(draft);
  }

  // Every level is accepted (operator decision 2026-10-15 — no curriculum decline).

  // Create first (status pending) so document uploads below have a row to attach to.
  await upsertTutor({
    whatsappId,
    draft,
    rawMessage: "(submitted via website)",
    // Campaign tracking link the visitor arrived through, if any (2026-10-15).
    campaignId: await resolveCampaignRef(form.get("campaignRef")),
    status: "pending",
  });

  let hasCnic = false;
  const uploadIssues: string[] = [];

  const cnicFile = form.get("cnic");
  if (cnicFile instanceof File && cnicFile.size > 0) {
    const url = await uploadDocument(whatsappId, "cnic", cnicFile);
    if (url) hasCnic = true;
    else uploadIssues.push("CNIC upload failed — please try again from your profile later");
  }

  const marksheetFiles = form.getAll("marksheets").filter((f): f is File => f instanceof File && f.size > 0);
  for (const file of marksheetFiles) {
    const url = await uploadDocument(whatsappId, "marksheet", file);
    if (!url) uploadIssues.push("A marksheet upload failed — please try again from your profile later");
  }

  const missing = missingTutorFields(draft);
  const notes = [...uploadIssues];
  let status: "active" | "pending";
  if (missing.length === 0 && hasCnic) {
    status = "active";
  } else {
    status = "pending";
    if (missing.length > 0) notes.push(`missing fields from web application: ${missing.join(", ")}`);
    if (!hasCnic) notes.push("no CNIC image found — verify manually");
  }

  const tutor = await prisma.tutor.update({
    where: { whatsappId },
    data: { status, internalNote: notes.filter(Boolean).join("; ") || null, termsAcceptedAt: new Date() },
    select: { id: true },
  });

  // Evidence of what was agreed (2026-10-19): an exact copy of each document.
  const ipAddress = clientIp(req);
  const userAgent = req.headers.get("user-agent")?.slice(0, 500) ?? null;
  const accepted = [
    { document: "tutor_agreement", sections: content.tutorAgreement, updatedOn: content.tutorAgreementUpdatedOn, version: shownVersion },
    { document: "terms", sections: content.terms, updatedOn: content.termsUpdatedOn, version: await agreementVersion(content.terms) },
  ] as const;
  await prisma.termsAcceptance.createMany({
    data: accepted.map((d) => ({
      tutorId: tutor.id,
      document: d.document,
      version: d.version,
      updatedOn: d.updatedOn,
      text: agreementPlainText(DOCUMENT_TITLES[d.document], d.updatedOn, d.sections),
      whatsappId,
      ipAddress: ipAddress === "unknown" ? null : ipAddress,
      userAgent,
    })),
  });

  return NextResponse.json({
    declined: false,
    activated: status === "active",
    message:
      status === "active"
        ? "You're all set — your tutor profile is complete!"
        : "Thanks! We'll follow up to finish verifying your profile.",
  });
}
