"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ratingRequestMessage } from "@/lib/messages";
import { table, th, td, badge, statusTone, btnPrimary, btnSecondary, input, label, card } from "@/app/components/ui";

interface PaymentRow {
  id: string;
  amount: number;
  commission: number;
  tutorPayout: number;
  status: string;
  provider: string;
  createdAt: string;
  match: {
    tutor: { name: string; tier?: string };
    parentRequest: { whatsappId: string; area: string };
  };
}

interface MatchOption {
  id: string;
  tutorName: string;
  parentWhatsappId: string;
}

interface DueRatingRequest {
  id: string;
  tutorName: string;
  parentWhatsappId: string;
}

async function copy(text: string, onDone: () => void) {
  try {
    await navigator.clipboard.writeText(text);
    onDone();
  } catch {
    // Clipboard API can be unavailable — the text is still visible for a manual select-and-copy.
  }
}

function RatingsDue({ requests }: { requests: DueRatingRequest[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (requests.length === 0) return null;

  async function markSent(id: string) {
    setBusy(true);
    await fetch(`/api/payments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_rating_requested" }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className={`${card} mt-4`}>
      <h2 className="text-sm font-semibold text-gray-900">
        Ratings due ({requests.length}) — 30+ days since payment collected (6.8)
      </h2>
      <p className="mt-1 text-xs text-gray-500">
        Live WhatsApp sends aren&apos;t wired up (chat-export intake) — copy each message and send it
        from your own WhatsApp, then mark it sent.
      </p>
      <div className="mt-2 flex flex-col gap-2">
        {requests.map((r) => (
          <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-gray-200 p-2">
            <div className="text-sm">
              <span className="font-medium text-gray-900">{r.parentWhatsappId}</span>
              <span className="text-gray-500"> — re: {r.tutorName}</span>
            </div>
            <div className="flex gap-1.5">
              <button
                className={btnSecondary}
                onClick={() =>
                  copy(ratingRequestMessage(r.tutorName), () => {
                    setCopiedId(r.id);
                    setTimeout(() => setCopiedId(null), 2000);
                  })
                }
              >
                {copiedId === r.id ? "Copied!" : "Copy message"}
              </button>
              <button className={btnPrimary} disabled={busy} onClick={() => markSent(r.id)}>
                Mark sent
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PaymentsClient({
  payments,
  openMatches,
  dueRatingRequests,
}: {
  payments: PaymentRow[];
  openMatches: MatchOption[];
  dueRatingRequests: DueRatingRequest[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [newPayment, setNewPayment] = useState({ matchId: "", amount: "" });

  async function markCollected(id: string) {
    setBusy(true);
    await fetch(`/api/payments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "collect" }),
    });
    setBusy(false);
    router.refresh();
  }

  async function markPaidOut(id: string) {
    setBusy(true);
    await fetch(`/api/payments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "paid_out" }),
    });
    setBusy(false);
    router.refresh();
  }

  async function createPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!newPayment.matchId || !newPayment.amount) return;
    setBusy(true);
    await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId: newPayment.matchId, amount: Number(newPayment.amount) }),
    });
    setBusy(false);
    setNewPayment({ matchId: "", amount: "" });
    router.refresh();
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className={table}>
          <thead>
            <tr>
              <th className={th}>Tutor / Parent</th>
              <th className={th}>Amount</th>
              <th className={th}>Commission (50%)</th>
              <th className={th}>Tutor payout</th>
              <th className={th}>Status</th>
              <th className={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id}>
                <td className={td}>
                  <div className="font-medium text-gray-900">
                    {p.match.tutor.name}
                    {p.match.tutor.tier === "premium" && <span className={`${badge("blue")} ml-1`}>priority payout</span>}
                  </div>
                  <div className="text-xs text-gray-500">{p.match.parentRequest.whatsappId} · {p.match.parentRequest.area}</div>
                </td>
                <td className={td}>Rs {p.amount.toLocaleString()}</td>
                <td className={td}>Rs {p.commission.toLocaleString()}</td>
                <td className={td}>Rs {p.tutorPayout.toLocaleString()}</td>
                <td className={td}>
                  <span className={badge(statusTone(p.status))}>{p.status}</span>
                </td>
                <td className={td}>
                  <div className="flex gap-1.5">
                    {p.status === "pending" && (
                      <button className={btnPrimary} disabled={busy} onClick={() => markCollected(p.id)}>
                        Mark collected
                      </button>
                    )}
                    {p.status === "collected" && (
                      <button className={btnSecondary} disabled={busy} onClick={() => markPaidOut(p.id)}>
                        Mark paid out
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr>
                <td className={td} colSpan={6}>
                  No payments yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {openMatches.length > 0 && (
        <form onSubmit={createPayment} className={`${card} mt-4 flex flex-wrap items-end gap-3`}>
          <div>
            <label className={label}>Match (demo scheduled, no payment yet)</label>
            <select
              className={input}
              value={newPayment.matchId}
              onChange={(e) => setNewPayment({ ...newPayment, matchId: e.target.value })}
            >
              <option value="">Select…</option>
              {openMatches.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.tutorName} — {m.parentWhatsappId}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Amount (PKR, first month)</label>
            <input className={input} value={newPayment.amount} onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })} />
          </div>
          <button className={btnPrimary} disabled={busy} type="submit">
            Generate payment record
          </button>
        </form>
      )}

      <RatingsDue requests={dueRatingRequests} />
    </div>
  );
}
