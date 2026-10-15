// Outbound WhatsApp copy.
//
// Strings marked [§13] are the operator-approved verbatim templates from CLAUDE.md
// Section 13 — do not reword them without operator sign-off.
//
// Strings marked [GAP] are touchpoints Section 13 does not yet cover. They are
// flagged for operator wording sign-off (Section 2 reserves user-facing copy).
// Placeholder wording is kept deliberately plain and on-brand (Section 11) until
// then.

export const AVAILABILITY_TAGS = [
  "weekday_morning",
  "weekday_afternoon",
  "weekday_evening",
  "weekend_morning",
  "weekend_afternoon",
  "weekend_evening",
] as const;
export type AvailabilityTag = (typeof AVAILABILITY_TAGS)[number];

// --- [§13] Tutor follow-up questions: asked one at a time, first missing field
// only, in this priority order. expectedFee/email/phone are intentionally never
// force-asked (only collected if volunteered). ---
export const TUTOR_FOLLOWUP_ORDER = [
  "name",
  "area",
  "subjects",
  "subjectGroup",
  "curriculum",
  "qualification",
  "gradesBySubject",
  "availability",
] as const;

export const TUTOR_FOLLOWUP_QUESTIONS: Record<
  (typeof TUTOR_FOLLOWUP_ORDER)[number],
  string
> = {
  name: "Could you share your full name, please?",
  area: "Which area are you based in, or what's a nearby landmark?",
  subjects: "Which subject(s) do you teach?",
  subjectGroup:
    "Which category best fits — school (primary–Matric), pre-medical, pre-engineering, computer science, skills/vocational, or university-level?",
  curriculum:
    "Which curriculum/level — O/A-levels, FSc/Intermediate, a specific degree program, or something else?",
  qualification: "What's your academic background/qualification?",
  gradesBySubject:
    "What grades did you get in the subjects you teach? (e.g. Biology: A, Chemistry: A-)",
  availability:
    "When are you generally available to teach — weekday mornings, afternoons, evenings, or weekends?",
};

// --- [§13] Tutor — CNIC and marksheet request (sent once text fields are
// complete — 6.1 step 10). ---
export const TUTOR_DOCS_REQUEST =
  "Almost done! To verify your profile, please send a photo of your CNIC and your latest " +
  "marksheet/transcript. This helps us confirm the grades you shared.";

// --- [GAP] Tutor document capture follow-ups (6.1 step 10). Not in §13 —
// the spec only gives the initial request above. CNIC is required before
// activation (operator decision); marksheet stays optional. ---
export const TUTOR_DOC_RECEIVED_ACK =
  "Got it! Send another document if you have one, or reply \"done\" once you're finished.";

export const TUTOR_CNIC_REQUIRED =
  "We still need a photo of your CNIC before we can activate your profile — please send it " +
  "whenever you're ready.";

export const TUTOR_DOC_UPLOAD_FAILED =
  "Sorry, we couldn't process that file — please try sending it again.";

// --- [§13] Parent: continue-on-WhatsApp vs. call prompt ---
export const PARENT_CONTINUE_OR_CALL =
  "Thanks for sharing! I just need a couple more details to find the right match for you. " +
  "You're welcome to continue here on WhatsApp, or if you'd prefer, I can have our team call " +
  "you directly — just reply 'call me' anytime.";

// --- [§13] Demo slot offer (Phase 3, kept here for one source of truth) ---
export function demoSlotOffer(tutorName: string, slots: string[]): string {
  const numbered = slots.map((s, i) => `${i + 1}) ${s}`).join("  ");
  return (
    `Great choice! Here are a few times for your demo with ${tutorName}: ${numbered} ` +
    `— just reply with a number and we'll lock it in.`
  );
}

// --- [§13] Tutor opportunity notification — premium tutors only, sent
// immediately on match approval (6.5). Free tutors never get this via WhatsApp. ---
export function tutorOpportunityNotification(subject: string, curriculum: string, area: string): string {
  return (
    `A student near you is looking for a ${subject} tutor (${curriculum}, ${area}). Are you ` +
    `available and interested? Reply YES to confirm, or NO if this doesn't work for you right now.`
  );
}

// --- [GAP] First contact: which side is this person on? ---
// Not in §13. Needed because 6.2 requires senderType before extraction and a cold
// inbound with no Meta referral payload gives no signal. Classifying this with the
// LLM would violate Section 3.1 (LLM does language only), so we ask directly.
export const ASK_SENDER_TYPE =
  "Hi! Are you a tutor looking for students, or a parent looking for a tutor? " +
  "Reply \"tutor\" or \"parent\" and we'll take it from there.";

export const SENDER_TYPE_UNCLEAR =
  "Sorry, I didn't catch that — are you a *tutor* or a *parent*? Please reply with one of those.";

// --- [GAP] Prompt sent once sender type is known, asking for their details in
// one message (this reply becomes the "one raw message" the extractor works on). ---
export const TUTOR_INTAKE_PROMPT =
  "Great! In one message, tell us about your tutoring: your full name, the area (or a nearby " +
  "landmark) you're based in, the subject(s) you teach, the category (school/Matric, " +
  "pre-medical, pre-engineering, computer science, skills, or university-level), the curriculum/level " +
  "(O/A-levels, FSc/Intermediate, a degree program, etc.), your qualification, and when you're " +
  "generally free to teach.";

export const PARENT_INTAKE_PROMPT =
  "Great! In one message, tell us what you're looking for: the subject(s) and level/curriculum, " +
  "the area (or a nearby landmark) you're in, whether you'd prefer in-person or online, and " +
  "your monthly budget if you have one in mind.";

// --- [GAP] Tutor: profile complete / activated ---
export const TUTOR_ACTIVATED =
  "You're all set — your tutor profile is complete. We'll match you with students close to " +
  "you so you save on travel time and fuel, and reach out as soon as there's a fit.";

// --- [GAP] Parent: request received, matching under way ---
export const PARENT_REQUEST_RECEIVED =
  "Got it — thank you. We'll match you only with a vetted tutor from your own area and get " +
  "back to you shortly with a short list of options.";

// --- [GAP] Parent: acknowledged a "call me" request ---
export const PARENT_CALL_REQUESTED =
  "No problem — our team will call you directly to finish setting things up. Talk soon!";

// --- [GAP] Generic fallback when a message can't be understood in context ---
export const GENERIC_FALLBACK =
  "Thanks for your message! One of our team will follow up with you shortly.";

// --- [GAP] Rating request (6.8) — kept here as the one source of truth, used
// both by the automatic WhatsApp send (lib/ratings/actions.ts, when live API
// credentials are configured) and the manual "copy to send" fallback on
// /payments (2026-10 chat-export pivot — see lib/ratings/actions.ts#findDueRatingRequests). ---
export function ratingRequestMessage(tutorName: string): string {
  return `How was your experience with ${tutorName}? Please rate 1-5 stars (just reply with a number), and add a comment if you'd like.`;
}
