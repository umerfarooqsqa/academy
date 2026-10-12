"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SUBJECT_GROUPS, SUBJECT_GROUP_LABELS, type SubjectGroup } from "@/lib/subjectGroups";
import { card, input, label, btnPrimary, pageTitle } from "@/app/components/ui";

export default function NewParentPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    whatsappId: "",
    studentInfo: "",
    subjects: "",
    subjectGroup: "other",
    curriculum: "",
    area: "",
    budget: "",
    deliveryMode: "in_person",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/parents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        subjects: form.subjects.split(",").map((s) => s.trim()).filter(Boolean),
        budget: form.budget ? Number(form.budget) : null,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to create request");
      return;
    }
    const { parent } = await res.json();
    router.push(`/parents/${parent.id}`);
  }

  return (
    <main className="max-w-2xl">
      <h1 className={pageTitle}>Add parent request</h1>
      <p className="mt-1 text-sm text-gray-500">
        Manual dashboard entry — creates the request and runs matching immediately.
      </p>
      <form onSubmit={submit} className={`${card} mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2`}>
        <div>
          <label className={label}>WhatsApp ID</label>
          <input className={input} required value={form.whatsappId} onChange={(e) => setForm({ ...form, whatsappId: e.target.value })} />
        </div>
        <div>
          <label className={label}>Student info (optional)</label>
          <input className={input} value={form.studentInfo} onChange={(e) => setForm({ ...form, studentInfo: e.target.value })} />
        </div>
        <div>
          <label className={label}>Subjects (comma-separated)</label>
          <input className={input} value={form.subjects} onChange={(e) => setForm({ ...form, subjects: e.target.value })} />
        </div>
        <div>
          <label className={label}>Subject group</label>
          <select className={input} value={form.subjectGroup} onChange={(e) => setForm({ ...form, subjectGroup: e.target.value })}>
            {SUBJECT_GROUPS.map((g) => (
              <option key={g} value={g}>
                {SUBJECT_GROUP_LABELS[g as SubjectGroup]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Curriculum</label>
          <input className={input} required value={form.curriculum} onChange={(e) => setForm({ ...form, curriculum: e.target.value })} />
        </div>
        <div>
          <label className={label}>Area (must match an AreaZone name)</label>
          <input className={input} required value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} />
        </div>
        <div>
          <label className={label}>Budget (PKR/month, optional — frequently null)</label>
          <input className={input} value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
        </div>
        <div>
          <label className={label}>Delivery mode</label>
          <select className={input} value={form.deliveryMode} onChange={(e) => setForm({ ...form, deliveryMode: e.target.value })}>
            <option value="in_person">in_person</option>
            <option value="online">online</option>
            <option value="both">both</option>
          </select>
        </div>
        {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
        <div className="sm:col-span-2">
          <button className={btnPrimary} disabled={busy} type="submit">
            {busy ? "Creating…" : "Create request & run matching"}
          </button>
        </div>
      </form>
    </main>
  );
}
