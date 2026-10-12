// Intake state machine orchestrator (CLAUDE.md 6.1).
//
// One inbound WhatsApp message in -> at most one LLM extraction call + at most one
// outbound WhatsApp reply out. Never batches people or messages (Section 3.2).

import { prisma } from "@/lib/db";
import { sendText, notifyOperator } from "@/lib/whatsapp/client";
import { downloadWhatsAppMedia } from "@/lib/whatsapp/media";
import { uploadToSupabaseStorage } from "@/lib/storage/supabase";
import { extractTutor, extractParent } from "@/lib/llm/extract";
import { classifyCurriculum, CURRICULUM_AMBIGUOUS_NOTE } from "@/lib/intake/curriculum";
import {
  upsertTutor,
  createParentRequest,
  recordTutorDocument,
  activateTutorAfterDocuments,
} from "@/lib/intake/persist";
import {
  classifyDocumentSlot,
  extensionForMime,
  buildDocumentStoragePath,
  shouldAutoFinalize,
} from "@/lib/intake/documents";
import { runMatchingForParent } from "@/lib/matching/run";
import {
  parseSenderType,
  mergeDraft,
  missingTutorFields,
  missingParentFields,
  nextTutorFollowup,
  looksLikeCallRequest,
  type PartialData,
  type TutorDraft,
  type ParentDraft,
} from "@/lib/intake/helpers";
import {
  ASK_SENDER_TYPE,
  SENDER_TYPE_UNCLEAR,
  TUTOR_INTAKE_PROMPT,
  PARENT_INTAKE_PROMPT,
  TUTOR_FOLLOWUP_QUESTIONS,
  PARENT_CONTINUE_OR_CALL,
  PARENT_CALL_REQUESTED,
  PARENT_REQUEST_RECEIVED,
  TUTOR_ACTIVATED,
  TUTOR_DOCS_REQUEST,
  TUTOR_DOC_RECEIVED_ACK,
  TUTOR_CNIC_REQUIRED,
  TUTOR_DOC_UPLOAD_FAILED,
  CURRICULUM_DECLINE,
  GENERIC_FALLBACK,
} from "@/lib/messages";

type Step =
  | "awaiting_sender_type"
  | "collecting"
  | "awaiting_parent_choice"
  | "awaiting_documents"
  | "complete"
  | "declined";

export interface InboundInput {
  whatsappId: string;
  text: string;
  referralSourceId?: string | null;
  contactName?: string | null;
}

async function reply(whatsappId: string, body: string) {
  const res = await sendText(whatsappId, body);
  if (!res.ok) console.error(`[intake] failed to reply to ${whatsappId}: ${res.error}`);
}

async function resolveCampaignId(referralSourceId?: string | null): Promise<string | null> {
  if (!referralSourceId) return null;
  const campaign = await prisma.campaign.findUnique({
    where: { metaAdId: referralSourceId },
  });
  return campaign?.id ?? null;
}

function readPartial(raw: unknown): PartialData {
  return (raw && typeof raw === "object" ? raw : {}) as PartialData;
}

async function saveSession(
  whatsappId: string,
  senderType: "tutor" | "parent" | "unknown",
  step: Step,
  partialData: PartialData,
) {
  await prisma.intakeSession.upsert({
    where: { whatsappId },
    create: { whatsappId, senderType, step, partialData: partialData as object },
    update: { senderType, step, partialData: partialData as object },
  });
}

export async function processInboundMessage(input: InboundInput): Promise<void> {
  const { whatsappId, text } = input;
  const session = await prisma.intakeSession.findUnique({ where: { whatsappId } });
  const referralCampaignId = await resolveCampaignId(input.referralSourceId);

  // --- No session: first contact (or returning user with no live session) ---
  if (!session) {
    const [existingTutor, existingParent] = await Promise.all([
      prisma.tutor.findUnique({ where: { whatsappId } }),
      prisma.parentRequest.findFirst({ where: { whatsappId }, orderBy: { createdAt: "desc" } }),
    ]);

    if (existingTutor || existingParent) {
      await notifyOperator(
        `ℹ️ Returning contact ${whatsappId} (${existingTutor ? "tutor" : "parent"}) sent: "${text}". ` +
          `No automated flow for returning users yet — follow up manually.`,
      );
      await reply(whatsappId, GENERIC_FALLBACK);
      return;
    }

    const partial: PartialData = { campaignId: referralCampaignId };
    await saveSession(whatsappId, "unknown", "awaiting_sender_type", partial);
    await reply(whatsappId, ASK_SENDER_TYPE);
    return;
  }

  const partial = readPartial(session.partialData);
  if (referralCampaignId && !partial.campaignId) partial.campaignId = referralCampaignId;
  const step = session.step as Step;

  // --- Terminal states ---
  if (step === "complete" || step === "declined") {
    await notifyOperator(`ℹ️ ${whatsappId} (already ${step}) sent: "${text}". Handle manually if needed.`);
    await reply(whatsappId, GENERIC_FALLBACK);
    return;
  }

  // --- Awaiting "tutor or parent" answer ---
  if (step === "awaiting_sender_type") {
    const st = parseSenderType(text);
    if (!st) {
      await reply(whatsappId, SENDER_TYPE_UNCLEAR);
      return;
    }
    partial.pendingField = null;
    await saveSession(whatsappId, st, "collecting", partial);
    await reply(whatsappId, st === "tutor" ? TUTOR_INTAKE_PROMPT : PARENT_INTAKE_PROMPT);
    return;
  }

  const senderType = session.senderType as "tutor" | "parent";

  // --- Awaiting CNIC/marksheet documents (6.1 step 10) — any text here is
  // treated as a "done" signal, but only finalizes once CNIC is in. ---
  if (step === "awaiting_documents") {
    await handleAwaitingDocumentsText(whatsappId, partial);
    return;
  }

  // --- Parent chose between continuing on WhatsApp and a call ---
  if (step === "awaiting_parent_choice" && looksLikeCallRequest(text)) {
    const draft = (partial.parent ?? {}) as ParentDraft;
    const pr = await createParentRequest({
      whatsappId,
      draft,
      rawMessage: partial.parent ? JSON.stringify(draft) : text,
      campaignId: partial.campaignId,
      status: "pending",
      internalNote: "call requested by parent",
    });
    await notifyOperator(
      `📞 Parent ${whatsappId} asked for a call. Request ${pr.id} — ` +
        `subjects=${draft.subjects?.join("/") ?? "?"}, curriculum=${draft.curriculum ?? "?"}, ` +
        `area=${draft.area ?? "?"}, budget=${draft.budget ?? "?"}. Work it in a call slot.`,
    );
    await saveSession(whatsappId, senderType, "complete", partial);
    await reply(whatsappId, PARENT_CALL_REQUESTED);
    return;
  }

  // --- Collecting profile data (tutor follow-ups, or parent details) ---
  if (senderType === "tutor") {
    await handleTutorMessage(whatsappId, text, partial);
  } else {
    await handleParentMessage(whatsappId, text, partial);
  }
}

async function handleTutorMessage(whatsappId: string, text: string, partial: PartialData) {
  const answeringField = partial.pendingField ?? undefined;
  let extraction;
  try {
    extraction = await extractTutor(text, answeringField);
  } catch (err) {
    console.error(`[intake] tutor extraction failed for ${whatsappId}:`, err);
    await notifyOperator(`⚠️ Extraction failed for tutor ${whatsappId}: "${text}". Check logs.`);
    await reply(whatsappId, GENERIC_FALLBACK);
    return;
  }

  const draft = mergeDraft<TutorDraft>(partial.tutor, extraction.data);
  partial.tutor = draft;

  // Curriculum scope check (6.1 step 7) — once we actually have a curriculum value.
  if (draft.curriculum) {
    const verdict = classifyCurriculum(draft.curriculum);
    if (verdict === "decline") {
      await upsertTutor({
        whatsappId,
        draft,
        rawMessage: text,
        campaignId: partial.campaignId,
        status: "inactive",
        internalNote: "declined at intake — out-of-scope curriculum",
      });
      await saveSession(whatsappId, "tutor", "declined", partial);
      await reply(whatsappId, CURRICULUM_DECLINE);
      return;
    }
    if (verdict === "ambiguous") partial.internalNote = CURRICULUM_AMBIGUOUS_NOTE;
  }

  const missing = missingTutorFields(draft);
  if (missing.length > 0) {
    const next = nextTutorFollowup(draft)!;
    partial.pendingField = next;
    await saveSession(whatsappId, "tutor", "collecting", partial);
    await reply(whatsappId, TUTOR_FOLLOWUP_QUESTIONS[next]);
    return;
  }

  // Text fields complete — still not active yet: CNIC/marksheet verification
  // is next (6.1 step 10). Clean tutor data only enters the pool once that
  // finishes (activateTutorAfterDocuments), so status stays "pending" here.
  await upsertTutor({
    whatsappId,
    draft,
    rawMessage: text,
    campaignId: partial.campaignId,
    status: "pending",
    internalNote: partial.internalNote ?? null,
  });
  partial.pendingField = null;
  await saveSession(whatsappId, "tutor", "awaiting_documents", partial);
  await reply(whatsappId, TUTOR_DOCS_REQUEST);
}

/** Any text while awaiting documents is a "done" signal — but only finalizes
 * once CNIC has been provided (operator decision: CNIC required, marksheet
 * optional). */
async function handleAwaitingDocumentsText(whatsappId: string, partial: PartialData) {
  const tutor = await prisma.tutor.findUnique({ where: { whatsappId } });
  if (!tutor) {
    // Shouldn't happen (the tutor row is created before this step is
    // reached), but don't crash the webhook over it.
    await notifyOperator(`⚠️ ${whatsappId} is awaiting_documents with no Tutor row — check manually.`);
    await reply(whatsappId, GENERIC_FALLBACK);
    return;
  }
  if (!tutor.cnicImageUrl) {
    await reply(whatsappId, TUTOR_CNIC_REQUIRED);
    return;
  }
  await finalizeTutorDocuments(whatsappId, partial);
}

async function finalizeTutorDocuments(whatsappId: string, partial: PartialData) {
  await activateTutorAfterDocuments(whatsappId);
  await saveSession(whatsappId, "tutor", "complete", partial);
  await reply(whatsappId, TUTOR_ACTIVATED);
}

/** One inbound image while awaiting documents (6.1 step 10). Downloads via
 * Meta's media API and uploads to Supabase Storage — never OCR'd, never sent
 * to an LLM (Section 14 success criteria). Classification is a strict
 * ordinal rule (first image = CNIC, rest = marksheet), not content-based. */
export async function processInboundImage(input: { whatsappId: string; mediaId: string }): Promise<void> {
  const { whatsappId, mediaId } = input;
  const session = await prisma.intakeSession.findUnique({ where: { whatsappId } });
  if (!session || session.step !== "awaiting_documents") return; // defensive re-check

  const partial = readPartial(session.partialData);
  const tutor = await prisma.tutor.findUnique({ where: { whatsappId } });
  if (!tutor) {
    await notifyOperator(`⚠️ ${whatsappId} sent a document image with no Tutor row — check manually.`);
    return;
  }

  const media = await downloadWhatsAppMedia(mediaId);
  if (!media.ok || !media.bytes) {
    console.error(`[intake] media download failed for ${whatsappId}: ${media.error}`);
    await reply(whatsappId, TUTOR_DOC_UPLOAD_FAILED);
    return;
  }

  const kind = classifyDocumentSlot(!!tutor.cnicImageUrl);
  const ext = extensionForMime(media.mimeType);
  const path = buildDocumentStoragePath(whatsappId, kind, ext);
  const upload = await uploadToSupabaseStorage(path, media.bytes, media.mimeType ?? "image/jpeg");
  if (!upload.ok || !upload.publicUrl) {
    console.error(`[intake] storage upload failed for ${whatsappId}: ${upload.error}`);
    await reply(whatsappId, TUTOR_DOC_UPLOAD_FAILED);
    return;
  }

  const updated = await recordTutorDocument(whatsappId, kind, upload.publicUrl);
  if (kind === "marksheet" && shouldAutoFinalize(updated.marksheetImageUrls.length)) {
    await finalizeTutorDocuments(whatsappId, partial);
    return;
  }
  await reply(whatsappId, TUTOR_DOC_RECEIVED_ACK);
}

async function handleParentMessage(whatsappId: string, text: string, partial: PartialData) {
  let extraction;
  try {
    extraction = await extractParent(text, partial.pendingField ?? undefined);
  } catch (err) {
    console.error(`[intake] parent extraction failed for ${whatsappId}:`, err);
    await notifyOperator(`⚠️ Extraction failed for parent ${whatsappId}: "${text}". Check logs.`);
    await reply(whatsappId, GENERIC_FALLBACK);
    return;
  }

  const draft = mergeDraft<ParentDraft>(partial.parent, extraction.data);
  partial.parent = draft;

  if (draft.curriculum) {
    const verdict = classifyCurriculum(draft.curriculum);
    if (verdict === "decline") {
      await createParentRequest({
        whatsappId,
        draft,
        rawMessage: text,
        campaignId: partial.campaignId,
        status: "closed",
        internalNote: "declined at intake — out-of-scope curriculum",
      });
      await saveSession(whatsappId, "parent", "declined", partial);
      await reply(whatsappId, CURRICULUM_DECLINE);
      return;
    }
    if (verdict === "ambiguous") partial.internalNote = CURRICULUM_AMBIGUOUS_NOTE;
  }

  const missing = missingParentFields(draft);
  if (missing.length > 0) {
    // Budget missing is fine (6.3 Step 3); other required fields missing -> offer
    // the continue-or-call choice (6.1 step 5).
    await saveSession(whatsappId, "parent", "awaiting_parent_choice", partial);
    await reply(whatsappId, PARENT_CONTINUE_OR_CALL);
    return;
  }

  const pr = await createParentRequest({
    whatsappId,
    draft,
    rawMessage: text,
    campaignId: partial.campaignId,
    status: "pending",
    internalNote: partial.internalNote ?? null,
  });
  partial.pendingField = null;
  await saveSession(whatsappId, "parent", "complete", partial);
  await reply(whatsappId, PARENT_REQUEST_RECEIVED);

  // Auto-trigger matching (6.1 step 6). Phase 2 no-op for now.
  try {
    await runMatchingForParent(pr.id);
  } catch (err) {
    console.error(`[intake] matching trigger failed for ${pr.id}:`, err);
  }
}
