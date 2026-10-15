"use client";

// "Public profile" card on /tutors/[id] (2026-10-15 — Featured Tutors,
// operator decision: admin fills in profiles; shown on the website only when
// Featured AND verified). Saves through PATCH /api/tutors/[id]; the photo
// goes to the public tutor-photos bucket via POST /api/tutors/[id]/photo.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { card, input, label, btnPrimary, btnSecondary, badge } from "@/app/components/ui";

interface Experience {
  title: string;
  place: string;
  period: string;
  description: string;
}
interface Education {
  degree: string;
  institution: string;
  year: string;
}

export interface PublicProfileFields {
  id: string;
  status: string;
  cnicImageUrl: string | null;
  cnicVerifiedAt: Date | null;
  marksheetImageUrls: string[];
  featured: boolean;
  gradesVerifiedAt: Date | null;
  profilePhotoUrl: string | null;
  profileHeadline: string | null;
  profileBio: string | null;
  yearsExperience: number | null;
  profileExperience: unknown;
  profileEducation: unknown;
}

const asList = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

export default function PublicProfileCard({ tutor }: { tutor: PublicProfileFields }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [headline, setHeadline] = useState(tutor.profileHeadline ?? "");
  const [bio, setBio] = useState(tutor.profileBio ?? "");
  const [years, setYears] = useState(tutor.yearsExperience?.toString() ?? "");
  const [experience, setExperience] = useState<Experience[]>(asList<Experience>(tutor.profileExperience));
  const [education, setEducation] = useState<Education[]>(asList<Education>(tutor.profileEducation));

  const verified = tutor.status === "active" && Boolean(tutor.cnicImageUrl) && Boolean(tutor.cnicVerifiedAt);

  async function patch(body: Record<string, unknown>): Promise<boolean> {
    setBusy(true);
    setError(null);
    setSaved(false);
    const res = await fetch(`/api/tutors/${tutor.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Could not save");
      return false;
    }
    router.refresh();
    return true;
  }

  async function saveProfile() {
    const ok = await patch({
      profileHeadline: headline,
      profileBio: bio,
      yearsExperience: years.trim() === "" ? null : Number(years),
      profileExperience: experience,
      profileEducation: education,
    });
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  async function uploadPhoto(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    const fd = new FormData();
    fd.append("photo", file);
    const res = await fetch(`/api/tutors/${tutor.id}/photo`, { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) setError(data.error ?? "Upload failed");
    else router.refresh();
  }

  async function removePhoto() {
    setBusy(true);
    await fetch(`/api/tutors/${tutor.id}/photo`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className={card}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-gray-900">Public profile (Our tutors page)</h2>
        {tutor.featured ? <span className={badge("green")}>Featured</span> : <span className={badge()}>Not featured</span>}
      </div>
      <p className="mt-1 text-xs text-gray-500">
        Shown on the website as first name + last initial, with the subjects, grades and area from the profile above. Never the
        phone number, fee, CNIC or documents. <strong>Get the tutor&apos;s OK before featuring them.</strong>
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {tutor.featured ? (
          <>
            <button className={btnSecondary} disabled={busy} onClick={() => patch({ featured: false })}>
              Remove from website
            </button>
            <a href={`/our-tutors/${tutor.id}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
              view public profile ↗
            </a>
          </>
        ) : (
          <button className={btnPrimary} disabled={busy || !verified} onClick={() => patch({ featured: true })}>
            ★ Feature on website
          </button>
        )}
        {!verified && !tutor.featured && <span className="text-xs text-amber-700">Needs: active status + CNIC marked verified</span>}
        {tutor.featured && !verified && (
          <span className="text-xs text-amber-700">Hidden from the website until active + CNIC verified again</span>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className="text-xs font-medium text-gray-500">Grades:</span>
        {tutor.gradesVerifiedAt ? (
          <>
            <span className={badge("blue")}>Grades verified</span>
            <button className="text-xs text-gray-500 hover:underline" disabled={busy} onClick={() => patch({ gradesVerified: false })}>
              Unmark
            </button>
          </>
        ) : (
          <button
            className={btnSecondary}
            disabled={busy || tutor.marksheetImageUrls.length === 0}
            onClick={() => patch({ gradesVerified: true })}
            title={tutor.marksheetImageUrls.length === 0 ? "No marksheet on file" : "You checked the marksheet against the reported grades"}
          >
            ✓ Mark grades verified
          </button>
        )}
      </div>

      <div className="mt-4">
        <label className={label}>Photo (JPEG/PNG/WebP, max 2 MB — public)</label>
        <div className="flex items-center gap-3">
          {tutor.profilePhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tutor.profilePhotoUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
          ) : (
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-xs text-gray-400">none</span>
          )}
          <label className={`${btnSecondary} cursor-pointer`}>
            {tutor.profilePhotoUrl ? "Replace" : "Upload"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={busy}
              onChange={(e) => uploadPhoto(e.target.files?.[0])}
            />
          </label>
          {tutor.profilePhotoUrl && (
            <button className="text-xs text-gray-500 hover:underline" disabled={busy} onClick={removePhoto}>
              Remove
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 space-y-3">
        <div>
          <label className={label}>Headline (max 120)</label>
          <input
            className={input}
            maxLength={120}
            placeholder="e.g. MBBS student · A* in A-level Biology"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
          />
        </div>
        <div>
          <label className={label}>About</label>
          <textarea className={`${input} h-24`} maxLength={2000} value={bio} onChange={(e) => setBio(e.target.value)} />
        </div>
        <div>
          <label className={label}>Years of teaching experience</label>
          <input className={`${input} w-24`} inputMode="numeric" value={years} onChange={(e) => setYears(e.target.value)} />
        </div>

        <div>
          <label className={label}>Experience</label>
          <div className="space-y-2">
            {experience.map((e, i) => (
              <div key={i} className="space-y-1 rounded border border-gray-200 p-2">
                <input
                  className={input}
                  placeholder="Title, e.g. Chemistry tutor"
                  value={e.title}
                  onChange={(ev) => setExperience(experience.map((x, j) => (j === i ? { ...x, title: ev.target.value } : x)))}
                />
                <div className="flex gap-1">
                  <input
                    className={input}
                    placeholder="Where, e.g. Home tuition"
                    value={e.place}
                    onChange={(ev) => setExperience(experience.map((x, j) => (j === i ? { ...x, place: ev.target.value } : x)))}
                  />
                  <input
                    className={input}
                    placeholder="When, e.g. 2022 – now"
                    value={e.period}
                    onChange={(ev) => setExperience(experience.map((x, j) => (j === i ? { ...x, period: ev.target.value } : x)))}
                  />
                </div>
                <textarea
                  className={`${input} h-14`}
                  placeholder="Short description (optional)"
                  value={e.description}
                  onChange={(ev) => setExperience(experience.map((x, j) => (j === i ? { ...x, description: ev.target.value } : x)))}
                />
                <button className="text-xs text-gray-500 hover:underline" onClick={() => setExperience(experience.filter((_, j) => j !== i))}>
                  Remove
                </button>
              </div>
            ))}
            {experience.length < 10 && (
              <button className={btnSecondary} onClick={() => setExperience([...experience, { title: "", place: "", period: "", description: "" }])}>
                Add experience
              </button>
            )}
          </div>
        </div>

        <div>
          <label className={label}>Education</label>
          <div className="space-y-2">
            {education.map((e, i) => (
              <div key={i} className="space-y-1 rounded border border-gray-200 p-2">
                <input
                  className={input}
                  placeholder="Degree, e.g. A-levels (Pre-Medical)"
                  value={e.degree}
                  onChange={(ev) => setEducation(education.map((x, j) => (j === i ? { ...x, degree: ev.target.value } : x)))}
                />
                <div className="flex gap-1">
                  <input
                    className={input}
                    placeholder="Institution"
                    value={e.institution}
                    onChange={(ev) => setEducation(education.map((x, j) => (j === i ? { ...x, institution: ev.target.value } : x)))}
                  />
                  <input
                    className={`${input} w-28`}
                    placeholder="Year"
                    value={e.year}
                    onChange={(ev) => setEducation(education.map((x, j) => (j === i ? { ...x, year: ev.target.value } : x)))}
                  />
                </div>
                <button className="text-xs text-gray-500 hover:underline" onClick={() => setEducation(education.filter((_, j) => j !== i))}>
                  Remove
                </button>
              </div>
            ))}
            {education.length < 10 && (
              <button className={btnSecondary} onClick={() => setEducation([...education, { degree: "", institution: "", year: "" }])}>
                Add education
              </button>
            )}
          </div>
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}
        <button className={btnPrimary} disabled={busy} onClick={saveProfile}>
          {busy ? "Saving…" : saved ? "Saved!" : "Save public profile"}
        </button>
      </div>
    </div>
  );
}
