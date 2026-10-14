// Pure state logic for the Lili form (app/(public)/LiliForm.tsx) — the
// /find-a-tutor and /become-a-tutor intake where Lili, the fox mascot, asks
// one question at a time and each field appears below the last (2026-10-14).
// No React here so it's unit-testable.
//
// Model: a list of step definitions plus a flat `answers` map keyed by step
// id. The current question is the first step with no answer yet. Editing an
// earlier answer replaces just that answer (later answers are kept); answers
// whose step no longer exists — e.g. a grade for a subject that was removed —
// are dropped. A skipped optional step is answered with null, so it still
// counts as done.

export interface Option {
  value: string;
  label: string;
}

export interface LocationAnswer {
  latitude: number | null;
  longitude: number | null;
  /** An AreaZone.name (nearest in-range zone, picked, or matched from typed
   * text), or the person's own typed area/landmark when no zone matched. */
  area: string;
  /** true when the person shared their location (even if they then had to pick or type an area). */
  viaGps: boolean;
}

export type FormValue = string | string[] | File[] | LocationAnswer | null;
export type Answers = Record<string, FormValue>;

type Prompt = string | ((answers: Answers) => string);

interface StepBase {
  id: string;
  /** Short field label shown above the input and on the answered row. */
  label: string;
  /** What Lili says when this field appears. */
  prompt: Prompt;
}

export type Step =
  | (StepBase & {
      kind: "text";
      placeholder?: string;
      optional?: boolean;
      inputMode?: "text" | "tel" | "numeric";
      multiline?: boolean;
      /** Returns an error message, or null when valid. */
      validate?: (value: string) => string | null;
    })
  | (StepBase & { kind: "chips"; options: Option[] })
  | (StepBase & { kind: "multiChips"; options: Option[]; optional?: boolean })
  | (StepBase & { kind: "location" })
  | (StepBase & { kind: "files"; multiple?: boolean });

/** Expands into one text step per subject listed in `subjectsFrom`'s answer,
 * with ids `${id}:${subject}`. */
export interface GradesStepDef {
  kind: "grades";
  id: string;
  subjectsFrom: string;
  label: (subject: string) => string;
  prompt: (subject: string, answers: Answers) => string;
  placeholder?: string;
}

export type StepDef = Step | GradesStepDef;

/** Comma-separated only — the same split the tutor-apply route does server
 * side, so per-subject grade keys line up with the stored subjects. */
export function splitSubjects(raw: FormValue | undefined): string[] {
  if (typeof raw !== "string") return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(",")) {
    const s = part.trim();
    if (s && !seen.has(s.toLowerCase())) {
      seen.add(s.toLowerCase());
      out.push(s);
    }
  }
  return out;
}

/** The concrete step list for the current answers (grades steps expanded). */
export function resolveSteps(defs: StepDef[], answers: Answers): Step[] {
  return defs.flatMap((def): Step[] =>
    def.kind === "grades"
      ? splitSubjects(answers[def.subjectsFrom]).map((subject) => ({
          kind: "text",
          id: `${def.id}:${subject}`,
          label: def.label(subject),
          prompt: (a: Answers) => def.prompt(subject, a),
          placeholder: def.placeholder,
        }))
      : [def],
  );
}

/** Index of the first unanswered step; steps.length once everything is answered. */
export function currentStepIndex(steps: Step[], answers: Answers): number {
  const i = steps.findIndex((s) => !(s.id in answers));
  return i === -1 ? steps.length : i;
}

/** Sets one answer (first-time or an edit), keeping every other answer whose
 * step still exists. */
export function setAnswer(defs: StepDef[], answers: Answers, id: string, value: FormValue): Answers {
  const next = { ...answers, [id]: value };
  const live = new Set(resolveSteps(defs, next).map((s) => s.id));
  return Object.fromEntries(Object.entries(next).filter(([key]) => live.has(key)));
}

export function promptText(step: Step, answers: Answers): string {
  return typeof step.prompt === "function" ? step.prompt(answers) : step.prompt;
}

/** How an answer reads on its filled-in row. */
export function formatAnswer(step: Step, value: FormValue): string {
  if (value == null) return "—";
  switch (step.kind) {
    case "chips":
      return step.options.find((o) => o.value === value)?.label ?? String(value);
    case "multiChips": {
      const tags = value as string[];
      if (tags.length === 0) return "—";
      return tags.map((t) => step.options.find((o) => o.value === t)?.label ?? t).join(", ");
    }
    case "location": {
      const loc = value as LocationAnswer;
      return loc.viaGps ? `📍 ${loc.area} (shared location)` : loc.area;
    }
    case "files": {
      const files = value as File[];
      if (files.length === 0) return "—";
      return files.length === 1 ? `📎 ${files[0].name}` : `📎 ${files.length} photos`;
    }
    default:
      return String(value);
  }
}

/** The grades:* answers for the current subjects, as the routes' gradesBySubject shape. */
export function collectGrades(answers: Answers, gradesId: string, subjects: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const subject of subjects) {
    const v = answers[`${gradesId}:${subject}`];
    if (typeof v === "string" && v.trim()) out[subject] = v.trim();
  }
  return out;
}

// --- Shared option lists and validators ---

export const AVAILABILITY_OPTIONS: Option[] = [
  { value: "weekday_morning", label: "Weekday mornings" },
  { value: "weekday_afternoon", label: "Weekday afternoons" },
  { value: "weekday_evening", label: "Weekday evenings" },
  { value: "weekend_morning", label: "Weekend mornings" },
  { value: "weekend_afternoon", label: "Weekend afternoons" },
  { value: "weekend_evening", label: "Weekend evenings" },
];

export function validatePhone(v: string): string | null {
  return v.replace(/\D/g, "").length >= 10 ? null : "That doesn't look like a full number — e.g. 0300 1234567";
}

export function validateAmount(v: string): string | null {
  return /^\d[\d,]*$/.test(v.trim()) ? null : "Just the number, please — e.g. 15000";
}

export function parseAmount(v: FormValue | undefined): number | null {
  if (typeof v !== "string") return null;
  const n = Number(v.replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}
