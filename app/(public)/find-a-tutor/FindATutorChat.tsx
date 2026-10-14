"use client";

// /find-a-tutor's Lili chat (2026-10-14 — replaces FindATutorForm). Posts the
// same JSON body the old form did, plus latitude/longitude from "Share my
// location", to /api/public/parent-request — same pipeline as before.

import type { ZonePoint } from "@/lib/geo/zoneLookup";
import LiliChat, { type SubmitResult } from "../LiliChat";
import type { Answers } from "../liliChatFlow";
import { PARENT_STEPS, buildParentPayload } from "./parentSteps";

async function submit(answers: Answers): Promise<SubmitResult> {
  const res = await fetch("/api/public/parent-request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildParentPayload(answers)),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: body.error ?? "Something went wrong — please try again." };
  return { ok: true, declined: Boolean(body.declined), message: body.message };
}

export default function FindATutorChat({ zones }: { zones: ZonePoint[] }) {
  return <LiliChat steps={PARENT_STEPS} zones={zones} onSubmit={submit} />;
}
