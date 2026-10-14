// Lili chat questions for /become-a-tutor, in order (wording approved by the
// operator 2026-10-14, reusing CLAUDE.md Section 13's tutor follow-up
// questions where they overlap), and the multipart body POST
// /api/public/tutor-apply expects — the same fields the old form sent, plus
// latitude/longitude.

import { SUBJECT_GROUPS, SUBJECT_GROUP_LABELS } from "@/lib/subjectGroups";
import {
  AVAILABILITY_OPTIONS,
  collectGrades,
  parseAmount,
  validateAmount,
  validatePhone,
  type Answers,
  type LocationAnswer,
  type StepDef,
} from "../liliChatFlow";

function firstName(answers: Answers): string {
  return String(answers.name ?? "").trim().split(/\s+/)[0] ?? "";
}

export const TUTOR_STEPS: StepDef[] = [
  {
    kind: "text",
    id: "name",
    prompt: "Hi! I'm Lili 🦊 What's your full name?",
    placeholder: "e.g. Ayesha Khan",
  },
  {
    kind: "text",
    id: "whatsappId",
    prompt: (a) => `Nice to meet you, ${firstName(a)}! Which WhatsApp number should we reach you on?`,
    placeholder: "0300 1234567",
    inputMode: "tel",
    validate: validatePhone,
  },
  {
    kind: "location",
    id: "location",
    prompt:
      "Where are you based? Share your location so we match you with students close by — you'll save on travel time and fuel.",
  },
  {
    kind: "text",
    id: "subjects",
    prompt: "Which subject(s) do you teach?",
    placeholder: "e.g. Chemistry, Biology",
  },
  {
    kind: "chips",
    id: "subjectGroup",
    prompt: "Which category best fits?",
    options: SUBJECT_GROUPS.map((g) => ({ value: g, label: SUBJECT_GROUP_LABELS[g] })),
  },
  {
    kind: "text",
    id: "curriculum",
    prompt: "Which curriculum/level — O/A-levels, FSc/Intermediate, a specific degree program, or something else?",
    placeholder: "e.g. Cambridge A-levels",
  },
  {
    kind: "text",
    id: "qualification",
    prompt: "What's your academic background/qualification?",
    placeholder: "e.g. MBBS (3rd year), A-levels",
  },
  {
    kind: "grades",
    id: "grades",
    subjectsFrom: "subjects",
    prompt: (subject) => `What grade did you get in ${subject}?`,
    placeholder: "e.g. A, A-, 85%",
  },
  {
    kind: "multiChips",
    id: "availability",
    prompt: "When are you generally available to teach?",
    options: AVAILABILITY_OPTIONS,
  },
  {
    kind: "text",
    id: "expectedFee",
    prompt: "Expected monthly fee in PKR? (optional)",
    placeholder: "e.g. 20000",
    inputMode: "numeric",
    optional: true,
    validate: validateAmount,
  },
  {
    kind: "files",
    id: "cnic",
    prompt:
      "Almost done! To verify your profile, please send a photo of your CNIC. (Recommended — we need it to activate your profile.)",
  },
  {
    kind: "files",
    id: "marksheets",
    prompt: "And your latest marksheet/transcript, if you have it handy? This helps us confirm the grades you shared.",
    multiple: true,
  },
];

export function buildTutorFormData(answers: Answers): FormData {
  const location = answers.location as LocationAnswer | undefined;
  const body = new FormData();
  body.append("whatsappId", String(answers.whatsappId ?? "").trim());
  body.append("name", String(answers.name ?? "").trim());
  body.append("area", location?.area ?? "");
  if (location?.latitude != null && location.longitude != null) {
    body.append("latitude", String(location.latitude));
    body.append("longitude", String(location.longitude));
  }
  body.append("subjects", String(answers.subjects ?? ""));
  body.append("subjectGroup", String(answers.subjectGroup ?? "other"));
  body.append("curriculum", String(answers.curriculum ?? "").trim());
  body.append("qualification", String(answers.qualification ?? "").trim());
  body.append("gradesBySubject", JSON.stringify(collectGrades(answers, "grades")));
  for (const tag of (answers.availability as string[] | null) ?? []) body.append("availability", tag);
  const fee = parseAmount(answers.expectedFee);
  if (fee != null) body.append("expectedFee", String(fee));
  const cnic = (answers.cnic as File[] | null) ?? [];
  if (cnic[0]) body.append("cnic", cnic[0]);
  for (const file of (answers.marksheets as File[] | null) ?? []) body.append("marksheets", file);
  return body;
}
