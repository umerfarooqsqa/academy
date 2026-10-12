"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { card, table, th, td, input, label, btnPrimary, btnSecondary } from "@/app/components/ui";
import { PLATFORMS, PLATFORM_LABELS, type PlatformName } from "@/lib/marketing/platforms";
import { SUBJECT_GROUPS, SUBJECT_GROUP_LABELS, type SubjectGroup } from "@/lib/subjectGroups";

interface Campaign {
  id: string;
  name: string;
  channel: string;
  area: string | null;
  audienceNote: string | null;
  platform: string | null;
  subjectGroup: string | null;
  metaAdId: string | null;
}

interface FunnelRow {
  campaignId: string | null;
  name: string;
  channel: string | null;
  area: string | null;
  audienceNote: string | null;
  leads: number;
  tutorLeads: number;
  matched: number;
  converted: number;
  spend: number;
  revenue: number;
  profit: number;
  costPerLead: number | null;
  leadToMatchRate: number | null;
  conversionRate: number | null;
  costPerConversion: number | null;
  profitPerConversion: number | null;
}

type SortKey = "costPerConversion" | "profitPerConversion" | "leads" | "converted";

function pct(n: number | null): string {
  return n == null ? "—" : `${(n * 100).toFixed(0)}%`;
}
function money(n: number | null): string {
  return n == null ? "—" : `Rs ${Math.round(n).toLocaleString()}`;
}

export default function CampaignsClient({ campaigns, zoneNames }: { campaigns: Campaign[]; zoneNames: string[] }) {
  const router = useRouter();
  const [funnel, setFunnel] = useState<FunnelRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("profitPerConversion");
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<Campaign>>({});
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    channel: "meta_ads",
    area: "",
    audienceNote: "",
    platform: "",
    subjectGroup: "",
    metaAdId: "",
  });

  useEffect(() => {
    fetch("/api/campaigns/funnel")
      .then((r) => r.json())
      .then((body) => setFunnel(body.funnel ?? []))
      .finally(() => setLoading(false));
  }, [campaigns]);

  const sorted = [...funnel].sort((a, b) => (b[sortKey] ?? -Infinity) - (a[sortKey] ?? -Infinity));

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!newCampaign.name) return;
    setBusy(true);
    await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...newCampaign,
        area: newCampaign.area || null,
        audienceNote: newCampaign.audienceNote || null,
        platform: newCampaign.platform || null,
        subjectGroup: newCampaign.subjectGroup || null,
        metaAdId: newCampaign.metaAdId || null,
      }),
    });
    setBusy(false);
    setNewCampaign({ name: "", channel: "meta_ads", area: "", audienceNote: "", platform: "", subjectGroup: "", metaAdId: "" });
    router.refresh();
  }

  async function saveEdit() {
    if (!editingId) return;
    setBusy(true);
    await fetch(`/api/campaigns/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editDraft),
    });
    setBusy(false);
    setEditingId(null);
    router.refresh();
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-900">
        Funnel / A-B comparison {loading && <span className="text-gray-400">(loading…)</span>}
      </h2>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {(["profitPerConversion", "costPerConversion", "leads", "converted"] as SortKey[]).map((k) => (
          <button
            key={k}
            onClick={() => setSortKey(k)}
            className={sortKey === k ? btnPrimary : btnSecondary}
          >
            Sort: {k}
          </button>
        ))}
      </div>
      <div className="mt-2 overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className={table}>
          <thead>
            <tr>
              <th className={th}>Campaign</th>
              <th className={th}>Area / audienceNote</th>
              <th className={th}>Leads</th>
              <th className={th}>Lead→Match</th>
              <th className={th}>Converted</th>
              <th className={th}>Conv. rate</th>
              <th className={th}>Cost/lead</th>
              <th className={th}>Cost/conv.</th>
              <th className={th}>Profit/conv.</th>
              <th className={th}>Profit</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((f) => (
              <tr key={f.campaignId ?? "unattributed"}>
                <td className={`${td} font-medium text-gray-900`}>
                  {f.name} <span className="text-xs text-gray-500">({f.channel ?? "—"})</span>
                </td>
                <td className={td}>
                  <div>{f.area ?? "—"}</div>
                  <div className="text-xs text-gray-500">{f.audienceNote ?? ""}</div>
                </td>
                <td className={td}>{f.leads}</td>
                <td className={td}>{pct(f.leadToMatchRate)}</td>
                <td className={td}>{f.converted}</td>
                <td className={td}>{pct(f.conversionRate)}</td>
                <td className={td}>{money(f.costPerLead)}</td>
                <td className={td}>{money(f.costPerConversion)}</td>
                <td className={td}>{money(f.profitPerConversion)}</td>
                <td className={td}>{money(f.profit)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-6 text-sm font-semibold text-gray-900">Campaigns</h2>
      <div className="mt-2 overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className={table}>
          <thead>
            <tr>
              <th className={th}>Name</th>
              <th className={th}>Channel</th>
              <th className={th}>Area</th>
              <th className={th}>Audience note</th>
              <th className={th}>Platform</th>
              <th className={th}>Subject group</th>
              <th className={th}>Meta ad ID</th>
              <th className={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) =>
              editingId === c.id ? (
                <tr key={c.id}>
                  <td className={td}>
                    <input className={input} value={editDraft.name ?? ""} onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })} />
                  </td>
                  <td className={td}>{c.channel}</td>
                  <td className={td}>
                    <select
                      className={input}
                      value={editDraft.area ?? ""}
                      onChange={(e) => setEditDraft({ ...editDraft, area: e.target.value || null })}
                    >
                      <option value="">General</option>
                      {zoneNames.map((z) => (
                        <option key={z} value={z}>
                          {z}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className={td}>
                    <input
                      className={input}
                      value={editDraft.audienceNote ?? ""}
                      onChange={(e) => setEditDraft({ ...editDraft, audienceNote: e.target.value })}
                    />
                  </td>
                  <td className={td}>
                    <select
                      className={input}
                      value={editDraft.platform ?? ""}
                      onChange={(e) => setEditDraft({ ...editDraft, platform: e.target.value || null })}
                    >
                      <option value="">—</option>
                      {PLATFORMS.map((p) => (
                        <option key={p} value={p}>
                          {PLATFORM_LABELS[p as PlatformName]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className={td}>
                    <select
                      className={input}
                      value={editDraft.subjectGroup ?? ""}
                      onChange={(e) => setEditDraft({ ...editDraft, subjectGroup: e.target.value || null })}
                    >
                      <option value="">—</option>
                      {SUBJECT_GROUPS.map((g) => (
                        <option key={g} value={g}>
                          {SUBJECT_GROUP_LABELS[g as SubjectGroup]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className={td}>
                    <input
                      className={input}
                      value={editDraft.metaAdId ?? ""}
                      onChange={(e) => setEditDraft({ ...editDraft, metaAdId: e.target.value })}
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
                <tr key={c.id}>
                  <td className={`${td} font-medium text-gray-900`}>{c.name}</td>
                  <td className={td}>{c.channel}</td>
                  <td className={td}>{c.area ?? "—"}</td>
                  <td className={td}>{c.audienceNote ?? "—"}</td>
                  <td className={td}>{c.platform ? PLATFORM_LABELS[c.platform as PlatformName] ?? c.platform : "—"}</td>
                  <td className={td}>{c.subjectGroup ? SUBJECT_GROUP_LABELS[c.subjectGroup as SubjectGroup] ?? c.subjectGroup : "—"}</td>
                  <td className={td}>{c.metaAdId ?? "—"}</td>
                  <td className={td}>
                    <button
                      className={btnSecondary}
                      onClick={() => {
                        setEditingId(c.id);
                        setEditDraft(c);
                      }}
                    >
                      Edit
                    </button>
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
          <input className={input} value={newCampaign.name} onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })} />
        </div>
        <div>
          <label className={label}>Channel</label>
          <select className={input} value={newCampaign.channel} onChange={(e) => setNewCampaign({ ...newCampaign, channel: e.target.value })}>
            <option value="meta_ads">meta_ads</option>
            <option value="tutor_referral">tutor_referral</option>
            <option value="organic_post">organic_post</option>
            <option value="other">other</option>
          </select>
        </div>
        <div>
          <label className={label}>Area (optional)</label>
          <select className={input} value={newCampaign.area} onChange={(e) => setNewCampaign({ ...newCampaign, area: e.target.value })}>
            <option value="">General</option>
            {zoneNames.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Audience note (for A/B pairing)</label>
          <input className={input} value={newCampaign.audienceNote} onChange={(e) => setNewCampaign({ ...newCampaign, audienceNote: e.target.value })} />
        </div>
        <div>
          <label className={label}>Platform (optional)</label>
          <select className={input} value={newCampaign.platform} onChange={(e) => setNewCampaign({ ...newCampaign, platform: e.target.value })}>
            <option value="">—</option>
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {PLATFORM_LABELS[p as PlatformName]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Subject group (optional)</label>
          <select
            className={input}
            value={newCampaign.subjectGroup}
            onChange={(e) => setNewCampaign({ ...newCampaign, subjectGroup: e.target.value })}
          >
            <option value="">—</option>
            {SUBJECT_GROUPS.map((g) => (
              <option key={g} value={g}>
                {SUBJECT_GROUP_LABELS[g as SubjectGroup]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Meta ad ID (meta_ads only)</label>
          <input className={input} value={newCampaign.metaAdId} onChange={(e) => setNewCampaign({ ...newCampaign, metaAdId: e.target.value })} />
        </div>
        <div className="sm:col-span-5">
          <button className={btnPrimary} disabled={busy} type="submit">
            Create campaign
          </button>
        </div>
      </form>
    </div>
  );
}
