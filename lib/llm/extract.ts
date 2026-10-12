// One message -> one structured profile (CLAUDE.md 6.2, Section 3.1/3.2).

import { prisma } from "@/lib/db";
import { chat, parseJsonLoose } from "@/lib/llm/client";
import {
  buildExtractionSystemPrompt,
  buildExtractionUserPrompt,
  buildConversationExtractionSystemPrompt,
  buildConversationExtractionUserPrompt,
  type SenderType,
} from "@/lib/prompts/extract";
import {
  schemaFor,
  type TutorExtraction,
  type ParentExtraction,
} from "@/lib/llm/schemas";

export type ExtractionResult<T> = {
  data: T;
  provider: "groq" | "gemini";
  raw: string;
};

async function extract<T>(
  senderType: SenderType,
  rawMessage: string,
  answeringField: string | undefined,
): Promise<ExtractionResult<T>> {
  // Area classification (6.1 step 11) needs the current known-zone list in the
  // prompt — fetched fresh each call so a newly added AreaZone (via /zones) is
  // picked up immediately, with no extraction-side caching to go stale.
  const zones = await prisma.areaZone.findMany({ select: { name: true } });
  const system = buildExtractionSystemPrompt(senderType, zones.map((z) => z.name));
  const user = buildExtractionUserPrompt(rawMessage, answeringField);

  const { content, provider } = await chat({ system, user, json: true });

  let parsed: unknown;
  try {
    parsed = parseJsonLoose(content);
  } catch {
    throw new Error(`LLM returned non-JSON output: ${content.slice(0, 200)}`);
  }

  const result = schemaFor(senderType).safeParse(parsed);
  if (!result.success) {
    throw new Error(
      `LLM output failed schema validation: ${result.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ")}`,
    );
  }

  return { data: result.data as T, provider, raw: content };
}

export function extractTutor(
  rawMessage: string,
  answeringField?: string,
): Promise<ExtractionResult<TutorExtraction>> {
  return extract<TutorExtraction>("tutor", rawMessage, answeringField);
}

export function extractParent(
  rawMessage: string,
  answeringField?: string,
): Promise<ExtractionResult<ParentExtraction>> {
  return extract<ParentExtraction>("parent", rawMessage, answeringField);
}

// --- Chat-export import (2026-10 pivot — see lib/import/). One LLM call
// reads a whole conversation transcript and returns one profile, same
// zod-validated contract as the single-message extraction above. ---

async function extractFromConversation<T>(
  senderType: SenderType,
  transcript: string,
): Promise<ExtractionResult<T>> {
  const zones = await prisma.areaZone.findMany({ select: { name: true } });
  const system = buildConversationExtractionSystemPrompt(senderType, zones.map((z) => z.name));
  const user = buildConversationExtractionUserPrompt(transcript);

  const { content, provider } = await chat({ system, user, json: true });

  let parsed: unknown;
  try {
    parsed = parseJsonLoose(content);
  } catch {
    throw new Error(`LLM returned non-JSON output: ${content.slice(0, 200)}`);
  }

  const result = schemaFor(senderType).safeParse(parsed);
  if (!result.success) {
    throw new Error(
      `LLM output failed schema validation: ${result.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ")}`,
    );
  }

  return { data: result.data as T, provider, raw: content };
}

export function extractTutorFromConversation(transcript: string): Promise<ExtractionResult<TutorExtraction>> {
  return extractFromConversation<TutorExtraction>("tutor", transcript);
}

export function extractParentFromConversation(transcript: string): Promise<ExtractionResult<ParentExtraction>> {
  return extractFromConversation<ParentExtraction>("parent", transcript);
}
