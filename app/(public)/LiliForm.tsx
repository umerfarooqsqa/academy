"use client";

// The /find-a-tutor and /become-a-tutor intake (2026-10-14): Lili, the fox
// mascot, "says" each question — her line types out in one speech bubble
// while she bobs — and the matching field appears beneath her. Answered
// fields stack above as a growing form, each with an Edit link that brings
// Lili back to that question (later answers are kept). Generic over a step
// list (find-a-tutor/parentSteps.ts, become-a-tutor/tutorSteps.ts); all state
// logic is in liliFormFlow.ts.

import { useEffect, useMemo, useRef, useState } from "react";
import type { ZonePoint } from "@/lib/geo/zoneLookup";
import Lili from "./Lili";
import LocationStep from "./LocationStep";
import {
  currentStepIndex,
  formatAnswer,
  promptText,
  resolveSteps,
  setAnswer,
  type Answers,
  type FormValue,
  type Step,
  type StepDef,
} from "./liliFormFlow";
import { chipActiveClass, chipClass, inputClass, linkClass, primaryClass } from "./liliStyles";
import styles from "./LiliForm.module.css";

export type SubmitResult = { ok: true; declined: boolean; message: string } | { ok: false; error: string };

const REVIEW_LINE = "That's everything! Check your answers above — tap Edit to change any — then send them over.";

/** Reveals `text` a few characters at a time; instant with reduced motion. */
function useTypewriter(text: string) {
  const [state, setState] = useState({ text: "", count: 0 });
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setState({ text, count: text.length });
      return;
    }
    setState({ text, count: 0 });
    const perTick = Math.max(1, Math.ceil(text.length / 55));
    const id = setInterval(() => {
      setState((s) => {
        if (s.text !== text) return s;
        const count = Math.min(text.length, s.count + perTick);
        if (count >= text.length) clearInterval(id);
        return { text, count };
      });
    }, 22);
    return () => clearInterval(id);
  }, [text]);
  const count = state.text === text ? state.count : 0;
  return { shown: text.slice(0, count), done: count >= text.length };
}

export default function LiliForm({
  steps: defs,
  zones,
  onSubmit,
  initialAnswers,
  agreement,
  agreementDocument,
}: {
  steps: StepDef[];
  zones: ZonePoint[];
  onSubmit: (answers: Answers) => Promise<SubmitResult>;
  /** Answers filled in before the person starts, e.g. the category from a
   * /subjects link (still editable like any other answer). */
  initialAnswers?: Answers;
  /** A checkbox the person must tick before "Send" works, e.g. agreeing to
   * the Terms & Conditions on the tutor form (2026-10-15). */
  agreement?: React.ReactNode;
  /** The full text being agreed to, shown in a scroll box above the
   * checkbox; the box can only be ticked once it's been scrolled to the end
   * (Tutor Agreement, 2026-10-19). */
  agreementDocument?: React.ReactNode;
}) {
  const [answers, setAnswers] = useState<Answers>(initialAnswers ?? {});
  const [agreed, setAgreed] = useState(false);
  const [readToEnd, setReadToEnd] = useState(!agreementDocument);
  const [editing, setEditing] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [said, setSaid] = useState<{ key: string; text: string } | null>(null);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);

  const steps = useMemo(() => resolveSteps(defs, answers), [defs, answers]);
  const current: Step | null = steps[currentStepIndex(steps, answers)] ?? null;
  const editingStep = editing ? (steps.find((s) => s.id === editing) ?? null) : null;
  const active = editingStep ?? current;
  const finished = result?.ok === true;
  const activeKey = editingStep ? `edit:${editingStep.id}` : (current?.id ?? (finished ? "__done" : "__review"));

  let line: string;
  if (said && said.key === activeKey) line = said.text;
  else if (active) line = promptText(active, answers);
  else if (result?.ok) line = result.message;
  else if (result && !result.ok) line = `Hmm — ${result.error}`;
  else line = REVIEW_LINE;

  const { shown, done } = useTypewriter(line);
  useEffect(() => {
    if (done) setRevealedKey(activeKey);
  }, [done, activeKey]);
  const fieldVisible = revealedKey === activeKey;

  // Bring Lili and the new field into view — only once the person has
  // started, so the page doesn't jump on first load.
  const activeRef = useRef<HTMLDivElement>(null);
  const interacted = useRef(false);
  useEffect(() => {
    if (interacted.current) activeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeKey]);

  function answer(id: string, value: FormValue) {
    interacted.current = true;
    setAnswers((a) => setAnswer(defs, a, id, value));
    setEditing(null);
    setResult(null);
  }

  function startEdit(id: string) {
    interacted.current = true;
    setEditing(id);
  }

  async function submit() {
    setSending(true);
    setResult(null);
    try {
      setResult(await onSubmit(answers));
    } catch {
      setResult({ ok: false, error: "Something went wrong — please try again." });
    }
    setSending(false);
  }

  const answered = steps.filter((s) => s.id in answers);

  return (
    <div className="mt-8 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-8">
      {answered.length > 0 && (
        <dl className="mb-6 divide-y divide-slate-100 border-b border-slate-100">
          {answered.map((step) => (
            <div
              key={step.id}
              className={`flex items-start justify-between gap-4 py-3 ${styles.appear} ${editing === step.id ? "opacity-50" : ""}`}
            >
              <div className="min-w-0">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{step.label}</dt>
                <dd className="mt-0.5 whitespace-pre-wrap break-words text-base font-medium text-slate-900">
                  {formatAnswer(step, answers[step.id])}
                </dd>
              </div>
              {!finished && !sending && editing !== step.id && (
                <button type="button" className={`${linkClass} shrink-0`} onClick={() => startEdit(step.id)}>
                  Edit
                </button>
              )}
            </div>
          ))}
        </dl>
      )}

      <div ref={activeRef} key={activeKey} className={styles.appear}>
        <div className="flex items-end gap-3 sm:gap-4">
          <Lili className="w-16 shrink-0 sm:w-20" talking={!done} />
          <div
            className="relative mb-4 flex-1 rounded-2xl rounded-bl-md bg-rose-50 px-4 py-3 text-base font-medium leading-snug text-slate-900 ring-1 ring-rose-100 sm:text-lg"
          >
            <span className="sr-only" aria-live="polite">
              {line}
            </span>
            {/* Full line kept invisible underneath so the bubble doesn't grow while typing. */}
            <span aria-hidden="true" className="relative block">
              <span className="invisible">{line}</span>
              <span className="absolute inset-0">{shown}</span>
            </span>
          </div>
        </div>

        {fieldVisible && (
          <div className={`mt-2 ${styles.appear}`}>
            {active ? (
              <>
                <label className="mb-2 block text-sm font-semibold text-slate-700">{active.label}</label>
                <StepInput
                  key={activeKey}
                  step={active}
                  zones={zones}
                  initial={editingStep ? answers[editingStep.id] : undefined}
                  autoFocus={interacted.current}
                  onAnswer={(v) => answer(active.id, v)}
                  onSay={(text) => setSaid({ key: activeKey, text })}
                />
                {editingStep && (
                  <button type="button" className={`${linkClass} mt-3`} onClick={() => setEditing(null)}>
                    Cancel
                  </button>
                )}
              </>
            ) : (
              !finished && (
                <div className="flex flex-col items-start gap-4">
                  {agreementDocument && <AgreementBox onReadToEnd={() => setReadToEnd(true)}>{agreementDocument}</AgreementBox>}
                  {agreement && (
                    <label
                      className={`flex items-start gap-3 rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700 ring-1 ring-slate-200 ${
                        readToEnd ? "cursor-pointer" : "cursor-not-allowed opacity-60"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={agreed}
                        disabled={!readToEnd}
                        onChange={(e) => setAgreed(e.target.checked)}
                        className="mt-0.5 h-5 w-5 shrink-0 accent-rose-600"
                      />
                      <span>{agreement}</span>
                    </label>
                  )}
                  {agreement && !readToEnd && (
                    <p className="-mt-2 text-sm font-medium text-rose-700">Please scroll to the end of the agreement above to continue.</p>
                  )}
                  <button
                    type="button"
                    className={primaryClass}
                    onClick={submit}
                    disabled={sending || (Boolean(agreement) && !agreed)}
                  >
                    {sending ? "Sending…" : "Send ✓"}
                  </button>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** Scrollable box for the text being agreed to; reports once it has been
 * scrolled to the bottom (or immediately, if it all fits without scrolling). */
function AgreementBox({ children, onReadToEnd }: { children: React.ReactNode; onReadToEnd: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const reported = useRef(false);
  function check() {
    const el = ref.current;
    if (!el || reported.current) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 24) {
      reported.current = true;
      onReadToEnd();
    }
  }
  useEffect(check);
  return (
    <div
      ref={ref}
      onScroll={check}
      tabIndex={0}
      role="region"
      aria-label="Agreement text"
      className="max-h-[26rem] w-full overflow-y-auto rounded-xl bg-white p-5 ring-1 ring-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
    >
      {children}
    </div>
  );
}

function StepInput({
  step,
  zones,
  initial,
  autoFocus,
  onAnswer,
  onSay,
}: {
  step: Step;
  zones: ZonePoint[];
  initial: FormValue | undefined;
  autoFocus: boolean;
  onAnswer: (value: FormValue) => void;
  onSay: (text: string) => void;
}) {
  switch (step.kind) {
    case "text":
      return <TextInput step={step} initial={typeof initial === "string" ? initial : ""} autoFocus={autoFocus} onAnswer={onAnswer} />;
    case "chips":
      return (
        <div className="flex flex-wrap gap-2">
          {step.options.map((o) => (
            <button key={o.value} type="button" className={initial === o.value ? chipActiveClass : chipClass} onClick={() => onAnswer(o.value)}>
              {o.label}
            </button>
          ))}
        </div>
      );
    case "multiChips":
      return <MultiChipsInput step={step} initial={Array.isArray(initial) ? (initial as string[]) : []} onAnswer={onAnswer} />;
    case "location":
      return <LocationStep zones={zones} onAnswer={onAnswer} onSay={onSay} />;
    case "files":
      return <FilesInput step={step} onAnswer={onAnswer} />;
  }
}

function TextInput({
  step,
  initial,
  autoFocus,
  onAnswer,
}: {
  step: Extract<Step, { kind: "text" }>;
  initial: string;
  autoFocus: boolean;
  onAnswer: (value: FormValue) => void;
}) {
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string | null>(null);

  function next(e: React.FormEvent) {
    e.preventDefault();
    const v = value.trim();
    if (!v) {
      if (step.optional) onAnswer(null);
      else setError("Please fill this in to continue.");
      return;
    }
    const problem = step.validate?.(v) ?? null;
    if (problem) {
      setError(problem);
      return;
    }
    onAnswer(v);
  }

  const shared = {
    className: inputClass,
    value,
    placeholder: step.placeholder,
    autoFocus,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValue(e.target.value);
      setError(null);
    },
  };

  return (
    <form onSubmit={next} className="flex flex-col gap-2">
      <div className="flex items-start gap-2">
        {step.multiline ? (
          <textarea rows={3} {...shared} />
        ) : (
          <input type={step.inputMode === "tel" ? "tel" : "text"} inputMode={step.inputMode} {...shared} />
        )}
        <button type="submit" className={`${primaryClass} shrink-0`}>
          Next
        </button>
      </div>
      {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
      {step.optional && (
        <button type="button" className={`${linkClass} self-start`} onClick={() => onAnswer(null)}>
          Skip this one
        </button>
      )}
    </form>
  );
}

function MultiChipsInput({
  step,
  initial,
  onAnswer,
}: {
  step: Extract<Step, { kind: "multiChips" }>;
  initial: string[];
  onAnswer: (value: FormValue) => void;
}) {
  const [selected, setSelected] = useState<string[]>(initial);
  const toggle = (v: string) => setSelected((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {step.options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={selected.includes(o.value)}
            className={selected.includes(o.value) ? chipActiveClass : chipClass}
            onClick={() => toggle(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-4">
        <button type="button" className={primaryClass} disabled={selected.length === 0} onClick={() => onAnswer(selected)}>
          Next
        </button>
        {step.optional && (
          <button type="button" className={linkClass} onClick={() => onAnswer(null)}>
            Skip this one
          </button>
        )}
      </div>
    </div>
  );
}

function FilesInput({ step, onAnswer }: { step: Extract<Step, { kind: "files" }>; onAnswer: (value: FormValue) => void }) {
  const [files, setFiles] = useState<File[]>([]);

  return (
    <div className="flex flex-col gap-3">
      <label className={`${chipClass} cursor-pointer self-start`}>
        📷 {files.length > 0 ? "Choose a different photo" : step.multiple ? "Choose photo(s)" : "Choose photo"}
        <input type="file" accept="image/*" multiple={step.multiple} className="sr-only" onChange={(e) => setFiles(Array.from(e.target.files ?? []))} />
      </label>
      {files.length > 0 && <p className="text-sm text-slate-600">{files.map((f) => f.name).join(", ")}</p>}
      <div className="flex items-center gap-4">
        <button type="button" className={primaryClass} disabled={files.length === 0} onClick={() => onAnswer(files)}>
          Next
        </button>
        <button type="button" className={linkClass} onClick={() => onAnswer(null)}>
          Skip this one
        </button>
      </div>
    </div>
  );
}
