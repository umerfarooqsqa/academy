// Deterministic matching engine (CLAUDE.md 6.3). Zero LLM calls, zero external
// API calls — pure functions over plain data so this is fully unit-testable
// against fixtures, independent of the database.
//
// Callers (e.g. lib/matching/run.ts) fetch the candidate rows from Prisma and
// pass plain objects in; this module never touches Prisma itself.

import { WEIGHTS, renormalize, NEUTRAL_RATING, NEUTRAL_SCORE, TOP_N_CANDIDATES, type WeightKey } from "@/lib/matching/weights";
import { subjectGradeStrength } from "@/lib/matching/grades";

export interface AreaZoneInput {
  name: string;
  latitude: number;
  longitude: number;
  maxKm: number;
}

export interface TutorCandidate {
  id: string;
  subjects: string[];
  subjectGroup: string;
  area: string;
  deliveryMode: string; // "in_person" | "online" | "both"
  availability: string[];
  expectedFee: number | null;
  rating: number;
  ratingCount: number;
  gradesBySubject: Record<string, string> | null;
  status: string; // must be "active" to be eligible — callers should already filter, checked defensively here
  tier: string; // "free" | "premium"
  radiusOverrideKm: number | null;
  gender?: string | null; // "female" | "male" | null (not recorded) — 2026-10-15
}

export interface ParentRequestInput {
  id: string;
  subjects: string[];
  subjectGroup: string;
  area: string;
  deliveryMode: string; // "in_person" | "online" | "both"
  budget: number | null;
  availability: string[];
  tutorGenderPreference?: string; // "any" | "female" | "male" — 2026-10-15
}

export interface MatchCandidate {
  tutorId: string;
  score: number;
  breakdown: {
    budgetFit: number;
    rating: number; // 0-1 (rating/5)
    proximity: number; // 0-1
    availabilityOverlap: number;
    gradeStrength: number;
    distanceKm: number | null; // null when deliveryMode = online (skipped) or same-zone (0)
    overlappingSubjects: string[];
  };
  internalNote: string | null;
}

export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function subjectOverlap(a: string[], b: string[]): string[] {
  const bLower = new Set(b.map((s) => s.toLowerCase().trim()));
  const seen = new Set<string>();
  return a.filter((s) => {
    const key = s.toLowerCase().trim();
    if (!bLower.has(key) || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function budgetFit(expectedFee: number | null, budget: number | null): number {
  if (expectedFee == null) return NEUTRAL_SCORE; // tutor hasn't stated a fee (general rule)
  if (budget == null) return NEUTRAL_SCORE; // handled by renormalization at the caller; safe default
  if (expectedFee <= budget) return 1.0;
  const decay = 1 - (expectedFee - budget) / (0.5 * budget);
  return Math.max(0, decay);
}

function availabilityOverlap(tutorAvail: string[], parentAvail: string[]): number {
  if (parentAvail.length === 0) return NEUTRAL_SCORE; // general rule
  const tutorSet = new Set(tutorAvail);
  const overlap = parentAvail.filter((a) => tutorSet.has(a)).length;
  return overlap / parentAvail.length;
}

/**
 * Step 1 — Hard filters. Returns true iff the tutor survives (subject overlap +
 * exact subjectGroup match). Area is filtered separately in Step 2 because it's
 * tiered, not a flat pass/fail.
 */
function passesHardFilters(tutor: TutorCandidate, parent: ParentRequestInput): boolean {
  if (tutor.status !== "active") return false;
  if (tutor.subjectGroup !== parent.subjectGroup) return false;
  if (!passesGenderPreference(tutor, parent)) return false;
  return subjectOverlap(tutor.subjects, parent.subjects).length > 0;
}

/** The parent's tutor-gender preference, if they stated one ("female"/"male"). */
function genderPreference(parent: ParentRequestInput): "female" | "male" | null {
  const p = parent.tutorGenderPreference;
  return p === "female" || p === "male" ? p : null;
}

/**
 * Gender preference (2026-10-15 operator decision — "strict, unknowns
 * allowed"): a tutor whose recorded gender differs from the parent's stated
 * preference is never proposed; a tutor with no gender recorded still passes,
 * with a note for the operator to check (genderNote).
 */
function passesGenderPreference(tutor: TutorCandidate, parent: ParentRequestInput): boolean {
  const pref = genderPreference(parent);
  return !pref || !tutor.gender || tutor.gender === pref;
}

function genderNote(tutor: TutorCandidate, parent: ParentRequestInput): string | null {
  const pref = genderPreference(parent);
  return pref && !tutor.gender ? `tutor gender not recorded — parent asked for ${pref}` : null;
}

/**
 * The same hard rules (Step 1 + Step 2's area rule) for ONE tutor a parent
 * asked for by name via "Request this tutor" on a featured profile
 * (2026-10-15). Area passes when the request is online, the zones are the
 * same, or the tutor's zone is within the radius Tier B would allow — the
 * area rule is never bypassed just because the parent picked the tutor.
 */
export function checkRequestedTutor(
  tutor: TutorCandidate,
  parent: ParentRequestInput,
  zones: AreaZoneInput[],
): { eligible: true; note: string | null } | { eligible: false; reason: string } {
  if (tutor.status !== "active") return { eligible: false, reason: "tutor not active" };
  if (tutor.subjectGroup !== parent.subjectGroup) return { eligible: false, reason: "different category" };
  if (subjectOverlap(tutor.subjects, parent.subjects).length === 0) return { eligible: false, reason: "no shared subject" };
  if (!passesGenderPreference(tutor, parent)) return { eligible: false, reason: "gender preference" };
  if (parent.deliveryMode !== "online" && tieredAreaFilter([tutor], parent, zones).candidates.length === 0) {
    return { eligible: false, reason: "outside the parent's area" };
  }
  return { eligible: true, note: genderNote(tutor, parent) };
}

/**
 * Step 2 — Tiered area matching. Skipped entirely when deliveryMode is "online".
 * Tier A (exact zone match) wins outright if non-empty; Tier B (Haversine radius)
 * only runs when Tier A is empty.
 */
function tieredAreaFilter(
  tutors: TutorCandidate[],
  parent: ParentRequestInput,
  zones: AreaZoneInput[],
): { candidates: TutorCandidate[]; distanceKm: Map<string, number | null> } {
  const distanceKm = new Map<string, number | null>();

  if (parent.deliveryMode === "online") {
    for (const t of tutors) distanceKm.set(t.id, null);
    return { candidates: tutors, distanceKm };
  }

  const tierA = tutors.filter((t) => t.area === parent.area);
  if (tierA.length > 0) {
    for (const t of tierA) distanceKm.set(t.id, 0); // same zone
    return { candidates: tierA, distanceKm };
  }

  const parentZone = zones.find((z) => z.name === parent.area);
  if (!parentZone) return { candidates: [], distanceKm };

  const tierB = tutors.filter((t) => {
    const tutorZone = zones.find((z) => z.name === t.area);
    if (!tutorZone) return false;
    const d = haversineKm(parentZone.latitude, parentZone.longitude, tutorZone.latitude, tutorZone.longitude);
    const maxKm = t.tier === "premium" && t.radiusOverrideKm != null ? t.radiusOverrideKm : parentZone.maxKm;
    const withinRadius = d <= maxKm;
    if (withinRadius) distanceKm.set(t.id, d);
    return withinRadius;
  });

  return { candidates: tierB, distanceKm };
}

/**
 * Runs the full 6.3 pipeline for one ParentRequest against a pool of tutors that
 * are already `status: active` and (should be) filtered to the same area zone
 * catalogue. Returns the top TOP_N_CANDIDATES scored candidates (Step 5).
 */
export function runMatchingEngine(
  parent: ParentRequestInput,
  tutors: TutorCandidate[],
  zones: AreaZoneInput[],
): MatchCandidate[] {
  // Step 1 — hard filters.
  const hardFiltered = tutors.filter((t) => passesHardFilters(t, parent));

  // Step 2 — tiered area matching (skipped for online delivery).
  const { candidates, distanceKm } = tieredAreaFilter(hardFiltered, parent, zones);

  // Step 3/4 — budget handling + scoring.
  const budgetNoteNeeded = parent.budget == null;
  const activeKeys: WeightKey[] = ["rating", "availability", "gradeStrength"];
  if (!budgetNoteNeeded) activeKeys.push("budgetFit");
  if (parent.deliveryMode !== "online") activeKeys.push("proximity");
  const weights = renormalize(activeKeys);

  const scored: MatchCandidate[] = candidates.map((t) => {
    const overlap = subjectOverlap(t.subjects, parent.subjects);
    const ratingScore = (t.ratingCount === 0 ? NEUTRAL_RATING : t.rating) / 5;
    const d = distanceKm.get(t.id) ?? null;
    const proximityScore = d == null ? NEUTRAL_SCORE : 1 / (1 + d);
    // When budget is unset, the term is excluded from scoring (weight renormalized
    // to 0 above) — display the neutral default rather than an implied-0 mismatch.
    const bFit = budgetNoteNeeded ? NEUTRAL_SCORE : budgetFit(t.expectedFee, parent.budget);
    const availScore = availabilityOverlap(t.availability, parent.availability);
    const gradeScore = subjectGradeStrength(overlap, t.gradesBySubject);

    const score =
      weights.budgetFit * bFit +
      weights.rating * ratingScore +
      weights.proximity * proximityScore +
      weights.availability * availScore +
      weights.gradeStrength * gradeScore;

    return {
      tutorId: t.id,
      score,
      breakdown: {
        budgetFit: bFit,
        rating: ratingScore,
        proximity: proximityScore,
        availabilityOverlap: availScore,
        gradeStrength: gradeScore,
        distanceKm: d,
        overlappingSubjects: overlap,
      },
      internalNote:
        [budgetNoteNeeded ? "budget not provided — confirm with parent" : null, genderNote(t, parent)]
          .filter(Boolean)
          .join("; ") || null,
    };
  });

  // Step 5 — top N by score.
  return scored.sort((a, b) => b.score - a.score).slice(0, TOP_N_CANDIDATES);
}
