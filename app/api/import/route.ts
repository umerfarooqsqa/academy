// Chat-export import (2026-10 pivot — replaces live WhatsApp API intake).
// POST multipart/form-data: file (.txt or .zip), senderType ("tutor"|"parent"),
// whatsappId (operator-typed — not parsed from the export), campaignId? (optional).
//
// Orchestrates the same building blocks the old live webhook used
// (lib/intake/persist.ts, lib/intake/documents.ts, lib/storage/supabase.ts,
// lib/matching/run.ts — all reused unchanged), just fed by one whole-
// conversation LLM call instead of the message-by-message state machine.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  parseWhatsAppExport,
  formatTranscript,
  collectMediaFilenames,
} from "@/lib/import/parseWhatsAppExport";
import {
  extractZipEntries,
  findTranscriptText,
  extractImageFilesByName,
  contentTypeForFilename,
  InvalidExportError,
} from "@/lib/import/media";
import { extractTutorFromConversation, extractParentFromConversation } from "@/lib/llm/extract";
import { classifyCurriculum, CURRICULUM_AMBIGUOUS_NOTE } from "@/lib/intake/curriculum";
import { upsertTutor, createParentRequest, recordTutorDocument } from "@/lib/intake/persist";
import { classifyDocumentSlot, buildDocumentStoragePath } from "@/lib/intake/documents";
import { uploadToSupabaseStorage } from "@/lib/storage/supabase";
import { missingTutorFields, missingParentFields, type TutorDraft, type ParentDraft } from "@/lib/intake/helpers";
import { runMatchingForParent } from "@/lib/matching/run";

async function readTranscriptAndMedia(file: File): Promise<{ transcript: string; images: Map<string, Buffer> }> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const isZip = file.name.toLowerCase().endsWith(".zip");
  if (!isZip) {
    return { transcript: Buffer.from(bytes).toString("utf-8"), images: new Map() };
  }
  const entries = extractZipEntries(bytes);
  const transcript = findTranscriptText(entries);
  const images = extractImageFilesByName(entries);
  return { transcript, images };
}

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");
  const senderType = form.get("senderType");
  const whatsappId = form.get("whatsappId");
  const campaignId = form.get("campaignId");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }
  if (senderType !== "tutor" && senderType !== "parent") {
    return NextResponse.json({ error: "senderType must be 'tutor' or 'parent'" }, { status: 400 });
  }
  if (typeof whatsappId !== "string" || !whatsappId.trim()) {
    return NextResponse.json({ error: "whatsappId is required" }, { status: 400 });
  }
  const campaignIdValue = typeof campaignId === "string" && campaignId ? campaignId : null;

  let transcript: string;
  let images: Map<string, Buffer>;
  try {
    ({ transcript, images } = await readTranscriptAndMedia(file));
  } catch (err) {
    if (err instanceof InvalidExportError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }

  const messages = parseWhatsAppExport(transcript);
  const formattedTranscript = formatTranscript(messages);
  const mediaFilenames = collectMediaFilenames(messages);

  if (senderType === "tutor") {
    return handleTutorImport(whatsappId, formattedTranscript, mediaFilenames, images, campaignIdValue);
  }
  return handleParentImport(whatsappId, formattedTranscript, campaignIdValue);
}

async function handleTutorImport(
  whatsappId: string,
  transcript: string,
  mediaFilenames: string[],
  images: Map<string, Buffer>,
  campaignId: string | null,
) {
  let extraction;
  try {
    extraction = await extractTutorFromConversation(transcript);
  } catch (err) {
    return NextResponse.json({ error: `Extraction failed: ${(err as Error).message}` }, { status: 502 });
  }
  const draft = extraction.data as TutorDraft;

  if (draft.curriculum) {
    const verdict = classifyCurriculum(draft.curriculum);
    if (verdict === "decline") {
      const tutor = await upsertTutor({
        whatsappId,
        draft,
        rawMessage: transcript,
        campaignId,
        status: "inactive",
        internalNote: "declined at intake — out-of-scope curriculum",
      });
      return NextResponse.json({ tutor, declined: true, activated: false, missingFields: [] }, { status: 201 });
    }
  }
  const curriculumNote = draft.curriculum && classifyCurriculum(draft.curriculum) === "ambiguous" ? CURRICULUM_AMBIGUOUS_NOTE : null;

  // Create/update the tutor row first (status pending) so document uploads
  // below have a row to attach to — mirrors the live intake's ordering
  // (lib/intake/process.ts: upsertTutor before awaiting_documents).
  await upsertTutor({
    whatsappId,
    draft,
    rawMessage: transcript,
    campaignId,
    status: "pending",
    internalNote: curriculumNote,
  });

  // All media in the transcript is treated as a tutor document, in
  // chronological order (first = CNIC, rest = marksheet) — see
  // lib/intake/documents.ts and the plan's media-attribution rationale.
  let hasCnic = false;
  const uploadIssues: string[] = [];
  for (const filename of mediaFilenames) {
    const bytes = images.get(filename);
    if (!bytes) {
      uploadIssues.push(`${filename} referenced in chat but not found in the export`);
      continue;
    }
    const kind = classifyDocumentSlot(hasCnic);
    const ext = filename.split(".").pop() ?? "jpg";
    const path = buildDocumentStoragePath(whatsappId, kind, ext);
    const upload = await uploadToSupabaseStorage(path, bytes, contentTypeForFilename(filename));
    if (!upload.ok || !upload.publicUrl) {
      uploadIssues.push(`failed to upload ${filename}: ${upload.error}`);
      continue;
    }
    await recordTutorDocument(whatsappId, kind, upload.publicUrl);
    if (kind === "cnic") hasCnic = true;
  }

  const missing = missingTutorFields(draft);
  const notes = [curriculumNote, ...uploadIssues];
  let status: "active" | "pending";
  if (missing.length === 0 && hasCnic) {
    status = "active";
  } else {
    status = "pending";
    if (missing.length > 0) notes.push(`missing fields from import: ${missing.join(", ")}`);
    if (!hasCnic) notes.push("no CNIC image found — verify manually");
  }

  const tutor = await prisma.tutor.update({
    where: { whatsappId },
    data: { status, internalNote: notes.filter(Boolean).join("; ") || null },
  });

  return NextResponse.json({ tutor, declined: false, activated: status === "active", missingFields: missing });
}

async function handleParentImport(whatsappId: string, transcript: string, campaignId: string | null) {
  let extraction;
  try {
    extraction = await extractParentFromConversation(transcript);
  } catch (err) {
    return NextResponse.json({ error: `Extraction failed: ${(err as Error).message}` }, { status: 502 });
  }
  const draft = extraction.data as ParentDraft;

  if (draft.curriculum) {
    const verdict = classifyCurriculum(draft.curriculum);
    if (verdict === "decline") {
      const parent = await createParentRequest({
        whatsappId,
        draft,
        rawMessage: transcript,
        campaignId,
        status: "closed",
        internalNote: "declined at intake — out-of-scope curriculum",
      });
      return NextResponse.json({ parent, declined: true, missingFields: [] }, { status: 201 });
    }
  }
  const curriculumNote = draft.curriculum && classifyCurriculum(draft.curriculum) === "ambiguous" ? CURRICULUM_AMBIGUOUS_NOTE : null;

  const missing = missingParentFields(draft);
  const notes = [curriculumNote, missing.length > 0 ? `missing fields from import: ${missing.join(", ")}` : null];

  const parent = await createParentRequest({
    whatsappId,
    draft,
    rawMessage: transcript,
    campaignId,
    status: "pending",
    internalNote: notes.filter(Boolean).join("; ") || null,
  });

  // Same convention as the manual /parents/new path (app/api/parents POST) —
  // matching always runs; hard filters simply return zero candidates if the
  // profile is too incomplete to match against.
  try {
    await runMatchingForParent(parent.id);
  } catch (err) {
    console.error(`[import] matching trigger failed for ${parent.id}:`, err);
  }

  const fresh = await prisma.parentRequest.findUnique({ where: { id: parent.id } });
  return NextResponse.json({ parent: fresh ?? parent, declined: false, missingFields: missing }, { status: 201 });
}
