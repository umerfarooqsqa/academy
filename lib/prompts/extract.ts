// LLM extraction prompt contract (CLAUDE.md 6.2).
//
// The system prompt below is stored VERBATIM from Section 6.2 and must not be
// reworded without operator sign-off (Section 2 — LLM prompt wording). It is
// parameterized only by {SENDER_TYPE}, the schema block for that sender type,
// and {AREA_ZONE_NAMES} (the current AreaZone.name list, for the area
// classification step — 6.1 step 11).

import { AVAILABILITY_TAGS } from "@/lib/messages";
import { SUBJECT_GROUPS } from "@/lib/subjectGroups";

export type SenderType = "tutor" | "parent";

const TUTOR_SCHEMA_BLOCK = `{
  "name": string | null,
  "email": string | null,
  "phone": string | null,
  "qualification": string | null,
  "subjects": string[] | null,
  "subjectGroup": "${SUBJECT_GROUPS.join('" | "')}" | null,
  "curriculum": string | null,
  "gradesBySubject": { [subject: string]: string } | null,
  "area": string | null,
  "availability": string[] | null,
  "expectedFee": number | null,
  "missingFields": string[]
}`;

const PARENT_SCHEMA_BLOCK = `{
  "studentInfo": string | null,
  "subjects": string[] | null,
  "subjectGroup": "${SUBJECT_GROUPS.join('" | "')}" | null,
  "curriculum": string | null,
  "area": string | null,
  "deliveryMode": "in_person" | "online" | "both" | null,
  "budget": number | null,
  "availability": string[] | null,
  "missingFields": string[]
}`;

// Verbatim from CLAUDE.md Section 6.2 — do not reword without operator sign-off.
const SYSTEM_PROMPT_VERBATIM =
  "You are extracting ONE structured profile from ONE WhatsApp message. Never invent data " +
  "that is not present in or clearly implied by the message. Sender type: {SENDER_TYPE}. " +
  "Return only valid JSON matching the schema you've been given — no explanation, no markdown " +
  "code fences, no extra keys. If a field is absent or unclear, set it to null and add its key " +
  "name to the missingFields array. For the availability field, use only values from the fixed " +
  "list you've been given — if a mentioned time doesn't clearly map to one of those values, " +
  "omit it rather than guessing. For the area field, classify the message's location/landmark " +
  "description to the single closest match from this list of known zones: {AREA_ZONE_NAMES} — " +
  "if nothing matches with reasonable confidence, set area to null rather than guessing. Do not " +
  "add subjects, curriculum, or area values that are not explicitly stated or clearly implied " +
  "by the message.";

export function buildExtractionSystemPrompt(senderType: SenderType, areaZoneNames: string[]): string {
  const schemaBlock = senderType === "tutor" ? TUTOR_SCHEMA_BLOCK : PARENT_SCHEMA_BLOCK;
  const zoneList = areaZoneNames.length > 0 ? areaZoneNames.join(", ") : "(none configured yet)";
  return [
    SYSTEM_PROMPT_VERBATIM.replace("{SENDER_TYPE}", senderType).replace("{AREA_ZONE_NAMES}", zoneList),
    "",
    "JSON schema:",
    schemaBlock,
    "",
    `Fixed availability list (use only these exact strings): ${AVAILABILITY_TAGS.join(", ")}.`,
  ].join("\n");
}

// The user-message payload for the extraction call. When this is a follow-up
// answer, `answeringField` tells the model which single field the reply fills.
export function buildExtractionUserPrompt(
  rawMessage: string,
  answeringField?: string,
): string {
  if (answeringField) {
    return (
      `This message is the user's answer to a follow-up question about the field ` +
      `"${answeringField}". Extract that field (and any other details volunteered).\n\n` +
      `Message: ${rawMessage}`
    );
  }
  return `Message: ${rawMessage}`;
}

// --- Chat-export import (2026-10 pivot: replaces live WhatsApp API intake —
// see lib/import/). One LLM call reads a WHOLE conversation transcript
// (operator's own WhatsApp chat with a tutor/parent, exported via WhatsApp's
// native "Export Chat") and outputs one profile, same schema/zod contract as
// the single-message §6.2 extraction above. The verbatim §6.2 prompt above is
// left untouched; this is a new, separate prompt for the new entry point. ---

const CONVERSATION_SYSTEM_PROMPT =
  "You are extracting ONE structured profile from a WHOLE WhatsApp conversation transcript " +
  "between our academy and a prospective {SENDER_TYPE}. The transcript includes both our side " +
  "of the conversation (questions we asked) and theirs (their answers) — extract ONLY the " +
  "{SENDER_TYPE}'s profile, ignoring our own messages except as context for what their replies " +
  "are answering. Never invent data that is not present in or clearly implied by the transcript. " +
  "Return only valid JSON matching the schema you've been given — no explanation, no markdown " +
  "code fences, no extra keys. If a field is absent or unclear anywhere in the conversation, set " +
  "it to null and add its key name to the missingFields array. For the availability field, use " +
  "only values from the fixed list you've been given — if a mentioned time doesn't clearly map " +
  "to one of those values, omit it rather than guessing. For the area field, classify the " +
  "{SENDER_TYPE}'s stated location/landmark to the single closest match from this list of known " +
  "zones: {AREA_ZONE_NAMES} — if nothing matches with reasonable confidence, set area to null " +
  "rather than guessing. Do not add subjects, curriculum, or area values that are not explicitly " +
  "stated or clearly implied by the {SENDER_TYPE}'s own messages. Messages shown as " +
  "\"[sent an image: ...]\" are photos (e.g. CNIC, marksheet) — note their presence in " +
  "missingFields reasoning only if relevant, never attempt to describe their contents.";

export function buildConversationExtractionSystemPrompt(
  senderType: SenderType,
  areaZoneNames: string[],
): string {
  const schemaBlock = senderType === "tutor" ? TUTOR_SCHEMA_BLOCK : PARENT_SCHEMA_BLOCK;
  const zoneList = areaZoneNames.length > 0 ? areaZoneNames.join(", ") : "(none configured yet)";
  return [
    CONVERSATION_SYSTEM_PROMPT.replace(/\{SENDER_TYPE\}/g, senderType).replace("{AREA_ZONE_NAMES}", zoneList),
    "",
    "JSON schema:",
    schemaBlock,
    "",
    `Fixed availability list (use only these exact strings): ${AVAILABILITY_TAGS.join(", ")}.`,
  ].join("\n");
}

export function buildConversationExtractionUserPrompt(transcript: string): string {
  return `Conversation transcript (chronological order):\n\n${transcript}`;
}
