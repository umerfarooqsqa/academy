"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { card, table, th, td, input, label, btnPrimary, btnDanger, btnSecondary } from "@/app/components/ui";

interface Zone {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  maxKm: number;
}

export default function ZonesTable({ zones }: { zones: Zone[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<Zone>>({});
  const [newZone, setNewZone] = useState({ name: "", latitude: "", longitude: "", maxKm: "6" });
  const [error, setError] = useState<string | null>(null);

  function startEdit(z: Zone) {
    setEditingId(z.id);
    setEditDraft(z);
  }

  async function saveEdit() {
    if (!editingId) return;
    setBusy(true);
    await fetch(`/api/zones/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editDraft),
    });
    setBusy(false);
    setEditingId(null);
    router.refresh();
  }

  async function remove(id: string) {
    setBusy(true);
    await fetch(`/api/zones/${id}`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!newZone.name || !newZone.latitude || !newZone.longitude) {
      setError("name, latitude, longitude are required");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/zones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newZone.name,
        latitude: Number(newZone.latitude),
        longitude: Number(newZone.longitude),
        maxKm: Number(newZone.maxKm || 6),
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to create zone");
      return;
    }
    setNewZone({ name: "", latitude: "", longitude: "", maxKm: "6" });
    router.refresh();
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className={table}>
          <thead>
            <tr>
              <th className={th}>Name</th>
              <th className={th}>Latitude</th>
              <th className={th}>Longitude</th>
              <th className={th}>Max km (Tier B)</th>
              <th className={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {zones.map((z) =>
              editingId === z.id ? (
                <tr key={z.id}>
                  <td className={td}>
                    <input className={input} value={editDraft.name ?? ""} onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })} />
                  </td>
                  <td className={td}>
                    <input
                      className={input}
                      value={editDraft.latitude ?? ""}
                      onChange={(e) => setEditDraft({ ...editDraft, latitude: Number(e.target.value) })}
                    />
                  </td>
                  <td className={td}>
                    <input
                      className={input}
                      value={editDraft.longitude ?? ""}
                      onChange={(e) => setEditDraft({ ...editDraft, longitude: Number(e.target.value) })}
                    />
                  </td>
                  <td className={td}>
                    <input
                      className={input}
                      value={editDraft.maxKm ?? ""}
                      onChange={(e) => setEditDraft({ ...editDraft, maxKm: Number(e.target.value) })}
                    />
                  </td>
                  <td className={td}>
                    <div className="flex gap-1.5">
                      <button className={btnPrimary} disabled={busy} onClick={saveEdit}>
                        Save
                      </button>
                      <button className={btnSecondary} onClick={() => setEditingId(null)}>
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={z.id}>
                  <td className={`${td} font-medium text-gray-900`}>{z.name}</td>
                  <td className={td}>{z.latitude}</td>
                  <td className={td}>{z.longitude}</td>
                  <td className={td}>{z.maxKm} km</td>
                  <td className={td}>
                    <div className="flex gap-1.5">
                      <button className={btnSecondary} onClick={() => startEdit(z)}>
                        Edit
                      </button>
                      <button className={btnDanger} disabled={busy} onClick={() => remove(z.id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>

      <form onSubmit={create} className={`${card} mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5`}>
        <div>
          <label className={label}>Name</label>
          <input className={input} value={newZone.name} onChange={(e) => setNewZone({ ...newZone, name: e.target.value })} />
        </div>
        <div>
          <label className={label}>Latitude</label>
          <input className={input} value={newZone.latitude} onChange={(e) => setNewZone({ ...newZone, latitude: e.target.value })} />
        </div>
        <div>
          <label className={label}>Longitude</label>
          <input className={input} value={newZone.longitude} onChange={(e) => setNewZone({ ...newZone, longitude: e.target.value })} />
        </div>
        <div>
          <label className={label}>Max km</label>
          <input className={input} value={newZone.maxKm} onChange={(e) => setNewZone({ ...newZone, maxKm: e.target.value })} />
        </div>
        <div className="flex items-end">
          <button className={`${btnPrimary} w-full`} disabled={busy} type="submit">
            Add zone
          </button>
        </div>
        {error && <p className="col-span-full text-sm text-red-600">{error}</p>}
      </form>
    </div>
  );
}
