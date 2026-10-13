// Public, unauthenticated — the /become-a-tutor web form posts here
// (multipart, since it may include CNIC/marksheet files). Same pipeline every
// other tutor-intake path uses (lib/intake/persist.ts#upsertTutor, the same
// curriculum decline check), minus the LLM step a structured form doesn't
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
import { prisma } from "@/lib/db";
import { classifyCurriculum, CURRICULUM_AMBIGUOUS_NOTE } from "@/lib/intake/curriculum";
import { upsertTutor, recordTutorDocument } from "@/lib/intake/persist";
import { missingTutorFields, type TutorDraft } from "@/lib/intake/helpers";
import { extensionForMime, buildDocumentStoragePath } from "@/lib/intake/documents";
import { uploadToSupabaseStorage } from "@/lib/storage/supabase";
import { CURRICULUM_DECLINE } from "@/lib/messages";
import { extractCoordsFromText } from "@/lib/geo/googleMapsLink";

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
  const form = await req.formData();
  const whatsappId = (form.get("whatsappId") as string | null)?.trim() ?? "";
  if (!whatsappId) {
    return NextResponse.json({ error: "A WhatsApp/contact number is required" }, { status: 400 });
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
  };

  // Never trust client-side extraction for the authoritative value — the
  // server re-parses the pasted link itself. A non-Maps link or garbled
  // paste is silently ignored and the dropdown's `area` value is used instead.
  const locationLink = form.get("locationLink") as string | null;
  if (locationLink && locationLink.trim()) {
    const coords = extractCoordsFromText(locationLink);
    if (coords) {
      draft.preciseLatitude = coords.latitude;
      draft.preciseLongitude = coords.longitude;
    }
  }

  if (draft.curriculum && classifyCurriculum(draft.curriculum) === "decline") {
    await upsertTutor({
      whatsappId,
      draft,
      rawMessage: "(submitted via website)",
      status: "inactive",
      internalNote: "declined at intake — out-of-scope curriculum",
    });
    return NextResponse.json({ declined: true, message: CURRICULUM_DECLINE });
  }

  const curriculumNote =
    draft.curriculum && classifyCurriculum(draft.curriculum) === "ambiguous" ? CURRICULUM_AMBIGUOUS_NOTE : null;

  // Create first (status pending) so document uploads below have a row to attach to.
  await upsertTutor({
    whatsappId,
    draft,
    rawMessage: "(submitted via website)",
    status: "pending",
    internalNote: curriculumNote,
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
  const notes = [curriculumNote, ...uploadIssues];
  let status: "active" | "pending";
  if (missing.length === 0 && hasCnic) {
    status = "active";
  } else {
    status = "pending";
    if (missing.length > 0) notes.push(`missing fields from web application: ${missing.join(", ")}`);
    if (!hasCnic) notes.push("no CNIC image found — verify manually");
  }

  await prisma.tutor.update({
    where: { whatsappId },
    data: { status, internalNote: notes.filter(Boolean).join("; ") || null },
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
