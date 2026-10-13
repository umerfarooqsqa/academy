"use client";

import { useState } from "react";
import { AVAILABILITY_TAGS } from "@/lib/messages";
import { SUBJECT_GROUPS, SUBJECT_GROUP_LABELS, type SubjectGroup } from "@/lib/subjectGroups";
import { extractCoordsFromText } from "@/lib/geo/googleMapsLink";

// Local "sticker" styles, not the shared admin `ui.ts` (which is the compact
// internal-dashboard style). 2026-10-13: slightly bigger than the admin style
// for a public, mobile-first form, but not oversized — dialed back down from
// an initial pass that was too large (px-4 py-3 text-base).
const card = "rounded-3xl border-2 border-gray-900 bg-white p-6 shadow-[5px_5px_0_0_#1f2937] sm:p-8";
const btnPrimary =
  "rounded-full border-2 border-gray-900 bg-rose-500 px-6 py-3 text-base font-bold text-white shadow-[4px_4px_0_0_#1f2937] transition hover:-translate-y-0.5 active:translate-y-0 active:shadow-none disabled:opacity-50";
const label = "block text-sm font-bold text-gray-800 mb-1";
const input =
  "w-full rounded-lg border-2 border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 transition focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-rose-200";

function chip(active: boolean): string {
  return active
    ? "rounded-full border-2 border-gray-900 bg-teal-400 px-3 py-1.5 text-xs font-bold text-gray-900 shadow-[2px_2px_0_0_#1f2937] transition"
    : "rounded-full border-2 border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-gray-600 transition hover:border-gray-900";
}

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
    locationLink: "",
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
        <label className={label}>Or paste your Google Maps location link (optional)</label>
        <input
          className={input}
          placeholder="https://maps.google.com/?q=24.8938,67.0728"
          value={form.locationLink}
          onChange={(e) => setForm({ ...form, locationLink: e.target.value })}
        />
        {form.locationLink.trim() &&
          (extractCoordsFromText(form.locationLink) ? (
            <p className="mt-1 text-xs font-semibold text-teal-700">📍 Location detected — this will be used instead of the Area dropdown</p>
          ) : (
            <p className="mt-1 text-xs text-gray-500">Doesn&apos;t look like a Google Maps link — the Area dropdown above will be used instead</p>
          ))}
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
            <button key={tag} type="button" onClick={() => toggleAvailability(tag)} className={chip(form.availability.includes(tag))}>
              {tag}
            </button>
          ))}
        </div>
      </div>
      {error && <p className="text-sm font-semibold text-red-600 sm:col-span-2">{error}</p>}
      <div className="sm:col-span-2">
        <button className={btnPrimary} disabled={busy} type="submit">
          {busy ? "Submitting…" : "Find my tutor"}
        </button>
      </div>
    </form>
  );
}
