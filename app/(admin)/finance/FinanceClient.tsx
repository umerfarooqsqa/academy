"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { card, input, label, btnPrimary, table, th, td } from "@/app/components/ui";
import { PLATFORMS, PLATFORM_LABELS, type PlatformName } from "@/lib/marketing/platforms";
import { SUBJECT_GROUPS, SUBJECT_GROUP_LABELS, type SubjectGroup } from "@/lib/subjectGroups";

interface Metrics {
  totalSpend: number;
  successfulDeals: number;
  totalCommission: number;
  costPerDeal: number | null;
  netProfit: number;
  profitPerDeal: number | null;
  breakEvenDealsCount: number | null;
}

interface SpendRow {
  id: string;
  channel: string;
  area: string | null;
  platform: string | null;
  subjectGroup: string | null;
  amount: number;
  spentOn: string;
  notes: string | null;
  campaign: { name: string } | null;
}

interface CampaignOption {
  id: string;
  name: string;
  area: string | null;
  platform: string | null;
  subjectGroup: string | null;
}

function fmtMoney(n: number | null): string {
  return n == null ? "—" : `Rs ${Math.round(n).toLocaleString()}`;
}

/** Profit margin = net profit ÷ total spend, as a percentage — "for every
 * rupee spent, what % came back as profit." Null (shown as "—") when there's
 * no spend to measure against, rather than an undefined/infinite ratio. */
function profitPercent(metrics: Metrics | null): number | null {
  if (!metrics || metrics.totalSpend <= 0) return null;
  return (metrics.netProfit / metrics.totalSpend) * 100;
}
function fmtPercent(n: number | null): string {
  if (n == null) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}
function profitPercentClass(metrics: Metrics | null): string {
  const pct = profitPercent(metrics);
  if (pct == null) return "text-gray-900";
  return pct >= 0 ? "text-green-600" : "text-red-600";
}

function monthStartISO(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function FinanceClient({
  zoneNames,
  spends,
  campaigns,
}: {
  zoneNames: string[];
  spends: SpendRow[];
  campaigns: CampaignOption[];
}) {
  const router = useRouter();
  const [start, setStart] = useState(monthStartISO());
  const [end, setEnd] = useState(todayISO());
  const [area, setArea] = useState("");
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [spendForm, setSpendForm] = useState({
    channel: "meta_ads",
    campaignId: "",
    area: "",
    platform: "",
    subjectGroup: "",
    amount: "",
    spentOn: todayISO(),
    notes: "",
  });

  /** Picking a campaign prefills area/platform/subjectGroup from it (only into
   * fields still empty) — convenience, not a requirement; all three stay editable. */
  function onSelectCampaign(campaignId: string) {
    const campaign = campaigns.find((c) => c.id === campaignId);
    setSpendForm((f) => ({
      ...f,
      campaignId,
      area: f.area || campaign?.area || "",
      platform: f.platform || campaign?.platform || "",
      subjectGroup: f.subjectGroup || campaign?.subjectGroup || "",
    }));
  }

  useEffect(() => {
    const params = new URLSearchParams({ start, end });
    if (area) params.set("area", area);
    setLoading(true);
    fetch(`/api/finance/metrics?${params.toString()}`)
      .then((r) => r.json())
      .then((body) => setMetrics(body.metrics))
      .finally(() => setLoading(false));
  }, [start, end, area]);

  async function logSpend(e: React.FormEvent) {
    e.preventDefault();
    if (!spendForm.amount) return;
    setBusy(true);
    await fetch("/api/marketing-spend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...spendForm,
        campaignId: spendForm.campaignId || null,
        area: spendForm.area || null,
        platform: spendForm.platform || null,
        subjectGroup: spendForm.subjectGroup || null,
        amount: Number(spendForm.amount),
      }),
    });
    setBusy(false);
    setSpendForm({
      channel: "meta_ads",
      campaignId: "",
      area: "",
      platform: "",
      subjectGroup: "",
      amount: "",
      spentOn: todayISO(),
      notes: "",
    });
    router.refresh();
  }

  return (
    <div>
      <div className={`${card} flex flex-wrap items-end gap-3`}>
        <div>
          <label className={label}>Start</label>
          <input type="date" className={input} value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div>
          <label className={label}>End</label>
          <input type="date" className={input} value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
        <div>
          <label className={label}>Area</label>
          <select className={input} value={area} onChange={(e) => setArea(e.target.value)}>
            <option value="">All areas</option>
            {zoneNames.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </div>
        <div className="text-sm text-gray-500">{loading ? "Loading…" : ""}</div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className={card}>
          <p className="text-xs font-medium text-gray-500">Cost per deal</p>
          <p className="mt-1 text-xl font-semibold text-gray-900">{fmtMoney(metrics?.costPerDeal ?? null)}</p>
        </div>
        <div className={card}>
          <p className="text-xs font-medium text-gray-500">Profit per deal</p>
          <p className="mt-1 text-xl font-semibold text-gray-900">{fmtMoney(metrics?.profitPerDeal ?? null)}</p>
        </div>
        <div className={card}>
          <p className="text-xs font-medium text-gray-500">Net profit</p>
          <p className="mt-1 text-xl font-semibold text-gray-900">{fmtMoney(metrics?.netProfit ?? null)}</p>
        </div>
        <div className={card}>
          <p className="text-xs font-medium text-gray-500">Profit margin</p>
          <p className={`mt-1 text-xl font-semibold ${profitPercentClass(metrics)}`}>{fmtPercent(profitPercent(metrics))}</p>
        </div>
      </div>
      <p className="mt-2 text-xs text-gray-500">
        {metrics?.successfulDeals ?? 0} successful deal(s) · Rs {(metrics?.totalSpend ?? 0).toLocaleString()} spend · Rs{" "}
        {(metrics?.totalCommission ?? 0).toLocaleString()} commission
      </p>

      <h2 className="mt-6 text-sm font-semibold text-gray-900">Log marketing spend</h2>
      <form onSubmit={logSpend} className={`${card} mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4`}>
        <div>
          <label className={label}>Channel</label>
          <select className={input} value={spendForm.channel} onChange={(e) => setSpendForm({ ...spendForm, channel: e.target.value })}>
            <option value="meta_ads">meta_ads</option>
            <option value="tutor_referral">tutor_referral</option>
            <option value="organic_post">organic_post</option>
            <option value="other">other</option>
          </select>
        </div>
        <div>
          <label className={label}>Campaign (optional)</label>
          <select className={input} value={spendForm.campaignId} onChange={(e) => onSelectCampaign(e.target.value)}>
            <option value="">General / none</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Area (optional)</label>
          <select className={input} value={spendForm.area} onChange={(e) => setSpendForm({ ...spendForm, area: e.target.value })}>
            <option value="">General</option>
            {zoneNames.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Platform (optional)</label>
          <select className={input} value={spendForm.platform} onChange={(e) => setSpendForm({ ...spendForm, platform: e.target.value })}>
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
          <select className={input} value={spendForm.subjectGroup} onChange={(e) => setSpendForm({ ...spendForm, subjectGroup: e.target.value })}>
            <option value="">—</option>
            {SUBJECT_GROUPS.map((g) => (
              <option key={g} value={g}>
                {SUBJECT_GROUP_LABELS[g as SubjectGroup]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Amount (PKR)</label>
          <input className={input} value={spendForm.amount} onChange={(e) => setSpendForm({ ...spendForm, amount: e.target.value })} />
        </div>
        <div>
          <label className={label}>Date</label>
          <input type="date" className={input} value={spendForm.spentOn} onChange={(e) => setSpendForm({ ...spendForm, spentOn: e.target.value })} />
        </div>
        <div className="flex items-end">
          <button className={`${btnPrimary} w-full`} disabled={busy} type="submit">
            Log spend
          </button>
        </div>
      </form>

      <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className={table}>
          <thead>
            <tr>
              <th className={th}>Date</th>
              <th className={th}>Channel</th>
              <th className={th}>Area</th>
              <th className={th}>Platform</th>
              <th className={th}>Campaign</th>
              <th className={th}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {spends.map((s) => (
              <tr key={s.id}>
                <td className={td}>{s.spentOn.slice(0, 10)}</td>
                <td className={td}>{s.channel}</td>
                <td className={td}>{s.area ?? "General"}</td>
                <td className={td}>{s.platform ? PLATFORM_LABELS[s.platform as PlatformName] ?? s.platform : "—"}</td>
                <td className={td}>{s.campaign?.name ?? "—"}</td>
                <td className={td}>Rs {s.amount.toLocaleString()}</td>
              </tr>
            ))}
            {spends.length === 0 && (
              <tr>
                <td className={td} colSpan={6}>
                  No spend logged yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
