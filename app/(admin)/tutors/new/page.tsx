"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AVAILABILITY_TAGS } from "@/lib/messages";
import CategoryPicker from "@/app/components/CategoryPicker";
import { card, input, label, btnPrimary, pageTitle, badge } from "@/app/components/ui";

export default function NewTutorPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    whatsappId: "",
    name: "",
    qualification: "",
    subjects: "",
    subjectGroups: ["other"] as string[],
    curriculum: "",
    area: "",
    availability: [] as string[],
    expectedFee: "",
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
    const res = await fetch("/api/tutors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        subjects: form.subjects.split(",").map((s) => s.trim()).filter(Boolean),
        expectedFee: form.expectedFee ? Number(form.expectedFee) : null,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to create tutor");
      return;
    }
    const { tutor } = await res.json();
    router.push(`/tutors/${tutor.id}`);
  }

  return (
    <main className="max-w-2xl">
      <h1 className={pageTitle}>Add tutor</h1>
      <p className="mt-1 text-sm text-gray-500">Manual dashboard entry — a fallback to the WhatsApp intake flow.</p>
      <form onSubmit={submit} className={`${card} mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2`}>
        <div>
          <label className={label}>WhatsApp ID</label>
          <input className={input} required value={form.whatsappId} onChange={(e) => setForm({ ...form, whatsappId: e.target.value })} />
        </div>
        <div>
          <label className={label}>Name</label>
          <input className={input} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className={label}>Qualification</label>
          <input className={input} required value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} />
        </div>
        <div>
          <label className={label}>Subjects (comma-separated)</label>
          <input className={input} value={form.subjects} onChange={(e) => setForm({ ...form, subjects: e.target.value })} />
        </div>
        <div>
          <label className={label}>Categories</label>
          <CategoryPicker value={form.subjectGroups} onChange={(subjectGroups) => setForm({ ...form, subjectGroups })} />
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
          <label className={label}>Expected fee (PKR/month, optional)</label>
          <input className={input} value={form.expectedFee} onChange={(e) => setForm({ ...form, expectedFee: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <label className={label}>Availability</label>
          <div className="flex flex-wrap gap-2">
            {AVAILABILITY_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleAvailability(tag)}
                className={form.availability.includes(tag) ? badge("blue") : badge("gray")}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
        {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
        <div className="sm:col-span-2">
          <button className={btnPrimary} disabled={busy} type="submit">
            {busy ? "Creating…" : "Create tutor (active)"}
          </button>
        </div>
      </form>
    </main>
  );
}
