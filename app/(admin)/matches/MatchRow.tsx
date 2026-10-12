"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { tutorOpportunityNotification, demoSlotOffer } from "@/lib/messages";
import { btnPrimary, btnSecondary, btnDanger, badge, statusTone, input } from "@/app/components/ui";

async function copy(text: string, onDone: () => void) {
  try {
    await navigator.clipboard.writeText(text);
    onDone();
  } catch {
    // Clipboard API can be unavailable — the text is still visible for a manual select-and-copy.
  }
}

interface MatchRowProps {
  match: {
    id: string;
    score: number;
    status: string;
    internalNote: string | null;
    opportunityCode: string | null;
    publishedToPageAt: string | null;
    interestedTutorId: string | null;
    demoSlots: unknown;
    demoScheduledAt: string | null;
    tutor: { id: string; name: string; whatsappId: string; tier?: string };
    parentRequest: { id: string; whatsappId: string; subjects: string[]; area: string; curriculum: string; budget: number | null };
  };
}

export default function MatchRow({ match }: MatchRowProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [showSlots, setShowSlots] = useState(false);
  const [slotsText, setSlotsText] = useState(
    Array.isArray(match.demoSlots) ? (match.demoSlots as string[]).join(", ") : "",
  );
  const [copiedOpportunity, setCopiedOpportunity] = useState(false);
  const [copiedDemoOffer, setCopiedDemoOffer] = useState(false);

  async function act(action: "approve" | "reject" | "edit") {
    setBusy(true);
    await fetch(`/api/matches/${match.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, note: note || undefined }),
    });
    setBusy(false);
    router.refresh();
  }

  async function saveSlots() {
    setBusy(true);
    const slots = slotsText.split(",").map((s) => s.trim()).filter(Boolean);
    await fetch(`/api/matches/${match.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ demoSlots: slots }),
    });
    setBusy(false);
    setShowSlots(false);
    router.refresh();
  }

  async function markInterested() {
    setBusy(true);
    await fetch(`/api/matches/${match.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "confirm_interest", tutorId: match.tutor.id }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <tr className="border-b border-gray-100 align-top">
      <td className="px-3 py-2 text-sm">
        <div className="font-medium text-gray-900">{match.tutor.name}</div>
        <div className="text-xs text-gray-500">{match.tutor.whatsappId}</div>
        {match.tutor.tier === "premium" && <span className={`${badge("blue")} mt-1`}>Verified Premium</span>}
      </td>
      <td className="px-3 py-2 text-sm">
        <div>{match.parentRequest.subjects.join(", ")}</div>
        <div className="text-xs text-gray-500">
          {match.parentRequest.area} · {match.parentRequest.curriculum} · budget{" "}
          {match.parentRequest.budget ? `Rs ${match.parentRequest.budget}` : "n/a"}
        </div>
      </td>
      <td className="px-3 py-2 text-sm font-medium text-gray-900">{match.score.toFixed(2)}</td>
      <td className="px-3 py-2 text-sm">
        <span className={badge(statusTone(match.status))}>{match.status}</span>
        {match.opportunityCode && (
          <div className="mt-1 text-xs text-gray-500">{match.opportunityCode}</div>
        )}
        {match.internalNote && <div className="mt-1 text-xs text-amber-700">{match.internalNote}</div>}
      </td>
      <td className="px-3 py-2 text-sm">
        {match.status === "awaiting_approval" && (
          <div className="flex flex-wrap gap-1.5">
            <button className={btnPrimary} disabled={busy} onClick={() => act("approve")}>
              Approve
            </button>
            <button className={btnDanger} disabled={busy} onClick={() => act("reject")}>
              Reject
            </button>
          </div>
        )}
        {match.status === "approved" && !match.interestedTutorId && (
          <div className="flex flex-col gap-1.5">
            <button className={btnSecondary} disabled={busy} onClick={markInterested}>
              Mark tutor interested
            </button>
            {match.tutor.tier === "premium" && (
              <button
                className={btnSecondary}
                onClick={() =>
                  copy(
                    tutorOpportunityNotification(
                      match.parentRequest.subjects.join(", "),
                      match.parentRequest.curriculum,
                      match.parentRequest.area,
                    ),
                    () => {
                      setCopiedOpportunity(true);
                      setTimeout(() => setCopiedOpportunity(false), 2000);
                    },
                  )
                }
              >
                {copiedOpportunity ? "Copied!" : "Copy opportunity message"}
              </button>
            )}
          </div>
        )}
        {(match.status === "approved" || match.status === "selected") && (
          <div className="mt-2">
            {Array.isArray(match.demoSlots) && (match.demoSlots as string[]).length > 0 && (
              <button
                className={`${btnSecondary} mb-1.5`}
                onClick={() =>
                  copy(demoSlotOffer(match.tutor.name, match.demoSlots as string[]), () => {
                    setCopiedDemoOffer(true);
                    setTimeout(() => setCopiedDemoOffer(false), 2000);
                  })
                }
              >
                {copiedDemoOffer ? "Copied!" : "Copy demo slot offer"}
              </button>
            )}
            {showSlots ? (
              <div className="flex flex-col gap-1">
                <input
                  className={input}
                  placeholder="Fri 4pm, Sat 11am, Sun 5pm"
                  value={slotsText}
                  onChange={(e) => setSlotsText(e.target.value)}
                />
                <div className="flex gap-1.5">
                  <button className={btnPrimary} disabled={busy} onClick={saveSlots}>
                    Save slots
                  </button>
                  <button className={btnSecondary} onClick={() => setShowSlots(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button className={btnSecondary} onClick={() => setShowSlots(true)}>
                {Array.isArray(match.demoSlots) && (match.demoSlots as string[]).length > 0
                  ? "Edit demo slots"
                  : "Enter demo slots"}
              </button>
            )}
          </div>
        )}
        <div className="mt-2">
          <input
            className={input}
            placeholder="note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      </td>
    </tr>
  );
}
