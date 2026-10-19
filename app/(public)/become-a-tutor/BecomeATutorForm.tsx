"use client";

// /become-a-tutor's Lili form (2026-10-14 — replaces the all-fields form).
// Posts the same multipart body the old form did (CNIC/marksheet files
// included), plus latitude/longitude from "Share my location", to
// /api/public/tutor-apply — same pipeline and CNIC-gated activation as before.
// 2026-10-15: a tutor must tick "I agree to the Terms & Conditions" before
// "Send" works; the route also refuses a registration without it.
// 2026-10-19: the full Tutor Agreement (incl. the no-direct-dealing rule) is
// shown above that box and must be scrolled to the end before it can be
// ticked; its version is sent so the route can store exactly what was shown.

import type { ZonePoint } from "@/lib/geo/zoneLookup";
import type { TermsSection } from "@/lib/defaultTerms";
import LiliForm, { type SubmitResult } from "../LiliForm";
import type { Answers } from "../liliFormFlow";
import { TUTOR_STEPS, buildTutorFormData } from "./tutorSteps";
import { getCampaignRef } from "../campaignRef";
import LegalSections, { formatLegalDate } from "../LegalSections";

export interface ShownAgreement {
  sections: TermsSection[];
  updatedOn: string;
  version: string;
}

async function submit(answers: Answers, agreementVersion: string): Promise<SubmitResult> {
  const body = buildTutorFormData(answers);
  // Only reachable once the agreement box is ticked (LiliForm disables Send).
  body.append("acceptedTerms", "yes");
  body.append("agreementVersion", agreementVersion);
  const campaignRef = getCampaignRef();
  if (campaignRef) body.append("campaignRef", campaignRef);
  const res = await fetch("/api/public/tutor-apply", { method: "POST", body });
  const result = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: result.error ?? "Something went wrong — please try again." };
  return { ok: true, declined: Boolean(result.declined), message: result.message };
}

// Links open in a new tab so the answers already given aren't lost.
const AGREEMENT = (
  <>
    I have read the Tutor Agreement above and agree to it — including the rule against dealing with introduced families
    directly and the payment due if I break it. I also agree to the{" "}
    <a href="/terms" target="_blank" rel="noopener noreferrer" className="font-semibold text-rose-600 underline underline-offset-2">
      Terms &amp; Conditions
    </a>{" "}
    and the{" "}
    <a href="/privacy" target="_blank" rel="noopener noreferrer" className="font-semibold text-rose-600 underline underline-offset-2">
      Privacy Policy
    </a>
    , and confirm that the information and documents I&apos;ve shared are true and my own.
  </>
);

export default function BecomeATutorForm({ zones, agreement }: { zones: ZonePoint[]; agreement: ShownAgreement }) {
  const agreementText = (
    <>
      <p className="font-heading text-xl font-bold text-slate-900">Tutor Agreement</p>
      <p className="mb-5 mt-1 text-xs text-slate-500">
        Last updated {formatLegalDate(agreement.updatedOn)} ·{" "}
        <a href="/tutor-agreement" target="_blank" rel="noopener noreferrer" className="font-semibold text-rose-600 underline underline-offset-2">
          Open on its own page
        </a>
      </p>
      <LegalSections sections={agreement.sections} compact />
    </>
  );
  return (
    <LiliForm
      steps={TUTOR_STEPS}
      zones={zones}
      onSubmit={(answers) => submit(answers, agreement.version)}
      agreement={AGREEMENT}
      agreementDocument={agreementText}
    />
  );
}
