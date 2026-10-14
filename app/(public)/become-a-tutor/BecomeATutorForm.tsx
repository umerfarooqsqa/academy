"use client";

// /become-a-tutor's Lili form (2026-10-14 — replaces the all-fields form).
// Posts the same multipart body the old form did (CNIC/marksheet files
// included), plus latitude/longitude from "Share my location", to
// /api/public/tutor-apply — same pipeline and CNIC-gated activation as before.

import type { ZonePoint } from "@/lib/geo/zoneLookup";
import LiliForm, { type SubmitResult } from "../LiliForm";
import type { Answers } from "../liliFormFlow";
import { TUTOR_STEPS, buildTutorFormData } from "./tutorSteps";

async function submit(answers: Answers): Promise<SubmitResult> {
  const res = await fetch("/api/public/tutor-apply", { method: "POST", body: buildTutorFormData(answers) });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: body.error ?? "Something went wrong — please try again." };
  return { ok: true, declined: Boolean(body.declined), message: body.message };
}

export default function BecomeATutorForm({ zones }: { zones: ZonePoint[] }) {
  return <LiliForm steps={TUTOR_STEPS} zones={zones} onSubmit={submit} />;
}
