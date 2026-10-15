"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { card, input, label, btnPrimary, btnSecondary, badge, statusTone } from "@/app/components/ui";

interface ParentDetailProps {
  parent: {
    id: string;
    status: string;
    internalNote: string | null;
    campaignId: string | null;
    opportunityCode: string | null;
    publicHiddenAt: Date | null;
    facebookPostedAt: Date | null;
  };
  campaigns: Array<{ id: string; name: string }>;
  matches: Array<{ id: string; score: number; status: string; tutor: { name: string } }>;
}

export default function ParentDetailClient({ parent, campaigns, matches }: ParentDetailProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [campaignId, setCampaignId] = useState(parent.campaignId ?? "");
  const [runResult, setRunResult] = useState<string | null>(null);

  async function attribute() {
    if (!campaignId) return;
    setBusy(true);
    await fetch(`/api/parents/${parent.id}/attribute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaignId }),
    });
    setBusy(false);
    router.refresh();
  }

  async function setPublicHidden(publicHidden: boolean) {
    setBusy(true);
    await fetch(`/api/parents/${parent.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicHidden }),
    });
    setBusy(false);
    router.refresh();
  }

  async function runMatching() {
    setBusy(true);
    setRunResult(null);
    const res = await fetch("/api/matching/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parentRequestId: parent.id }),
    });
    const body = await res.json();
    setRunResult(body.note ?? "Done.");
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className={`${card} lg:col-span-2`}>
        <h2 className="text-sm font-semibold text-gray-900">Matches for this request</h2>
        {matches.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">No matches yet.</p>
        ) : (
          <ul className="mt-2 divide-y divide-gray-100">
            {matches.map((m) => (
              <li key={m.id} className="flex items-center justify-between py-2 text-sm">
                <span>
                  <Link href="/matches" className="font-medium text-gray-900 hover:underline">
                    {m.tutor.name}
                  </Link>{" "}
                  — score {m.score.toFixed(2)}
                </span>
                <span className={badge(statusTone(m.status))}>{m.status}</span>
              </li>
            ))}
          </ul>
        )}
        <button className={`${btnPrimary} mt-4`} disabled={busy} onClick={runMatching}>
          {busy ? "Running…" : "Run matching engine"}
        </button>
        {runResult && <p className="mt-2 text-xs text-gray-500">{runResult}</p>}
      </div>

      <div className={card}>
        <h2 className="text-sm font-semibold text-gray-900">Public listing</h2>
        <p className="mt-1 text-xs text-gray-500">
          Open requests are shown on /opportunities and posted to the Facebook Page (subject, level and area only).
        </p>
        <p className="mt-2 text-sm text-gray-700">
          {parent.opportunityCode ? <span className={badge("blue")}>{parent.opportunityCode}</span> : "No code yet"}{" "}
          {parent.publicHiddenAt ? (
            <span className={badge("amber")}>Hidden from public</span>
          ) : parent.status === "closed" ? (
            <span className={badge("gray")}>Not listed (closed)</span>
          ) : (
            <span className={badge("green")}>Listed</span>
          )}{" "}
          {parent.facebookPostedAt && <span className={badge("gray")}>Posted to Facebook</span>}
        </p>
        <button className={`${btnSecondary} mt-3`} disabled={busy} onClick={() => setPublicHidden(!parent.publicHiddenAt)}>
          {parent.publicHiddenAt ? "Show on public listings" : "Hide from public"}
        </button>
      </div>

      <div className={card}>
        <h2 className="text-sm font-semibold text-gray-900">Campaign attribution</h2>
        <p className="mt-1 text-xs text-gray-500">
          Manual tagging for non-Meta-ad leads (referrals, organic posts) — 6.1.
        </p>
        <div className="mt-2 flex gap-2">
          <select className={input} value={campaignId} onChange={(e) => setCampaignId(e.target.value)}>
            <option value="">Unattributed</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button className={btnSecondary} disabled={busy || !campaignId} onClick={attribute}>
            Set
          </button>
        </div>
      </div>
    </div>
  );
}
