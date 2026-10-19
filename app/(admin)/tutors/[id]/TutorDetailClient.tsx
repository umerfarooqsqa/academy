"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AVAILABILITY_TAGS } from "@/lib/messages";
import { groupsOf } from "@/lib/subjectGroups";
import CategoryPicker from "@/app/components/CategoryPicker";
import { card, input, label, btnPrimary, btnSecondary, btnDanger, badge } from "@/app/components/ui";
import PublicProfileCard, { type PublicProfileFields } from "./PublicProfileCard";

interface TutorDetailProps {
  tutor: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    qualification: string;
    subjects: string[];
    subjectGroup: string;
    subjectGroups: string[];
    curriculum: string;
    gradesBySubject: unknown;
    cnicImageUrl: string | null;
    cnicVerifiedAt: Date | null;
    marksheetImageUrls: string[];
    gender: string | null;
    schoolName: string | null;
    area: string;
    availability: string[];
    expectedFee: number | null;
    deliveryMode: string;
    radiusOverrideKm: number | null;
    status: string;
    internalNote: string | null;
    tier: string;
  } & PublicProfileFields;
  subscriptions: Array<{
    id: string;
    status: string;
    amount: number;
    paymentMethod: string | null;
    periodStart: string;
    periodEnd: string;
  }>;
}

function gradesToText(g: unknown): string {
  if (!g || typeof g !== "object") return "";
  return Object.entries(g as Record<string, string>)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
}

function textToGrades(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of text.split("\n")) {
    const [subject, grade] = line.split(":").map((s) => s.trim());
    if (subject && grade) out[subject] = grade;
  }
  return out;
}

export default function TutorDetailClient({ tutor, subscriptions }: TutorDetailProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: tutor.name,
    email: tutor.email ?? "",
    phone: tutor.phone ?? "",
    qualification: tutor.qualification,
    schoolName: tutor.schoolName ?? "",
    subjects: tutor.subjects.join(", "),
    subjectGroups: groupsOf(tutor),
    curriculum: tutor.curriculum,
    gradesBySubject: gradesToText(tutor.gradesBySubject),
    area: tutor.area,
    availability: tutor.availability,
    expectedFee: tutor.expectedFee?.toString() ?? "",
    deliveryMode: tutor.deliveryMode,
    radiusOverrideKm: tutor.radiusOverrideKm?.toString() ?? "",
    internalNote: tutor.internalNote ?? "",
    gender: tutor.gender ?? "",
  });
  const [subForm, setSubForm] = useState({
    amount: "3000",
    paymentMethod: "",
    periodStart: new Date().toISOString().slice(0, 10),
    periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  });

  function toggleAvailability(tag: string) {
    setForm((f) => ({
      ...f,
      availability: f.availability.includes(tag) ? f.availability.filter((t) => t !== tag) : [...f.availability, tag],
    }));
  }

  async function save() {
    setBusy(true);
    await fetch(`/api/tutors/${tutor.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        email: form.email || null,
        phone: form.phone || null,
        qualification: form.qualification,
        schoolName: form.schoolName.trim() || null,
        subjects: form.subjects.split(",").map((s) => s.trim()).filter(Boolean),
        subjectGroups: form.subjectGroups,
        curriculum: form.curriculum,
        gradesBySubject: textToGrades(form.gradesBySubject),
        area: form.area,
        availability: form.availability,
        expectedFee: form.expectedFee ? Number(form.expectedFee) : null,
        deliveryMode: form.deliveryMode,
        radiusOverrideKm: form.radiusOverrideKm ? Number(form.radiusOverrideKm) : null,
        internalNote: form.internalNote || null,
        gender: form.gender || null,
      }),
    });
    setBusy(false);
    router.refresh();
  }

  async function setStatus(status: string) {
    setBusy(true);
    await fetch(`/api/tutors/${tutor.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusy(false);
    router.refresh();
  }

  async function setCnicVerified(cnicVerified: boolean) {
    setBusy(true);
    await fetch(`/api/tutors/${tutor.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cnicVerified }),
    });
    setBusy(false);
    router.refresh();
  }

  async function createSubscription() {
    setBusy(true);
    await fetch("/api/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tutorId: tutor.id,
        amount: Number(subForm.amount),
        paymentMethod: subForm.paymentMethod || null,
        periodStart: subForm.periodStart,
        periodEnd: subForm.periodEnd,
      }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className={`${card} lg:col-span-2`}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Profile</h2>
          <div className="flex items-center gap-2">
            <span className={badge(tutor.tier === "premium" ? "blue" : "gray")}>{tutor.tier}</span>
            <span className={badge(tutor.status === "active" ? "green" : tutor.status === "pending" ? "amber" : "gray")}>
              {tutor.status}
            </span>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={label}>Name</label>
            <input className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className={label}>Area</label>
            <input className={input} value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} />
          </div>
          <div>
            <label className={label}>Email (optional)</label>
            <input className={input} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className={label}>Phone (optional)</label>
            <input className={input} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className={label}>Qualification</label>
            <input
              className={input}
              value={form.qualification}
              onChange={(e) => setForm({ ...form, qualification: e.target.value })}
            />
          </div>
          <div>
            <label className={label}>School / college studied at</label>
            <input className={input} value={form.schoolName} onChange={(e) => setForm({ ...form, schoolName: e.target.value })} />
          </div>
          <div>
            <label className={label}>Subjects (comma-separated)</label>
            <input
              className={input}
              value={form.subjects}
              onChange={(e) => setForm({ ...form, subjects: e.target.value })}
            />
          </div>
          <div>
            <label className={label}>Categories</label>
            <CategoryPicker value={form.subjectGroups} onChange={(subjectGroups) => setForm({ ...form, subjectGroups })} />
          </div>
          <div>
            <label className={label}>Curriculum</label>
            <input
              className={input}
              value={form.curriculum}
              onChange={(e) => setForm({ ...form, curriculum: e.target.value })}
            />
          </div>
          <div>
            <label className={label}>Expected fee (PKR/month, optional)</label>
            <input
              className={input}
              value={form.expectedFee}
              onChange={(e) => setForm({ ...form, expectedFee: e.target.value })}
            />
          </div>
          <div>
            <label className={label}>Delivery mode</label>
            <select
              className={input}
              value={form.deliveryMode}
              onChange={(e) => setForm({ ...form, deliveryMode: e.target.value })}
            >
              <option value="in_person">in_person</option>
              <option value="online">online</option>
              <option value="both">both</option>
            </select>
          </div>
          <div>
            <label className={label}>Gender (parents can ask for a female/male tutor)</label>
            <select className={input} value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
              <option value="">not recorded</option>
              <option value="female">female</option>
              <option value="male">male</option>
            </select>
          </div>
          {tutor.tier === "premium" && (
            <div>
              <label className={label}>Radius override (km, premium-only, 6.5)</label>
              <input
                className={input}
                value={form.radiusOverrideKm}
                onChange={(e) => setForm({ ...form, radiusOverrideKm: e.target.value })}
              />
            </div>
          )}
        </div>

        <div className="mt-3">
          <label className={label}>Self-reported grades (one per line, "Subject: Grade")</label>
          <textarea
            className={`${input} h-24`}
            value={form.gradesBySubject}
            onChange={(e) => setForm({ ...form, gradesBySubject: e.target.value })}
          />
        </div>

        <div className="mt-3">
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

        <div className="mt-3">
          <label className={label}>Internal note (operator-only, never shown to tutor/parent)</label>
          <input
            className={input}
            value={form.internalNote}
            onChange={(e) => setForm({ ...form, internalNote: e.target.value })}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button className={btnPrimary} disabled={busy} onClick={save}>
            Save changes
          </button>
          {tutor.status !== "active" && (
            <button className={btnSecondary} disabled={busy} onClick={() => setStatus("active")}>
              Activate
            </button>
          )}
          {tutor.status === "active" && (
            <button className={btnDanger} disabled={busy} onClick={() => setStatus("inactive")}>
              Deactivate
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className={card}>
          <h2 className="text-sm font-semibold text-gray-900">Verification documents (6.1 step 10)</h2>
          <p className="mt-1 text-xs text-gray-500">Glance-check only — never OCR'd or sent to an LLM. Stored privately; each link opens a copy that expires in 5 minutes.</p>
          <div className="mt-2 space-y-2">
            <div>
              <span className="text-xs font-medium text-gray-500">CNIC:</span>{" "}
              {tutor.cnicImageUrl ? (
                <>
                  <a href={`/api/tutor-documents?url=${encodeURIComponent(tutor.cnicImageUrl)}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                    view image
                  </a>
                  {/* Admin CNIC check — required for this tutor to count as
                      "verified" on the public site (lib/tutors/verified.ts). */}
                  <div className="mt-1.5 flex items-center gap-2">
                    {tutor.cnicVerifiedAt ? (
                      <>
                        <span className={badge("green")}>CNIC verified</span>
                        <button className="text-xs text-gray-500 hover:underline" disabled={busy} onClick={() => setCnicVerified(false)}>
                          Unmark
                        </button>
                      </>
                    ) : (
                      <button className={btnSecondary} disabled={busy} onClick={() => setCnicVerified(true)}>
                        ✓ Mark CNIC verified
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <span className="text-xs text-gray-400">not provided</span>
              )}
            </div>
            <div>
              <span className="text-xs font-medium text-gray-500">Marksheets:</span>{" "}
              {tutor.marksheetImageUrls.length > 0 ? (
                tutor.marksheetImageUrls.map((url, i) => (
                  <a key={url} href={`/api/tutor-documents?url=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" className="mr-2 text-xs text-blue-600 hover:underline">
                    #{i + 1}
                  </a>
                ))
              ) : (
                <span className="text-xs text-gray-400">not provided</span>
              )}
            </div>
          </div>
        </div>

        <PublicProfileCard tutor={tutor} />

        <div className={card}>
          <h2 className="text-sm font-semibold text-gray-900">Subscription (6.5 — manual, no gateway)</h2>
          <ul className="mt-2 space-y-1 text-xs text-gray-600">
            {subscriptions.length === 0 && <li className="text-gray-400">No subscriptions on file.</li>}
            {subscriptions.map((s) => (
              <li key={s.id} className="flex items-center justify-between">
                <span>
                  Rs {s.amount} · {s.periodStart.slice(0, 10)} → {s.periodEnd.slice(0, 10)}
                </span>
                <span className={badge(s.status === "active" ? "green" : "gray")}>{s.status}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
            <div>
              <label className={label}>Amount (PKR)</label>
              <input
                className={input}
                value={subForm.amount}
                onChange={(e) => setSubForm({ ...subForm, amount: e.target.value })}
              />
            </div>
            <div>
              <label className={label}>Payment method note</label>
              <input
                className={input}
                placeholder="e.g. JazzCash manual transfer"
                value={subForm.paymentMethod}
                onChange={(e) => setSubForm({ ...subForm, paymentMethod: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={label}>Period start</label>
                <input
                  type="date"
                  className={input}
                  value={subForm.periodStart}
                  onChange={(e) => setSubForm({ ...subForm, periodStart: e.target.value })}
                />
              </div>
              <div>
                <label className={label}>Period end</label>
                <input
                  type="date"
                  className={input}
                  value={subForm.periodEnd}
                  onChange={(e) => setSubForm({ ...subForm, periodEnd: e.target.value })}
                />
              </div>
            </div>
            <button className={`${btnPrimary} w-full`} disabled={busy} onClick={createSubscription}>
              Record payment / renew
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
