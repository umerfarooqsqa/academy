// Pure state logic for the Lili chat (app/(public)/LiliChat.tsx) — the
// one-question-at-a-time replacement for the /find-a-tutor and
// /become-a-tutor forms (2026-10-14). No React here so it's unit-testable.
//
// Model: a list of step definitions plus a flat `answers` map keyed by step
// id. The current question is simply the first step with no answer yet;
// editing an earlier answer deletes it and every answer after it (rewind).
// A skipped optional step is answered with null, so it still counts as done.

export interface Option {
  value: string;
  label: string;
}

export interface LocationAnswer {
  latitude: number | null;
  longitude: number | null;
  /** AreaZone.name — the nearest in-range zone, or the one the person picked. */
  area: string;
  /** true when the person shared their location (even if they then had to pick an area). */
  viaGps: boolean;
}

export type ChatValue = string | string[] | File[] | LocationAnswer | null;
export type Answers = Record<string, ChatValue>;

type Prompt = string | ((answers: Answers) => string);

export type Step =
  | {
      kind: "text";
      id: string;
      prompt: Prompt;
      placeholder?: string;
      optional?: boolean;
      inputMode?: "text" | "tel" | "numeric";
      multiline?: boolean;
      /** Returns an error message, or null when valid. */
      validate?: (value: string) => string | null;
    }
  | { kind: "chips"; id: string; prompt: Prompt; options: Option[] }
  | { kind: "multiChips"; id: string; prompt: Prompt; options: Option[]; optional?: boolean }
  | { kind: "location"; id: string; prompt: Prompt }
  | { kind: "files"; id: string; prompt: Prompt; multiple?: boolean };

/** Expands into one text step per subject listed in `subjectsFrom`'s answer,
 * with ids `${id}:${subject}`. */
export interface GradesStepDef {
  kind: "grades";
  id: string;
  subjectsFrom: string;
  prompt: (subject: string, answers: Answers) => string;
  placeholder?: string;
}

export type StepDef = Step | GradesStepDef;

/** Comma-separated only — the same split the tutor-apply route does server
 * side, so per-subject grade keys line up with the stored subjects. */
export function splitSubjects(raw: ChatValue | undefined): string[] {
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

/** Removes the answer for `stepId` and every step after it. */
export function rewindTo(steps: Step[], answers: Answers, stepId: string): Answers {
  const i = steps.findIndex((s) => s.id === stepId);
  if (i === -1) return answers;
  const drop = new Set(steps.slice(i).map((s) => s.id));
  return Object.fromEntries(Object.entries(answers).filter(([id]) => !drop.has(id)));
}

export function promptText(step: Step, answers: Answers): string {
  return typeof step.prompt === "function" ? step.prompt(answers) : step.prompt;
}

/** How an answer reads in the person's own chat bubble. */
export function formatAnswer(step: Step, value: ChatValue): string {
  if (value == null) return "Skip";
  switch (step.kind) {
    case "chips":
      return step.options.find((o) => o.value === value)?.label ?? String(value);
    case "multiChips": {
      const tags = value as string[];
      if (tags.length === 0) return "Skip";
      return tags.map((t) => step.options.find((o) => o.value === t)?.label ?? t).join(", ");
    }
    case "location": {
      const loc = value as LocationAnswer;
      return loc.viaGps ? `📍 My location (${loc.area})` : loc.area;
    }
    case "files": {
      const files = value as File[];
      if (files.length === 0) return "Skip";
      return files.length === 1 ? `📎 ${files[0].name}` : `📎 ${files.length} photos`;
    }
    default:
      return String(value);
  }
}

/** Answers for every grades:* step, as the routes' gradesBySubject shape. */
export function collectGrades(answers: Answers, gradesId: string): Record<string, string> {
  const prefix = `${gradesId}:`;
  const out: Record<string, string> = {};
  for (const [id, v] of Object.entries(answers)) {
    if (id.startsWith(prefix) && typeof v === "string" && v.trim()) out[id.slice(prefix.length)] = v.trim();
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

export function parseAmount(v: ChatValue | undefined): number | null {
  if (typeof v !== "string") return null;
  const n = Number(v.replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}
