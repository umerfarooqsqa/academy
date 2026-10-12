"use client";

import { useState } from "react";
import { card, input, label, btnPrimary, badge } from "@/app/components/ui";

interface Campaign {
  id: string;
  name: string;
}

interface ImportResult {
  declined?: boolean;
  activated?: boolean;
  missingFields?: string[];
  tutor?: { id: string; name: string; status: string; internalNote: string | null };
  parent?: { id: string; status: string; internalNote: string | null };
}

export default function ImportClient({ campaigns }: { campaigns: Campaign[] }) {
  const [senderType, setSenderType] = useState<"tutor" | "parent">("tutor");
  const [whatsappId, setWhatsappId] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !whatsappId.trim()) return;
    setBusy(true);
    setError(null);
    setResult(null);

    const form = new FormData();
    form.append("file", file);
    form.append("senderType", senderType);
    form.append("whatsappId", whatsappId.trim());
    if (campaignId) form.append("campaignId", campaignId);

    const res = await fetch("/api/import", { method: "POST", body: form });
    const body = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(body.error ?? "Import failed");
      return;
    }
    setResult(body);
  }

  const record = result?.tutor ?? result?.parent;
  const recordHref = result?.tutor ? `/tutors/${result.tutor.id}` : result?.parent ? `/parents/${result.parent.id}` : null;

  return (
    <form onSubmit={submit} className={`${card} mt-4 flex flex-col gap-3`}>
      <div>
        <label className={label}>Who is this conversation with?</label>
        <div className="flex gap-2">
          <button
            type="button"
            className={senderType === "tutor" ? badge("blue") : badge("gray")}
            onClick={() => setSenderType("tutor")}
          >
            Tutor
          </button>
          <button
            type="button"
            className={senderType === "parent" ? badge("blue") : badge("gray")}
            onClick={() => setSenderType("parent")}
          >
            Parent
          </button>
        </div>
      </div>

      <div>
        <label className={label}>WhatsApp number</label>
        <input
          className={input}
          required
          placeholder="e.g. 923001234567"
          value={whatsappId}
          onChange={(e) => setWhatsappId(e.target.value)}
        />
        <p className="mt-1 text-xs text-gray-500">
          Not parsed from the export — a saved contact name doesn&apos;t reliably give the raw number.
        </p>
      </div>

      {campaigns.length > 0 && (
        <div>
          <label className={label}>Campaign (optional)</label>
          <select className={input} value={campaignId} onChange={(e) => setCampaignId(e.target.value)}>
            <option value="">Unattributed</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className={label}>Exported chat file (.txt or .zip with media)</label>
        <input
          className={input}
          type="file"
          accept=".txt,.zip"
          required
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button className={btnPrimary} disabled={busy} type="submit">
        {busy ? "Importing…" : "Import conversation"}
      </button>

      {result && (
        <div className="rounded border border-gray-200 bg-gray-50 p-3 text-sm">
          {result.declined ? (
            <p className="text-amber-700">Declined at intake — out-of-scope curriculum (e.g. Matric/SSC).</p>
          ) : (
            <>
              <p className="font-medium text-gray-900">
                {result.tutor ? `Tutor ${result.activated ? "activated" : "saved as pending"}` : "Parent request created"}
              </p>
              {result.missingFields && result.missingFields.length > 0 && (
                <p className="mt-1 text-amber-700">Missing: {result.missingFields.join(", ")}</p>
              )}
              {record?.internalNote && <p className="mt-1 text-gray-600">{record.internalNote}</p>}
              {recordHref && (
                <a className="mt-2 inline-block text-blue-700 underline" href={recordHref}>
                  View record →
                </a>
              )}
            </>
          )}
        </div>
      )}
    </form>
  );
}
