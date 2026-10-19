// Lili form questions for /become-a-tutor, in order (wording approved by the
// operator 2026-10-14, reusing CLAUDE.md Section 13's tutor follow-up
// questions where they overlap), and the multipart body POST
// /api/public/tutor-apply expects — the same fields the old form sent, plus
// latitude/longitude.

import { SUBJECT_GROUPS, SUBJECT_GROUP_LABELS } from "@/lib/subjectGroups";
import { describeIssues } from "@/lib/imageQuality";
import { photoReport } from "../photoQuality";
import {
  AVAILABILITY_OPTIONS,
  collectGrades,
  parseAmount,
  splitSubjects,
  validateAmount,
  validatePhone,
  type Answers,
  type LocationAnswer,
  type StepDef,
  selectedGroups,
} from "../liliFormFlow";

function firstName(answers: Answers): string {
  return String(answers.name ?? "").trim().split(/\s+/)[0] ?? "";
}

export const TUTOR_STEPS: StepDef[] = [
  {
    kind: "text",
    id: "name",
    label: "Full name",
    prompt: "Hi! I'm Lili 🦊 What's your full name?",
    placeholder: "e.g. Ayesha Khan",
  },
  {
    kind: "text",
    id: "whatsappId",
    label: "WhatsApp number",
    prompt: (a) => `Nice to meet you, ${firstName(a)}! Which WhatsApp number should we reach you on?`,
    placeholder: "0300 1234567",
    inputMode: "tel",
    validate: validatePhone,
  },
  {
    // Parents can ask for a female or male tutor (2026-10-15).
    kind: "chips",
    id: "gender",
    label: "Gender",
    prompt: "Are you a female or male tutor? Some families have a preference.",
    options: [
      { value: "female", label: "Female" },
      { value: "male", label: "Male" },
    ],
  },
  {
    kind: "location",
    id: "location",
    label: "Area",
    prompt:
      "Where are you based? Share your location so we match you with students close by — you'll save on travel time and fuel.",
  },
  {
    // Numbered list, one subject per row (2026-10-19).
    kind: "list",
    id: "subjects",
    label: "Subjects you teach",
    prompt: "Which subject(s) do you teach? Add them one by one.",
    placeholder: "e.g. Chemistry",
    addLabel: "Add another subject",
  },
  {
    // Several categories allowed (2026-10-19).
    kind: "multiChips",
    id: "subjectGroup",
    label: "Categories",
    prompt: "Which categories do you teach? Pick all that apply.",
    options: SUBJECT_GROUPS.map((g) => ({ value: g, label: SUBJECT_GROUP_LABELS[g] })),
  },
  {
    kind: "text",
    id: "curriculum",
    label: "Curriculum / level",
    prompt: "Which curriculum/level — O/A-levels, FSc/Intermediate, a specific degree program, or something else?",
    placeholder: "e.g. Cambridge A-levels",
  },
  {
    kind: "text",
    id: "qualification",
    label: "Qualification",
    prompt: "What's your academic background/qualification?",
    placeholder: "e.g. MBBS (3rd year), A-levels",
  },
  {
    // Required (2026-10-17).
    kind: "text",
    id: "schoolName",
    label: "School / college",
    prompt: "Which school or college did you study at?",
    placeholder: "e.g. Karachi Grammar School, DJ Science College",
  },
  {
    kind: "grades",
    id: "grades",
    subjectsFrom: "subjects",
    label: (subject) => `${subject} grade`,
    prompt: (subject) => `What grade did you get in ${subject}?`,
    placeholder: "e.g. A, A-, 85%",
  },
  {
    kind: "multiChips",
    id: "availability",
    label: "Availability",
    prompt: "When are you generally available to teach?",
    options: AVAILABILITY_OPTIONS,
  },
  {
    kind: "text",
    id: "expectedFee",
    label: "Expected fee (PKR/month)",
    prompt: "Expected monthly fee in PKR? (optional)",
    placeholder: "e.g. 20000",
    inputMode: "numeric",
    optional: true,
    validate: validateAmount,
  },
  {
    kind: "files",
    id: "cnic",
    label: "CNIC photo",
    prompt:
      "Almost done! To verify your profile, please send a photo of your CNIC. (Recommended — we need it to activate your profile.)",
    qualityCheck: true,
  },
  {
    kind: "files",
    id: "marksheets",
    label: "Marksheet / transcript",
    prompt: "And your latest marksheet/transcript, if you have it handy? This helps us confirm the grades you shared.",
    multiple: true,
    qualityCheck: true,
  },
];

export function buildTutorFormData(answers: Answers): FormData {
  const location = answers.location as LocationAnswer | undefined;
  const body = new FormData();
  body.append("whatsappId", String(answers.whatsappId ?? "").trim());
  body.append("name", String(answers.name ?? "").trim());
  if (answers.gender === "female" || answers.gender === "male") body.append("gender", answers.gender);
  body.append("area", location?.area ?? "");
  if (location?.latitude != null && location.longitude != null) {
    body.append("latitude", String(location.latitude));
    body.append("longitude", String(location.longitude));
  }
  body.append("subjects", String(answers.subjects ?? ""));
  for (const group of selectedGroups(answers.subjectGroup)) body.append("subjectGroup", group);
  body.append("curriculum", String(answers.curriculum ?? "").trim());
  body.append("qualification", String(answers.qualification ?? "").trim());
  body.append("schoolName", String(answers.schoolName ?? "").trim());
  body.append("gradesBySubject", JSON.stringify(collectGrades(answers, "grades", splitSubjects(answers.subjects))));
  for (const tag of (answers.availability as string[] | null) ?? []) body.append("availability", tag);
  const fee = parseAmount(answers.expectedFee);
  if (fee != null) body.append("expectedFee", String(fee));
  const cnic = (answers.cnic as File[] | null) ?? [];
  if (cnic[0]) body.append("cnic", cnic[0]);
  for (const file of (answers.marksheets as File[] | null) ?? []) body.append("marksheets", file);
  // Photos the on-device check flagged but the tutor used anyway (2026-10-19) —
  // shown to the operator as a note on the tutor.
  const flagged = [
    ...cnic.slice(0, 1).map((f) => ["CNIC photo", f] as const),
    ...((answers.marksheets as File[] | null) ?? []).map((f, i, all) => [all.length > 1 ? `marksheet photo ${i + 1}` : "marksheet photo", f] as const),
  ]
    .map(([what, f]) => ({ what, issues: photoReport(f)?.issues ?? [] }))
    .filter((p) => p.issues.length > 0)
    .map((p) => `${p.what} ${describeIssues(p.issues)}`);
  if (flagged.length) body.append("photoQualityNote", flagged.join("; "));
  return body;
}
