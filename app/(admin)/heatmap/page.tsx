"use client";

// /heatmap — CLAUDE.md 6.11, Section 7: tutor density heat map, filterable by
// subjectGroup and tier. Zone centroids + counts only — no per-tutor pins.

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { SUBJECT_GROUPS, SUBJECT_GROUP_LABELS, type SubjectGroup } from "@/lib/subjectGroups";
import { pageTitle, card, input, label } from "@/app/components/ui";
import type { DensityZone } from "./LeafletMap";

const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => <div className="flex h-[500px] items-center justify-center text-sm text-gray-400">Loading map…</div>,
});

export default function HeatmapPage() {
  const [subjectGroup, setSubjectGroup] = useState("");
  const [tier, setTier] = useState("");
  const [zones, setZones] = useState<DensityZone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (subjectGroup) params.set("subjectGroup", subjectGroup);
    if (tier) params.set("tier", tier);
    setLoading(true);
    fetch(`/api/zones/tutor-density?${params.toString()}`)
      .then((r) => r.json())
      .then((body) => setZones(body.zones ?? []))
      .finally(() => setLoading(false));
  }, [subjectGroup, tier]);

  const totalTutors = zones.reduce((sum, z) => sum + z.tutorCount, 0);

  return (
    <main>
      <h1 className={pageTitle}>Tutor density heat map</h1>
      <p className="mt-1 text-sm text-gray-500">
        Where tutor supply is strongest — a zone with strong supply but few matched parent
        requests is a signal for where to point parent-acquisition ad spend (6.10).
      </p>

      <div className={`${card} mt-4 flex flex-wrap items-end gap-3`}>
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
        <div>
          <label className={label}>Tier</label>
          <select className={input} value={tier} onChange={(e) => setTier(e.target.value)}>
            <option value="">All</option>
            <option value="free">Free</option>
            <option value="premium">Premium</option>
          </select>
        </div>
        <div className="text-sm text-gray-500">{loading ? "Loading…" : `${totalTutors} active tutor(s) shown`}</div>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
        <LeafletMap zones={zones} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[...zones].sort((a, b) => b.tutorCount - a.tutorCount).map((z) => (
          <div key={z.zone} className={card}>
            <p className="text-xs font-medium text-gray-500">{z.zone}</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">{z.tutorCount}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
