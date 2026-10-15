"use client";

// /find-a-tutor's Lili form (2026-10-14 — replaces the all-fields form). Posts the
// same JSON body the old form did, plus latitude/longitude from "Share my
// location", to /api/public/parent-request — same pipeline as before.

import type { ZonePoint } from "@/lib/geo/zoneLookup";
import LiliForm, { type SubmitResult } from "../LiliForm";
import type { Answers } from "../liliFormFlow";
import { useMemo } from "react";
import type { ZoneTutorCount } from "@/lib/tutors/nearbyCounts";
import { makeParentSteps, buildParentPayload } from "./parentSteps";
import { getCampaignRef } from "../campaignRef";

async function submit(answers: Answers): Promise<SubmitResult> {
  const res = await fetch("/api/public/parent-request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...buildParentPayload(answers), campaignRef: getCampaignRef() }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: body.error ?? "Something went wrong — please try again." };
  return { ok: true, declined: Boolean(body.declined), message: body.message };
}

export default function FindATutorForm({ zones, tutorCounts }: { zones: ZonePoint[]; tutorCounts: ZoneTutorCount[] }) {
  const steps = useMemo(() => makeParentSteps(tutorCounts), [tutorCounts]);
  return <LiliForm steps={steps} zones={zones} onSubmit={submit} />;
}
