"use client";

// /heatmap — CLAUDE.md 6.11, Section 7: tutor density heat map, filterable by
// subjectGroup and tier. 2026-10-14: students (parent requests) added as a
// second layer, with an option to show only students who still need a tutor
// (lib/analytics/studentDensity.ts). Zone circles are centroids + counts.
// Admins (only) can also turn on exact-location dots for everyone who shared
// their location (GET /api/admin/exact-locations).

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { SUBJECT_GROUPS, SUBJECT_GROUP_LABELS, type SubjectGroup } from "@/lib/subjectGroups";
import { pageTitle, card, input, label } from "@/app/components/ui";
import type { DensityZone } from "./LeafletMap";
import type { ExactPoint } from "@/lib/analytics/exactLocations";

const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => <div className="flex h-[500px] items-center justify-center text-sm text-gray-400">Loading map…</div>,
});

type Layer = "both" | "tutors" | "students";
type TutorZone = { zone: string; latitude: number; longitude: number; tutorCount: number };
type StudentZone = { zone: string; latitude: number; longitude: number; studentCount: number };

export default function HeatmapClient({ isAdmin }: { isAdmin: boolean }) {
  const [layer, setLayer] = useState<Layer>("both");
  const [subjectGroup, setSubjectGroup] = useState("");
  const [tier, setTier] = useState("");
  const [needsTutorOnly, setNeedsTutorOnly] = useState(true);
  const [tutorZones, setTutorZones] = useState<TutorZone[]>([]);
  const [studentZones, setStudentZones] = useState<StudentZone[]>([]);
  const [unzoned, setUnzoned] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showExact, setShowExact] = useState(isAdmin);
  const [points, setPoints] = useState<ExactPoint[]>([]);

  const showTutors = layer !== "students";
  const showStudents = layer !== "tutors";

  useEffect(() => {
    const tutorParams = new URLSearchParams();
    if (subjectGroup) tutorParams.set("subjectGroup", subjectGroup);
    if (tier) tutorParams.set("tier", tier);
    const studentParams = new URLSearchParams();
    if (subjectGroup) studentParams.set("subjectGroup", subjectGroup);
    if (needsTutorOnly) studentParams.set("needsTutor", "1");

    setLoading(true);
    Promise.all([
      fetch(`/api/zones/tutor-density?${tutorParams.toString()}`).then((r) => r.json()),
      fetch(`/api/zones/student-density?${studentParams.toString()}`).then((r) => r.json()),
    ])
      .then(([tutors, students]) => {
        setTutorZones(tutors.zones ?? []);
        setStudentZones(students.zones ?? []);
        setUnzoned(students.unzoned ?? 0);
      })
      .finally(() => setLoading(false));
  }, [subjectGroup, tier, needsTutorOnly]);

  // Admin-only exact dots (the API refuses non-admins regardless).
  useEffect(() => {
    if (!isAdmin || !showExact) {
      setPoints([]);
      return;
    }
    const params = new URLSearchParams();
    if (subjectGroup) params.set("subjectGroup", subjectGroup);
    if (tier) params.set("tier", tier);
    if (needsTutorOnly) params.set("needsTutor", "1");
    fetch(`/api/admin/exact-locations?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : { points: [] }))
      .then((body) => setPoints(body.points ?? []));
  }, [isAdmin, showExact, subjectGroup, tier, needsTutorOnly]);

  const shownPoints = points.filter((p) => (p.kind === "tutor" ? showTutors : showStudents));

  const studentsByZone = new Map(studentZones.map((z) => [z.zone, z.studentCount]));
  const zones: DensityZone[] = (tutorZones.length > 0 ? tutorZones : studentZones).map((z) => ({
    zone: z.zone,
    latitude: z.latitude,
    longitude: z.longitude,
    tutorCount: showTutors ? (tutorZones.find((t) => t.zone === z.zone)?.tutorCount ?? 0) : undefined,
    studentCount: showStudents ? (studentsByZone.get(z.zone) ?? 0) : undefined,
  }));

  const totalTutors = tutorZones.reduce((sum, z) => sum + z.tutorCount, 0);
  const totalStudents = studentZones.reduce((sum, z) => sum + z.studentCount, 0) + unzoned;
  const studentWord = needsTutorOnly ? "student(s) still needing a tutor" : "student(s)";

  return (
    <main>
      <h1 className={pageTitle}>Tutor &amp; student heat map</h1>
      <p className="mt-1 text-sm text-gray-500">
        Where tutor supply and student demand are. Lots of students but few tutors → recruit tutors there; strong
        tutor supply but few students → point parent-acquisition ad spend there (6.10).
      </p>

      <div className={`${card} mt-4 flex flex-wrap items-end gap-3`}>
        <div>
          <label className={label}>Show</label>
          <select className={input} value={layer} onChange={(e) => setLayer(e.target.value as Layer)}>
            <option value="both">Tutors and students</option>
            <option value="tutors">Tutors only</option>
            <option value="students">Students only</option>
          </select>
        </div>
        <div>
          <label className={label}>Subject group</label>
          <select className={input} value={subjectGroup} onChange={(e) => setSubjectGroup(e.target.value)}>
            <option value="">All</option>
            {SUBJECT_GROUPS.map((g) => (
              <option key={g} value={g}>
                {SUBJECT_GROUP_LABELS[g as SubjectGroup]}
              </option>
            ))}
          </select>
        </div>
        {showTutors && (
          <div>
            <label className={label}>Tutor tier</label>
            <select className={input} value={tier} onChange={(e) => setTier(e.target.value)}>
              <option value="">All</option>
              <option value="free">Free</option>
              <option value="premium">Premium</option>
            </select>
          </div>
        )}
        {showStudents && (
          <label className="flex items-center gap-2 pb-2 text-sm text-gray-700">
            <input type="checkbox" checked={needsTutorOnly} onChange={(e) => setNeedsTutorOnly(e.target.checked)} />
            Only students who still need a tutor
          </label>
        )}
        {isAdmin && (
          <label className="flex items-center gap-2 pb-2 text-sm text-gray-700">
            <input type="checkbox" checked={showExact} onChange={(e) => setShowExact(e.target.checked)} />
            Exact locations <span className="text-xs text-gray-400">(admin only)</span>
          </label>
        )}
        <div className="pb-2 text-sm text-gray-500">
          {loading
            ? "Loading…"
            : [showTutors ? `${totalTutors} active tutor(s)` : null, showStudents ? `${totalStudents} ${studentWord}` : null]
                .filter(Boolean)
                .join(" · ")}
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
        <LeafletMap zones={zones} points={shownPoints} studentLabel={needsTutorOnly ? "student needing a tutor" : "student"} />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-gray-600">
        {showTutors && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full bg-blue-600/70" /> Tutors (active)
          </span>
        )}
        {showStudents && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full border-2 border-rose-600" />{" "}
            {needsTutorOnly ? "Students still needing a tutor" : "Students (all requests)"}
          </span>
        )}
        {isAdmin && showExact && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full border border-white bg-gray-800 ring-1 ring-gray-800" /> Exact locations:{" "}
            {shownPoints.filter((p) => p.kind === "student").length} student(s), {shownPoints.filter((p) => p.kind === "tutor").length} tutor(s) — only people who
            tapped &ldquo;Share my location&rdquo; have one
          </span>
        )}
        {showStudents && unzoned > 0 && (
          <span className="text-amber-700">
            {unzoned} {studentWord} in areas not on the map (typed area that isn&apos;t a zone — fix on /parents or add the zone)
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[...zones]
          .sort((a, b) => (b.studentCount ?? 0) + (b.tutorCount ?? 0) - ((a.studentCount ?? 0) + (a.tutorCount ?? 0)))
          .map((z) => {
            const t = z.tutorCount ?? 0;
            const s = z.studentCount ?? 0;
            return (
              <div key={z.zone} className={card}>
                <p className="text-xs font-medium text-gray-500">{z.zone}</p>
                <div className="mt-1 flex gap-4">
                  {showTutors && (
                    <p>
                      <span className="text-lg font-semibold text-blue-700">{t}</span>{" "}
                      <span className="text-xs text-gray-500">tutor{t === 1 ? "" : "s"}</span>
                    </p>
                  )}
                  {showStudents && (
                    <p>
                      <span className="text-lg font-semibold text-rose-600">{s}</span>{" "}
                      <span className="text-xs text-gray-500">student{s === 1 ? "" : "s"}</span>
                    </p>
                  )}
                </div>
                {showTutors && showStudents && s > t && <p className="mt-1 text-xs text-amber-700">More students than tutors — recruit here</p>}
              </div>
            );
          })}
      </div>
    </main>
  );
}
