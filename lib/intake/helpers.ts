// Pure helpers for the intake state machine (CLAUDE.md 6.1). No I/O here.

import type { SenderType } from "@/lib/prompts/extract";
import { TUTOR_FOLLOWUP_ORDER } from "@/lib/messages";

export function parseSenderType(text: string): SenderType | null {
  const t = text.toLowerCase();

  // "I want to teach" / "register me as a tutor" — the person offering tutoring.
  const tutorIntent =
    /\bi\s*(?:am|'?m)\s+a\s+(?:tutor|teacher)\b/.test(t) ||
    /\bi\s+teach\b/.test(t) ||
    /\b(?:want|looking|wish)\s+to\s+teach\b/.test(t) ||
    /\bregister\b.*\btutor\b/.test(t) ||
    /\bapply\b.*\btutor\b/.test(t);

  // "looking for a tutor for my son" — the person seeking tutoring.
  const parentIntent =
    /\b(?:looking|search(?:ing)?)\s+for\s+(?:a\s+)?(?:tutor|teacher)\b/.test(t) ||
    /\bneed\s+(?:a\s+)?(?:tutor|teacher)\b/.test(t) ||
    /\bfor\s+my\s+(?:son|daughter|child|kid)\b/.test(t) ||
    /\bmy\s+(?:son|daughter|child|kid)\b/.test(t) ||
    /\bi\s*(?:am|'?m)\s+a\s+parent\b/.test(t) ||
    /\bparent\b/.test(t);

  if (tutorIntent && parentIntent) return null; // contradictory — ask again
  if (tutorIntent) return "tutor";
  if (parentIntent) return "parent";

  // Bare one-word replies to ASK_SENDER_TYPE.
  const bareTutor = /^\s*(?:a\s+)?(?:tutor|teacher)\s*$/.test(t);
  const bareParent = /^\s*(?:a\s+)?parent\s*$/.test(t);
  if (bareTutor && !bareParent) return "tutor";
  if (bareParent && !bareTutor) return "parent";

  return null;
}

// Accumulated draft profile, stored in IntakeSession.partialData.
export interface TutorDraft {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  qualification?: string | null;
  subjects?: string[] | null;
  subjectGroup?: string | null;
  curriculum?: string | null;
  gradesBySubject?: Record<string, string> | null;
  area?: string | null;
  availability?: string[] | null;
  expectedFee?: number | null;
  gender?: "female" | "male" | null; // website form only (2026-10-15)
  // Set when a shared Google Maps location link was found (lib/geo/googleMapsLink.ts)
  // — a bonus precision signal, never required, never part of missingTutorFields.
  preciseLatitude?: number | null;
  preciseLongitude?: number | null;
}

export interface ParentDraft {
  studentInfo?: string | null;
  subjects?: string[] | null;
  subjectGroup?: string | null;
  curriculum?: string | null;
  area?: string | null;
  budget?: number | null;
  deliveryMode?: string | null;
  availability?: string[] | null;
  tutorGenderPreference?: "any" | "female" | "male" | null; // website form only (2026-10-15)
  // Set when a shared Google Maps location link was found (lib/geo/googleMapsLink.ts)
  // — a bonus precision signal, never required, never part of missingParentFields.
  preciseLatitude?: number | null;
  preciseLongitude?: number | null;
}

export interface PartialData {
  campaignId?: string | null;
  pendingField?: string | null;
  internalNote?: string | null;
  tutor?: TutorDraft;
  parent?: ParentDraft;
}

/** Merge a fresh extraction over an accumulated draft — only non-null values win,
 * so a later message that omits a field doesn't wipe an earlier answer. */
export function mergeDraft<T extends object>(base: T | undefined, incoming: object): T {
  const out: Record<string, unknown> = { ...(base ?? {}) };
  for (const [k, v] of Object.entries(incoming)) {
    if (v === null || v === undefined) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return out as T;
}

// --- Required-field checks (expectedFee / budget / availability are NOT required;
// they are soft-scored or neutral-defaulted in 6.3). ---

function isEmptyValue(v: unknown): boolean {
  if (v === null || v === undefined || v === "") return true;
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === "object") return Object.keys(v as object).length === 0;
  return false;
}

export const REQUIRED_TUTOR_FIELDS = [...TUTOR_FOLLOWUP_ORDER] as const;

export function missingTutorFields(d: TutorDraft): string[] {
  return REQUIRED_TUTOR_FIELDS.filter((f) => isEmptyValue(d[f as keyof TutorDraft]));
}

export const REQUIRED_PARENT_FIELDS = ["subjects", "subjectGroup", "curriculum", "area"] as const;

export function missingParentFields(d: ParentDraft): string[] {
  return REQUIRED_PARENT_FIELDS.filter((f) => isEmptyValue(d[f as keyof ParentDraft]));
}

/** First missing tutor field in the §13 priority order (that's also the ask order). */
export function nextTutorFollowup(d: TutorDraft): (typeof TUTOR_FOLLOWUP_ORDER)[number] | null {
  for (const f of TUTOR_FOLLOWUP_ORDER) {
    if (isEmptyValue(d[f as keyof TutorDraft])) return f;
  }
  return null;
}

export function looksLikeCallRequest(text: string): boolean {
  return /\bcall me\b|\bcall\b.*\b(me|please)\b|phone me|ring me/i.test(text.toLowerCase());
}
