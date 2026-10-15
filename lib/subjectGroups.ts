// Fixed subjectGroup set (CLAUDE.md 6.1 step 8, 6.2, 6.3 Step 1). Used identically
// for Tutor and ParentRequest — this is the matching engine's hard-filter
// categorical field, distinct from the free-text `curriculum` field.

export const SUBJECT_GROUPS = [
  "school", // Primary–Matric (2026-10-15 — no level is declined any more)
  "pre_medical",
  "pre_engineering",
  "computer",
  "skills",
  "university_level",
  "other",
] as const;

export type SubjectGroup = (typeof SUBJECT_GROUPS)[number];

export const SUBJECT_GROUP_LABELS: Record<SubjectGroup, string> = {
  school: "School (Primary–Matric)",
  pre_medical: "Pre-Medical",
  pre_engineering: "Pre-Engineering",
  computer: "Computer Science",
  skills: "Skills / Vocational",
  university_level: "University-level",
  other: "Other",
};
