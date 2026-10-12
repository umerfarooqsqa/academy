"use client";

import { useEffect, useState } from "react";
import { card, table, th, td, input, label, btnPrimary, btnSecondary, badge } from "@/app/components/ui";
import { PLATFORM_LABELS, type PlatformName } from "@/lib/marketing/platforms";
import { SUBJECT_GROUP_LABELS, type SubjectGroup } from "@/lib/subjectGroups";

interface PlatformBreakdownEntry {
  platform: string;
  spend: number;
  converted: number;
  revenue: number;
  profit: number;
  costPerConversion: number | null;
  profitPerConversion: number | null;
}

interface BalanceSheetRow {
  area: string;
  subjectGroup: string;
  tutorCount: number;
  leads: number;
  matched: number;
  converted: number;
  spend: number;
  revenue: number;
  profit: number;
  costPerLead: number | null;
  profitPerConversion: number | null;
  platformBreakdown: PlatformBreakdownEntry[];
}

interface AllocationRow {
  area: string;
  subjectGroup: string;
  score: number;
  scoreBreakdown: { supplyGap: number; costEfficiency: number; profitability: number; conversionRate: number };
  recommendedAmount: number;
  recommendedPlatform: string | null;
  platformRationale: string;
  excludedReason: string | null;
}

type SortKey = "profit" | "profitPerConversion" | "spend" | "tutorCount";

function money(n: number | null): string {
  return n == null ? "—" : `Rs ${Math.round(n).toLocaleString()}`;
}
function groupLabel(g: string): string {
  return SUBJECT_GROUP_LABELS[g as SubjectGroup] ?? g;
}
function platformLabel(p: string): string {
  return PLATFORM_LABELS[p as PlatformName] ?? p;
}
function platformSummary(breakdown: PlatformBreakdownEntry[]): string {
  if (breakdown.length === 0) return "—";
  return breakdown
    .filter((p) => p.spend > 0)
    .map((p) => `${platformLabel(p.platform)} ${Math.round(p.spend).toLocaleString()}`)
    .join(" · ") || "—";
}

export default function MarketingClient() {
  const [rows, setRows] = useState<BalanceSheetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("profit");

  const [budget, setBudget] = useState("");
  const [allocation, setAllocation] = useState<AllocationRow[] | null>(null);
  const [recommending, setRecommending] = useState(false);

  useEffect(() => {
    fetch("/api/marketing/balance-sheet")
      .then((r) => r.json())
      .then((body) => setRows(body.balanceSheet ?? []))
      .finally(() => setLoading(false));
  }, []);

  const sorted = [...rows].sort((a, b) => (b[sortKey] ?? -Infinity) - (a[sortKey] ?? -Infinity));

  async function getRecommendation(e: React.FormEvent) {
    e.preventDefault();
    const totalBudget = Number(budget);
    if (!totalBudget || totalBudget <= 0) return;
    setRecommending(true);
    const res = await fetch("/api/marketing/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ totalBudget }),
    });
    const body = await res.json();
    setAllocation(body.allocation ?? []);
    setRecommending(false);
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-900">
        Balance sheet {loading && <span className="text-gray-400">(loading…)</span>}
      </h2>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {(["profit", "profitPerConversion", "spend", "tutorCount"] as SortKey[]).map((k) => (
          <button key={k} onClick={() => setSortKey(k)} className={sortKey === k ? btnPrimary : btnSecondary}>
            Sort: {k}
          </button>
        ))}
      </div>
      <div className="mt-2 overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className={table}>
          <thead>
            <tr>
              <th className={th}>Area</th>
              <th className={th}>Subject group</th>
              <th className={th}>Tutors</th>
              <th className={th}>Leads</th>
              <th className={th}>Matched</th>
              <th className={th}>Converted</th>
              <th className={th}>Spend (by platform)</th>
              <th className={th}>Profit</th>
              <th className={th}>Cost/lead</th>
              <th className={th}>Profit/conv.</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={`${r.area}::${r.subjectGroup}`}>
                <td className={`${td} font-medium text-gray-900`}>{r.area}</td>
                <td className={td}>{groupLabel(r.subjectGroup)}</td>
                <td className={td}>{r.tutorCount}</td>
                <td className={td}>{r.leads}</td>
                <td className={td}>{r.matched}</td>
                <td className={td}>{r.converted}</td>
                <td className={td}>
                  <div>{money(r.spend)}</div>
                  <div className="text-xs text-gray-500">{platformSummary(r.platformBreakdown)}</div>
                </td>
                <td className={td}>{money(r.profit)}</td>
                <td className={td}>{money(r.costPerLead)}</td>
                <td className={td}>{money(r.profitPerConversion)}</td>
              </tr>
            ))}
            {rows.length === 0 && !loading && (
              <tr>
                <td className={td} colSpan={10}>
                  No zones configured yet — add some on the Zones page.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className="mt-6 text-sm font-semibold text-gray-900">Budget recommendation</h2>
      <p className="mt-1 text-xs text-gray-500">
        A deterministic weighted formula (tutor supply, cost efficiency, profitability, conversion
        rate) — never a trained model. Every score component below is shown, not hidden.
      </p>
      <form onSubmit={getRecommendation} className={`${card} mt-2 flex flex-wrap items-end gap-3`}>
        <div>
          <label className={label}>Total budget (PKR)</label>
          <input className={input} value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="e.g. 50000" />
        </div>
        <button className={btnPrimary} disabled={recommending} type="submit">
          {recommending ? "Calculating…" : "Get recommendation"}
        </button>
      </form>

      {allocation && (
        <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className={table}>
            <thead>
              <tr>
                <th className={th}>Area</th>
                <th className={th}>Subject group</th>
                <th className={th}>Recommended amount</th>
                <th className={th}>Recommended platform</th>
                <th className={th}>Score</th>
              </tr>
            </thead>
            <tbody>
              {[...allocation]
                .sort((a, b) => b.recommendedAmount - a.recommendedAmount)
                .map((a) => (
                  <tr key={`${a.area}::${a.subjectGroup}`}>
                    <td className={`${td} font-medium text-gray-900`}>{a.area}</td>
                    <td className={td}>{groupLabel(a.subjectGroup)}</td>
                    <td className={td}>
                      <div className="font-medium text-gray-900">{money(a.recommendedAmount)}</div>
                      {a.excludedReason && <span className={`${badge("amber")} mt-1`}>{a.excludedReason}</span>}
                    </td>
                    <td className={td}>
                      {a.recommendedPlatform && <div>{platformLabel(a.recommendedPlatform)}</div>}
                      <div className="text-xs text-gray-500">{a.platformRationale}</div>
                    </td>
                    <td className={td}>
                      <div>{a.score.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">
                        supply {a.scoreBreakdown.supplyGap.toFixed(2)} · cost {a.scoreBreakdown.costEfficiency.toFixed(2)} · profit{" "}
                        {a.scoreBreakdown.profitability.toFixed(2)} · conv {a.scoreBreakdown.conversionRate.toFixed(2)}
                      </div>
                    </td>
                  </tr>
                ))}
              {allocation.length === 0 && (
                <tr>
                  <td className={td} colSpan={5}>
                    No area/subject combos to allocate to yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
