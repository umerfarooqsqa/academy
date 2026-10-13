"use client";

import { useState } from "react";
import { AVAILABILITY_TAGS } from "@/lib/messages";
import { SUBJECT_GROUPS, SUBJECT_GROUP_LABELS, type SubjectGroup } from "@/lib/subjectGroups";
import { card, input, label, btnPrimary, badge } from "@/app/components/ui";

export default function FindATutorForm({ zoneNames }: { zoneNames: string[] }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ declined: boolean; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    whatsappId: "",
    studentInfo: "",
    subjects: "",
    subjectGroup: "other",
    curriculum: "",
    area: zoneNames[0] ?? "",
    deliveryMode: "in_person",
    budget: "",
    availability: [] as string[],
  });

  function toggleAvailability(tag: string) {
    setForm((f) => ({
      ...f,
      availability: f.availability.includes(tag) ? f.availability.filter((t) => t !== tag) : [...f.availability, tag],
    }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);
    const res = await fetch("/api/public/parent-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        subjects: form.subjects.split(",").map((s) => s.trim()).filter(Boolean),
        budget: form.budget || null,
      }),
    });
    const body = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(body.error ?? "Something went wrong — please try again.");
      return;
    }
    setResult(body);
  }

  if (result) {
    return (
      <div className={`${card} mt-6`}>
        <p className={result.declined ? "text-amber-700" : "text-gray-800"}>{result.message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={`${card} mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2`}>
      <div>
        <label className={label}>Your WhatsApp number</label>
        <input className={input} required value={form.whatsappId} onChange={(e) => setForm({ ...form, whatsappId: e.target.value })} />
      </div>
      <div>
        <label className={label}>Area</label>
        <select className={input} required value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })}>
          {zoneNames.length === 0 && <option value="">No areas configured yet</option>}
          {zoneNames.map((z) => (
            <option key={z} value={z}>
              {z}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className={label}>Subject(s) (comma-separated)</label>
        <input className={input} required placeholder="Chemistry, Biology" value={form.subjects} onChange={(e) => setForm({ ...form, subjects: e.target.value })} />
      </div>
      <div>
        <label className={label}>Category</label>
        <select className={input} value={form.subjectGroup} onChange={(e) => setForm({ ...form, subjectGroup: e.target.value })}>
          {SUBJECT_GROUPS.map((g) => (
            <option key={g} value={g}>
              {SUBJECT_GROUP_LABELS[g as SubjectGroup]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={label}>Curriculum / level</label>
        <input className={input} required placeholder="Cambridge A-levels, FSc Pre-Medical, etc." value={form.curriculum} onChange={(e) => setForm({ ...form, curriculum: e.target.value })} />
      </div>
      <div>
        <label className={label}>In-person or online?</label>
        <select className={input} value={form.deliveryMode} onChange={(e) => setForm({ ...form, deliveryMode: e.target.value })}>
          <option value="in_person">In-person</option>
          <option value="online">Online</option>
          <option value="both">Either</option>
        </select>
      </div>
      <div>
        <label className={label}>Monthly budget in PKR (optional)</label>
        <input className={input} value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
      </div>
      <div className="sm:col-span-2">
        <label className={label}>About the student (optional)</label>
        <textarea className={`${input} min-h-20`} value={form.studentInfo} onChange={(e) => setForm({ ...form, studentInfo: e.target.value })} />
      </div>
      <div className="sm:col-span-2">
        <label className={label}>When works for you?</label>
        <div className="flex flex-wrap gap-2">
          {AVAILABILITY_TAGS.map((tag) => (
            <button key={tag} type="button" onClick={() => toggleAvailability(tag)} className={form.availability.includes(tag) ? badge("blue") : badge("gray")}>
              {tag}
            </button>
          ))}
        </div>
      </div>
      {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
      <div className="sm:col-span-2">
        <button className={btnPrimary} disabled={busy} type="submit">
          {busy ? "Submitting…" : "Find my tutor"}
        </button>
      </div>
    </form>
  );
}
