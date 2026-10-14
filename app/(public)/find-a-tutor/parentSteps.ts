// Lili chat questions for /find-a-tutor, in order (wording approved by the
// operator 2026-10-14), and the JSON body POST /api/public/parent-request
// expects — the same shape the old form sent, plus latitude/longitude.

import { SUBJECT_GROUPS, SUBJECT_GROUP_LABELS } from "@/lib/subjectGroups";
import {
  AVAILABILITY_OPTIONS,
  parseAmount,
  splitSubjects,
  validateAmount,
  validatePhone,
  type Answers,
  type LocationAnswer,
  type StepDef,
} from "../liliChatFlow";

export const PARENT_STEPS: StepDef[] = [
  {
    kind: "text",
    id: "subjects",
    prompt: "Hi! I'm Lili 🦊 Which subject(s) do you need help with?",
    placeholder: "e.g. Chemistry, Biology",
  },
  {
    kind: "chips",
    id: "subjectGroup",
    prompt: "Which category fits best?",
    options: SUBJECT_GROUPS.map((g) => ({ value: g, label: SUBJECT_GROUP_LABELS[g] })),
  },
  {
    kind: "text",
    id: "curriculum",
    prompt: "Which curriculum or level? e.g. O/A-levels, FSc, BS CS",
    placeholder: "e.g. Cambridge A-levels",
  },
  {
    kind: "chips",
    id: "deliveryMode",
    prompt: "Home tuition, online, or either?",
    options: [
      { value: "in_person", label: "Home tuition" },
      { value: "online", label: "Online" },
      { value: "both", label: "Either works" },
    ],
  },
  {
    kind: "location",
    id: "location",
    prompt: "Where should the tutor come to? Tap below and I'll find your area.",
  },
  {
    kind: "multiChips",
    id: "availability",
    prompt: "When suits the student?",
    options: AVAILABILITY_OPTIONS,
    optional: true,
  },
  {
    kind: "text",
    id: "budget",
    prompt: "Monthly budget in PKR? (optional)",
    placeholder: "e.g. 15000",
    inputMode: "numeric",
    optional: true,
    validate: validateAmount,
  },
  {
    kind: "text",
    id: "studentInfo",
    prompt: "Anything about the student we should know? (optional)",
    placeholder: "e.g. Grade 11, needs help before mocks",
    multiline: true,
    optional: true,
  },
  {
    kind: "text",
    id: "whatsappId",
    prompt: "Last thing: your WhatsApp number, so we can send your matches.",
    placeholder: "0300 1234567",
    inputMode: "tel",
    validate: validatePhone,
  },
];

export function buildParentPayload(answers: Answers) {
  const location = answers.location as LocationAnswer | undefined;
  return {
    whatsappId: String(answers.whatsappId ?? "").trim(),
    subjects: splitSubjects(answers.subjects),
    subjectGroup: answers.subjectGroup ?? "other",
    curriculum: String(answers.curriculum ?? "").trim(),
    deliveryMode: answers.deliveryMode ?? "in_person",
    area: location?.area ?? "",
    latitude: location?.latitude ?? null,
    longitude: location?.longitude ?? null,
    availability: (answers.availability as string[] | null) ?? [],
    budget: parseAmount(answers.budget),
    studentInfo: typeof answers.studentInfo === "string" ? answers.studentInfo.trim() : null,
  };
}
