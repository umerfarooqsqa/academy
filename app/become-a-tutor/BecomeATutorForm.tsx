"use client";

import { useState } from "react";
import { AVAILABILITY_TAGS } from "@/lib/messages";
import { SUBJECT_GROUPS, SUBJECT_GROUP_LABELS, type SubjectGroup } from "@/lib/subjectGroups";
import { card, input, label, btnPrimary, btnSecondary, badge } from "@/app/components/ui";

export default function BecomeATutorForm({ zoneNames }: { zoneNames: string[] }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ declined: boolean; activated?: boolean; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    whatsappId: "",
    name: "",
    area: zoneNames[0] ?? "",
    subjects: "",
    subjectGroup: "other",
    curriculum: "",
    qualification: "",
    availability: [] as string[],
    expectedFee: "",
  });
  const [grades, setGrades] = useState<{ subject: string; grade: string }[]>([{ subject: "", grade: "" }]);
  const [cnic, setCnic] = useState<File | null>(null);
  const [marksheets, setMarksheets] = useState<File[]>([]);

  function toggleAvailability(tag: string) {
    setForm((f) => ({
      ...f,
      availability: f.availability.includes(tag) ? f.availability.filter((t) => t !== tag) : [...f.availability, tag],
    }));
  }

  function updateGrade(i: number, field: "subject" | "grade", value: string) {
    setGrades((g) => g.map((row, idx) => (idx === i ? { ...row, [field]: value } : row)));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);

    const gradesBySubject: Record<string, string> = {};
    for (const row of grades) {
      if (row.subject.trim() && row.grade.trim()) gradesBySubject[row.subject.trim()] = row.grade.trim();
    }

    const body = new FormData();
    body.append("whatsappId", form.whatsappId);
    body.append("name", form.name);
    body.append("area", form.area);
    body.append("subjects", form.subjects);
    body.append("subjectGroup", form.subjectGroup);
    body.append("curriculum", form.curriculum);
    body.append("qualification", form.qualification);
    body.append("gradesBySubject", JSON.stringify(gradesBySubject));
    for (const tag of form.availability) body.append("availability", tag);
    if (form.expectedFee) body.append("expectedFee", form.expectedFee);
    if (cnic) body.append("cnic", cnic);
    for (const file of marksheets) body.append("marksheets", file);

    const res = await fetch("/api/public/tutor-apply", { method: "POST", body });
    const resBody = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(resBody.error ?? "Something went wrong — please try again.");
      return;
    }
    setResult(resBody);
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
        <label className={label}>Full name</label>
        <input className={input} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </div>
      <div>
        <label className={label}>Your WhatsApp number</label>
        <input className={input} required value={form.whatsappId} onChange={(e) => setForm({ ...form, whatsappId: e.target.value })} />
      </div>
      <div>
        <label className={label}>Area you're based in</label>
        <select className={input} required value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })}>
          {zoneNames.length === 0 && <option value="">No areas configured yet</option>}
          {zoneNames.map((z) => (
            <option key={z} value={z}>
              {z}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={label}>Qualification</label>
        <input className={input} required value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} />
      </div>
      <div className="sm:col-span-2">
        <label className={label}>Subject(s) you teach (comma-separated)</label>
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
        <label className={label}>Expected fee, PKR/month (optional)</label>
        <input className={input} value={form.expectedFee} onChange={(e) => setForm({ ...form, expectedFee: e.target.value })} />
      </div>

      <div className="sm:col-span-2">
        <label className={label}>Your grades in the subjects you teach</label>
        <div className="flex flex-col gap-1.5">
          {grades.map((row, i) => (
            <div key={i} className="flex gap-1.5">
              <input className={input} placeholder="Subject (e.g. Biology)" value={row.subject} onChange={(e) => updateGrade(i, "subject", e.target.value)} />
              <input className={input} placeholder="Grade (e.g. A-)" value={row.grade} onChange={(e) => updateGrade(i, "grade", e.target.value)} />
            </div>
          ))}
          <button type="button" className={btnSecondary} onClick={() => setGrades((g) => [...g, { subject: "", grade: "" }])}>
            Add subject
          </button>
        </div>
      </div>

      <div className="sm:col-span-2">
        <label className={label}>When are you generally available?</label>
        <div className="flex flex-wrap gap-2">
          {AVAILABILITY_TAGS.map((tag) => (
            <button key={tag} type="button" onClick={() => toggleAvailability(tag)} className={form.availability.includes(tag) ? badge("blue") : badge("gray")}>
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={label}>CNIC photo (recommended — needed to activate your profile)</label>
        <input className={input} type="file" accept="image/*" onChange={(e) => setCnic(e.target.files?.[0] ?? null)} />
      </div>
      <div>
        <label className={label}>Marksheet/transcript photo(s), optional</label>
        <input className={input} type="file" accept="image/*" multiple onChange={(e) => setMarksheets(Array.from(e.target.files ?? []))} />
      </div>

      {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
      <div className="sm:col-span-2">
        <button className={btnPrimary} disabled={busy} type="submit">
          {busy ? "Submitting…" : "Register"}
        </button>
      </div>
    </form>
  );
}
