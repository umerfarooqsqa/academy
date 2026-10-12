"use client";

// Public, unauthenticated (CLAUDE.md Section 7). Free-tier tutors browse this
// and self-initiate a WhatsApp message referencing the OPP-XXXX code (6.5) —
// no parent contact info is ever shown here.

import { useState } from "react";
import { SUBJECT_GROUP_LABELS, type SubjectGroup } from "@/lib/subjectGroups";
import { formatOpportunityCopyText, formatFullDigestText, type OpportunityListing } from "@/lib/opportunities/formatText";
import { btnPrimary, btnSecondary, card, badge } from "@/app/components/ui";

async function copy(text: string, onDone: () => void) {
  try {
    await navigator.clipboard.writeText(text);
    onDone();
  } catch {
    // Clipboard API can be unavailable (older browser, insecure context) — the
    // text is still visible on the card for a manual select-and-copy.
  }
}

export default function OpportunitiesClient({ listings }: { listings: OpportunityListing[] }) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{listings.length} open opportunit{listings.length === 1 ? "y" : "ies"}</p>
        {listings.length > 0 && (
          <button
            className={btnSecondary}
            onClick={() =>
              copy(formatFullDigestText(listings), () => {
                setCopiedAll(true);
                setTimeout(() => setCopiedAll(false), 2000);
              })
            }
          >
            {copiedAll ? "Copied!" : "Copy all as digest"}
          </button>
        )}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((l) => (
          <div key={l.opportunityCode} className={card}>
            <div className="flex items-center justify-between">
              <span className={badge("blue")}>{l.opportunityCode}</span>
              <span className="text-xs text-gray-500">{SUBJECT_GROUP_LABELS[l.subjectGroup as SubjectGroup] ?? l.subjectGroup}</span>
            </div>
            <p className="mt-2 text-sm font-medium text-gray-900">{l.subjects.join(", ") || "Tutor needed"}</p>
            <p className="mt-1 text-xs text-gray-500">
              {l.area} · {l.curriculum}
            </p>
            <button
              className={`${btnPrimary} mt-3 w-full`}
              onClick={() =>
                copy(formatOpportunityCopyText(l), () => {
                  setCopiedCode(l.opportunityCode);
                  setTimeout(() => setCopiedCode(null), 2000);
                })
              }
            >
              {copiedCode === l.opportunityCode ? "Copied!" : "Copy"}
            </button>
          </div>
        ))}
        {listings.length === 0 && (
          <p className="text-sm text-gray-500">No open opportunities right now — check back soon!</p>
        )}
      </div>
    </div>
  );
}
