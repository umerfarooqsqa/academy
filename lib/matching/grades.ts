// Grade -> score band mapping (CLAUDE.md 6.3 Step 4, subjectGradeStrength).
// Pure lookup table, no I/O.

const GRADE_BAND: Record<string, number> = {
  "A+": 1.0,
  A: 1.0,
  "A-": 0.9,
  "B+": 0.8,
  B: 0.7,
  "B-": 0.6,
};

// Neutral default for a missing grade entry (general rule, 6.3 Step 4).
export const NEUTRAL_GRADE_SCORE = 0.5;

/**
 * Maps one self-reported grade to its scoring band. Letter grades use the fixed
 * table above (anything C+ or below, or unrecognised, scores 0.5 — same as
 * "missing", since a weak/unclear self-report isn't strong evidence either way).
 * A percentage grade (e.g. "92%", "92") maps as min(1, percentage/100), rounded
 * to the nearest band above per the spec.
 */
export function gradeToScore(grade: string | null | undefined): number {
  if (!grade || !grade.trim()) return NEUTRAL_GRADE_SCORE;
  const g = grade.trim().toUpperCase();

  const percentMatch = g.match(/^(\d{1,3})\s*%?$/);
  if (percentMatch) {
    const pct = Math.min(100, Number(percentMatch[1]));
    const raw = Math.min(1, pct / 100);
    // Round to the nearest band *above* (ceiling to the next defined band).
    const bands = [0.6, 0.7, 0.8, 0.9, 1.0];
    const band = bands.find((b) => raw <= b);
    return band ?? NEUTRAL_GRADE_SCORE;
  }

  return GRADE_BAND[g] ?? NEUTRAL_GRADE_SCORE; // "C+ and below" -> 0.5, per spec
}

/**
 * subjectGradeStrength: average of per-subject scores over ONLY the subjects that
 * overlap between the tutor and the parent request (the same overlap that
 * satisfied the Step 1 hard filter) — not the tutor's full subject list.
 */
export function subjectGradeStrength(
  overlappingSubjects: string[],
  gradesBySubject: Record<string, string> | null | undefined,
): number {
  if (overlappingSubjects.length === 0) return NEUTRAL_GRADE_SCORE;
  const grades = gradesBySubject ?? {};
  const scores = overlappingSubjects.map((subject) => {
    const key = Object.keys(grades).find((k) => k.toLowerCase() === subject.toLowerCase());
    return gradeToScore(key ? grades[key] : undefined);
  });
  return scores.reduce((sum, s) => sum + s, 0) / scores.length;
}
