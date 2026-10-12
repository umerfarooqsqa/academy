// Curriculum scope check (CLAUDE.md 6.1 step 7). Pure code, no LLM — a false
// decline on a real premium lead is worse than one extra manual check.
//
// 2026-09-15: rewritten for the expanded scope (Section 1). O/A-levels, FSc/
// Intermediate (pre-medical, pre-engineering), Computer Science, Skills, and
// University-level are ALL in scope now. Only Matric/SSC (grade 9-10) declines —
// FSc/Intermediate previously declined here, which was correct under the old
// O/A-levels-only scope but is now a bug: FSc is the same academic tier as
// A-levels and must be accepted.

export type CurriculumVerdict = "accept" | "decline" | "ambiguous";

// Exactly the lists from CLAUDE.md 6.1 step 7 — do not extend without operator
// sign-off. Matched case-insensitively; hyphen/space variants of the same keyword
// are equivalent.

// A higher-tier signal anywhere in the message overrides a decline keyword —
// "she's moving from matric to A-levels" must not decline.
const HIGHER_TIER_KEYWORDS = [
  "a-level",
  "a level",
  "as-level",
  "as level",
  "o-level",
  "o level",
  "cambridge",
  "caie",
  "edexcel",
  "british",
  "igcse",
  "fsc",
  "f.sc",
  "intermediate",
  "pre-medical",
  "pre medical",
  "pre-engineering",
  "pre engineering",
  "computer science",
  "university",
  "bachelor",
  "bs ",
  "degree",
];

// Matric/SSC (grade 9-10 board curriculum) — the specific low-budget segment
// identified as unprofitable (Section 1). Triggers decline ONLY when no
// higher-tier signal is also present in the same message.
const DECLINE_KEYWORDS = ["matric", "ssc", "grade 9", "grade 10", "9th", "10th"];

function norm(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * @param curriculum  the extracted curriculum string (may be null/empty)
 * @param llmUncertain  true if the extraction call itself flagged low confidence
 */
export function classifyCurriculum(
  curriculum: string | null | undefined,
  llmUncertain = false,
): CurriculumVerdict {
  if (!curriculum || !curriculum.trim()) return "ambiguous";
  const c = norm(curriculum);

  const hasHigherTier = HIGHER_TIER_KEYWORDS.some((k) => c.includes(k));
  const hasDecline = DECLINE_KEYWORDS.some((k) => c.includes(k));

  if (hasDecline && !hasHigherTier) return "decline";
  if (hasHigherTier) return "accept";
  if (llmUncertain) return "ambiguous";
  // Unclear (no keyword either way) — never auto-decline (6.1 step 7).
  return "ambiguous";
}

export const CURRICULUM_AMBIGUOUS_NOTE = "curriculum ambiguous — verify";
