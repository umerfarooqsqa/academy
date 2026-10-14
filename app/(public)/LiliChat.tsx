"use client";

// One-question-at-a-time intake chat led by Lili, the fox mascot — replaces
// the all-fields-at-once /find-a-tutor and /become-a-tutor forms
// (2026-10-14). Generic over a step list (find-a-tutor/parentSteps.ts,
// become-a-tutor/tutorSteps.ts); all state logic is in liliChatFlow.ts.
// Tapping any earlier answer rewinds the chat to that question.

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import type { ZonePoint } from "@/lib/geo/zoneLookup";
import {
  currentStepIndex,
  formatAnswer,
  promptText,
  resolveSteps,
  rewindTo,
  type Answers,
  type ChatValue,
  type Step,
  type StepDef,
} from "./liliChatFlow";
import { LiliBubble, TypingBubble, UserBubble, chipActiveClass, chipClass, sendClass, skipClass } from "./ChatBubbles";
import LocationStep from "./LocationStep";

export type SubmitResult = { ok: true; declined: boolean; message: string } | { ok: false; error: string };

const TYPING_MS = 650;
const inputClass =
  "w-full min-w-0 rounded-xl border-2 border-gray-900 bg-white px-3 py-2 text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-200";

export default function LiliChat({
  steps: defs,
  zones,
  onSubmit,
}: {
  steps: StepDef[];
  zones: ZonePoint[];
  onSubmit: (answers: Answers) => Promise<SubmitResult>;
}) {
  const [answers, setAnswers] = useState<Answers>({});
  const [revealed, setRevealed] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);

  const steps = useMemo(() => resolveSteps(defs, answers), [defs, answers]);
  const idx = currentStepIndex(steps, answers);
  const current: Step | null = steps[idx] ?? null;
  const currentKey = current ? current.id : "__review";
  const finished = result?.ok === true;

  // Short "typing…" pause before each new question.
  useEffect(() => {
    const t = setTimeout(() => setRevealed(currentKey), TYPING_MS);
    return () => clearTimeout(t);
  }, [currentKey]);
  const typing = revealed !== currentKey;

  // Keep the newest message in view — but only once the person has started,
  // so the page doesn't jump on first load.
  const endRef = useRef<HTMLDivElement>(null);
  const interacted = useRef(false);
  useEffect(() => {
    if (interacted.current) endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [revealed, idx, result, sending]);

  function answer(id: string, value: ChatValue) {
    interacted.current = true;
    setAnswers((a) => ({ ...a, [id]: value }));
  }

  function edit(id: string) {
    interacted.current = true;
    setResult(null);
    setAnswers((a) => rewindTo(steps, a, id));
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

  return (
    <div className="mt-8 rounded-3xl border-2 border-gray-900 bg-[#FFF1E2] p-4 shadow-[5px_5px_0_0_#1f2937] sm:p-6">
      <div className="flex flex-col gap-3">
        {steps.slice(0, idx).map((step) => (
          <Fragment key={step.id}>
            <LiliBubble>{promptText(step, answers)}</LiliBubble>
            <UserBubble onEdit={finished || sending ? undefined : () => edit(step.id)}>
              {formatAnswer(step, answers[step.id])}
            </UserBubble>
          </Fragment>
        ))}

        {typing ? (
          <TypingBubble />
        ) : current ? (
          <>
            <LiliBubble avatar>{promptText(current, answers)}</LiliBubble>
            <StepInput key={current.id} step={current} zones={zones} autoFocus={interacted.current} onAnswer={(v) => answer(current.id, v)} />
          </>
        ) : result?.ok ? (
          <LiliBubble avatar tone={result.declined ? "warn" : "normal"}>
            {result.message}
          </LiliBubble>
        ) : (
          <>
            <LiliBubble avatar>That&apos;s everything! Tap any answer above to change it, or send it over.</LiliBubble>
            {result && !result.ok && <LiliBubble tone="warn">Hmm — {result.error}</LiliBubble>}
            <div className="flex justify-end pl-10">
              <button type="button" className={sendClass} onClick={submit} disabled={sending}>
                {sending ? "Sending…" : "Send it ✓"}
              </button>
            </div>
          </>
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}

function StepInput({
  step,
  zones,
  autoFocus,
  onAnswer,
}: {
  step: Step;
  zones: ZonePoint[];
  autoFocus: boolean;
  onAnswer: (value: ChatValue) => void;
}) {
  switch (step.kind) {
    case "text":
      return <TextInput step={step} autoFocus={autoFocus} onAnswer={onAnswer} />;
    case "chips":
      return (
        <div className="flex flex-wrap justify-end gap-2 pl-10">
          {step.options.map((o) => (
            <button key={o.value} type="button" className={chipClass} onClick={() => onAnswer(o.value)}>
              {o.label}
            </button>
          ))}
        </div>
      );
    case "multiChips":
      return <MultiChipsInput step={step} onAnswer={onAnswer} />;
    case "location":
      return <LocationStep zones={zones} onAnswer={onAnswer} />;
    case "files":
      return <FilesInput step={step} onAnswer={onAnswer} />;
  }
}

function TextInput({
  step,
  autoFocus,
  onAnswer,
}: {
  step: Extract<Step, { kind: "text" }>;
  autoFocus: boolean;
  onAnswer: (value: ChatValue) => void;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function send(e: React.FormEvent) {
    e.preventDefault();
    const v = value.trim();
    if (!v) {
      if (step.optional) onAnswer(null);
      else setError("Please type an answer.");
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
    <form onSubmit={send} className="flex flex-col items-end gap-1.5 pl-10">
      <div className="flex w-full items-end gap-2">
        {step.multiline ? (
          <textarea rows={2} {...shared} />
        ) : (
          <input type={step.inputMode === "tel" ? "tel" : "text"} inputMode={step.inputMode} {...shared} />
        )}
        <button type="submit" className={sendClass}>
          Send
        </button>
      </div>
      {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
      {step.optional && (
        <button type="button" className={skipClass} onClick={() => onAnswer(null)}>
          Skip
        </button>
      )}
    </form>
  );
}

function MultiChipsInput({ step, onAnswer }: { step: Extract<Step, { kind: "multiChips" }>; onAnswer: (value: ChatValue) => void }) {
  const [selected, setSelected] = useState<string[]>([]);
  const toggle = (v: string) => setSelected((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]));

  return (
    <div className="flex flex-col items-end gap-2 pl-10">
      <div className="flex flex-wrap justify-end gap-2">
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
      <div className="flex items-center gap-2">
        {step.optional && (
          <button type="button" className={skipClass} onClick={() => onAnswer(null)}>
            Skip
          </button>
        )}
        <button type="button" className={sendClass} disabled={selected.length === 0} onClick={() => onAnswer(selected)}>
          Done
        </button>
      </div>
    </div>
  );
}

function FilesInput({ step, onAnswer }: { step: Extract<Step, { kind: "files" }>; onAnswer: (value: ChatValue) => void }) {
  const [files, setFiles] = useState<File[]>([]);

  return (
    <div className="flex flex-col items-end gap-2 pl-10">
      <label className={`${chipClass} cursor-pointer`}>
        📷 {files.length > 0 ? "Choose different photo" : step.multiple ? "Choose photo(s)" : "Choose photo"}
        <input
          type="file"
          accept="image/*"
          multiple={step.multiple}
          className="sr-only"
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
        />
      </label>
      {files.length > 0 && <p className="text-sm text-gray-600">{files.map((f) => f.name).join(", ")}</p>}
      <div className="flex items-center gap-2">
        <button type="button" className={skipClass} onClick={() => onAnswer(null)}>
          Skip
        </button>
        <button type="button" className={sendClass} disabled={files.length === 0} onClick={() => onAnswer(files)}>
          Send
        </button>
      </div>
    </div>
  );
}
