// Tutor gender and a parent's tutor-gender preference (2026-10-15 — the site
// promises "male & female tutors"). Matching rule: lib/matching/engine.ts.

export type Gender = "female" | "male";
export type GenderPreference = Gender | "any";

export function normalizeGender(v: unknown): Gender | null {
  return v === "female" || v === "male" ? v : null;
}

export function normalizeGenderPreference(v: unknown): GenderPreference {
  return normalizeGender(v) ?? "any";
}
