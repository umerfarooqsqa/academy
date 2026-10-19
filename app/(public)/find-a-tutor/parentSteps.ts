// Lili form questions for /find-a-tutor, in order (wording approved by the
// operator 2026-10-14), and the JSON body POST /api/public/parent-request
// expects — the same shape the old form sent, plus latitude/longitude.
//
// makeParentSteps takes the per-zone verified-tutor counts so that, right
// after the location answer, Lili can say "Good news — 8 verified
// Pre-Medical tutors near Gulshan-e-Iqbal!" (only when the count is > 0).

import { SUBJECT_GROUPS, SUBJECT_GROUP_LABELS, type SubjectGroup } from "@/lib/subjectGroups";
import { verifiedNear, type ZoneTutorCount } from "@/lib/tutors/nearbyCounts";
import {
  AVAILABILITY_OPTIONS,
  parseAmount,
  splitSubjects,
  validateAmount,
  validatePhone,
  type Answers,
  type LocationAnswer,
  type StepDef,
  selectedGroups,
} from "../liliFormFlow";

/** "Good news — N verified … tutors near X! " for the parent's chosen
 * location and category, or "" when there are none (or no zone to count from). */
export function verifiedTutorsLine(answers: Answers, counts: ZoneTutorCount[]): string {
  const loc = answers.location as LocationAnswer | undefined;
  if (!loc) return "";
  const zone = counts.find((z) => z.name.toLowerCase() === loc.area.toLowerCase());
  const lat = loc.latitude ?? zone?.latitude;
  const lon = loc.longitude ?? zone?.longitude;
  if (lat == null || lon == null) return "";
  const groups = selectedGroups(answers.subjectGroup);
  const { total } = verifiedNear(counts, lat, lon, groups);
  if (total === 0) return "";
  const group = groups.length === 1 ? groups[0] : undefined;
  const label = group && group !== "other" ? `${SUBJECT_GROUP_LABELS[group as SubjectGroup] ?? group} ` : "";
  return `Good news — ${total} verified ${label}tutor${total === 1 ? "" : "s"} near ${zone ? zone.name : loc.area}! `;
}

export const makeParentSteps = (counts: ZoneTutorCount[] = [], opts: { requestedTutorName?: string } = {}): StepDef[] => [
  {
    // Numbered list, one subject per row (2026-10-19).
    kind: "list",
    id: "subjects",
    addLabel: "Add another subject",
    label: "Subjects",
    prompt: opts.requestedTutorName
      ? `Hi! I'm Lili 🦊 You're requesting ${opts.requestedTutorName} — just a few quick questions. Which subject(s) do you need help with?`
      : "Hi! I'm Lili 🦊 Which subject(s) do you need help with?",
    placeholder: "e.g. Chemistry",
  },
  {
    // Several categories allowed (2026-10-19).
    kind: "multiChips",
    id: "subjectGroup",
    label: "Categories",
    prompt: "Which categories fit? Pick all that apply.",
    options: SUBJECT_GROUPS.map((g) => ({ value: g, label: SUBJECT_GROUP_LABELS[g] })),
  },
  {
    kind: "text",
    id: "curriculum",
    label: "Curriculum / level",
    prompt: "Which curriculum or level? e.g. O/A-levels, FSc, BS CS",
    placeholder: "e.g. Cambridge A-levels",
  },
  {
    // Required (2026-10-17); shown with the public tuition listing.
    kind: "text",
    id: "schoolName",
    label: "School",
    prompt: "Which school does the student go to?",
    placeholder: "e.g. The City School, Beaconhouse",
  },
  {
    kind: "chips",
    id: "deliveryMode",
    label: "Tuition type",
    prompt: "Home tuition, online, or either?",
    options: [
      { value: "in_person", label: "Home tuition" },
      { value: "online", label: "Online" },
      { value: "both", label: "Either works" },
    ],
  },
  {
    kind: "chips",
    id: "tutorGenderPreference",
    label: "Tutor preference",
    prompt: "Would you prefer a female or male tutor?",
    options: [
      { value: "any", label: "No preference" },
      { value: "female", label: "Female tutor" },
      { value: "male", label: "Male tutor" },
    ],
  },
  {
    kind: "location",
    id: "location",
    label: "Area",
    prompt: "Where should the tutor come to? Tap below and I'll find your area.",
  },
  {
    kind: "multiChips",
    id: "availability",
    label: "Preferred times",
    prompt: (a) => `${verifiedTutorsLine(a, counts)}When suits the student?`,
    options: AVAILABILITY_OPTIONS,
    optional: true,
  },
  {
    kind: "text",
    id: "budget",
    label: "Monthly budget (PKR)",
    prompt: "Monthly budget in PKR? (optional)",
    placeholder: "e.g. 15000",
    inputMode: "numeric",
    optional: true,
    validate: validateAmount,
  },
  {
    kind: "text",
    id: "studentInfo",
    label: "About the student",
    prompt: "Anything about the student we should know? (optional)",
    placeholder: "e.g. Grade 11, needs help before mocks",
    multiline: true,
    optional: true,
  },
  {
    kind: "text",
    id: "whatsappId",
    label: "WhatsApp number",
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
    subjectGroups: selectedGroups(answers.subjectGroup),
    curriculum: String(answers.curriculum ?? "").trim(),
    deliveryMode: answers.deliveryMode ?? "in_person",
    tutorGenderPreference: answers.tutorGenderPreference ?? "any",
    area: location?.area ?? "",
    latitude: location?.latitude ?? null,
    longitude: location?.longitude ?? null,
    availability: (answers.availability as string[] | null) ?? [],
    budget: parseAmount(answers.budget),
    studentInfo: typeof answers.studentInfo === "string" ? answers.studentInfo.trim() : null,
    schoolName: String(answers.schoolName ?? "").trim(),
  };
}
