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

// Several categories per tutor and per parent request (operator decision,
// 2026-10-19). `subjectGroups` holds them all; the old single `subjectGroup`
// column stays as the first ("main") one for reports and older code paths.

/** A row's categories — `subjectGroups`, or the single `subjectGroup` for rows saved before 2026-10-19. */
export function groupsOf(row: { subjectGroup: string; subjectGroups?: string[] | null }): string[] {
  return row.subjectGroups && row.subjectGroups.length > 0 ? row.subjectGroups : [row.subjectGroup];
}

/** Valid, de-duplicated categories in the fixed order; unknown values dropped. */
export function normalizeGroups(values: unknown): SubjectGroup[] {
  const list = Array.isArray(values) ? values : values == null ? [] : [values];
  const wanted = new Set(list.map((v) => String(v).trim()));
  return SUBJECT_GROUPS.filter((g) => wanted.has(g));
}

/** "School (Primary–Matric), Pre-Medical" */
export function groupLabels(groups: string[]): string {
  return groups.map((g) => SUBJECT_GROUP_LABELS[g as SubjectGroup] ?? g).join(", ");
}

/** The two stored columns from input carrying either `subjectGroups` (all
 * picks) or a single `subjectGroup`; null when neither has a valid category. */
export function categoryFields(input: {
  subjectGroup?: unknown;
  subjectGroups?: unknown;
}): { subjectGroup: SubjectGroup; subjectGroups: SubjectGroup[] } | null {
  const fromList = normalizeGroups(input.subjectGroups);
  const groups = fromList.length ? fromList : normalizeGroups(input.subjectGroup);
  return groups.length ? { subjectGroup: groups[0], subjectGroups: groups } : null;
}
