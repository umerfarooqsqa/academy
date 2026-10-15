"use client";

// /find-a-tutor's Lili form (2026-10-14 — replaces the all-fields form). Posts the
// same JSON body the old form did, plus latitude/longitude from "Share my
// location", to /api/public/parent-request — same pipeline as before.
// 2026-10-15: a category from a /subjects link is preselected, and "Request
// this tutor" on a featured profile sends that tutor's id along.

import type { ZonePoint } from "@/lib/geo/zoneLookup";
import LiliForm, { type SubmitResult } from "../LiliForm";
import type { Answers } from "../liliFormFlow";
import { useMemo } from "react";
import type { ZoneTutorCount } from "@/lib/tutors/nearbyCounts";
import { makeParentSteps, buildParentPayload } from "./parentSteps";
import { getCampaignRef } from "../campaignRef";

export default function FindATutorForm({
  zones,
  tutorCounts,
  initialGroup,
  initialArea,
  initialMode,
  requestedTutor,
}: {
  zones: ZonePoint[];
  tutorCounts: ZoneTutorCount[];
  initialGroup?: string;
  /** An AreaZone name from an area landing page (?area=). */
  initialArea?: string;
  /** "online" from /online-tuition (?mode=online). */
  initialMode?: "online";
  requestedTutor?: { id: string; name: string };
}) {
  const steps = useMemo(
    () =>
      makeParentSteps(tutorCounts, {
        requestedTutorName: requestedTutor?.name,
      }),
    [tutorCounts, requestedTutor?.name],
  );
  const initialAnswers = useMemo<Answers>(() => {
    const a: Answers = {};
    if (initialGroup) a.subjectGroup = initialGroup;
    if (initialMode) a.deliveryMode = initialMode;
    if (initialArea) a.location = { latitude: null, longitude: null, area: initialArea, viaGps: false };
    return a;
  }, [initialGroup, initialMode, initialArea]);

  async function submit(answers: Answers): Promise<SubmitResult> {
    const res = await fetch("/api/public/parent-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...buildParentPayload(answers),
        campaignRef: getCampaignRef(),
        preferredTutorId: requestedTutor?.id,
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok)
      return {
        ok: false,
        error: body.error ?? "Something went wrong — please try again.",
      };
    return {
      ok: true,
      declined: Boolean(body.declined),
      message: body.message,
    };
  }

  return (
    <LiliForm
      steps={steps}
      zones={zones}
      onSubmit={submit}
      initialAnswers={initialAnswers}
    />
  );
}
