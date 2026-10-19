"use client";

// Admin multi-select for categories (2026-10-19 — tutors and parent requests
// can have several). Used on /tutors/new, /tutors/[id] and /parents/new.

import { SUBJECT_GROUPS, SUBJECT_GROUP_LABELS } from "@/lib/subjectGroups";

export default function CategoryPicker({ value, onChange }: { value: string[]; onChange: (groups: string[]) => void }) {
  const toggle = (g: string) => onChange(value.includes(g) ? value.filter((x) => x !== g) : [...value, g]);
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
      {SUBJECT_GROUPS.map((g) => (
        <label key={g} className="flex items-center gap-1.5 text-sm text-gray-800">
          <input type="checkbox" checked={value.includes(g)} onChange={() => toggle(g)} />
          {SUBJECT_GROUP_LABELS[g]}
        </label>
      ))}
    </div>
  );
}
