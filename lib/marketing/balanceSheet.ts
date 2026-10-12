// Marketing balance sheet — not formal accounting (confirmed with the
// operator), just a spend+supply+outcome ledger merging the same underlying
// data as lib/finance/campaignFunnel.ts and lib/analytics/tutorDensity.ts, but
// re-grouped by (area, subjectGroup) instead of by campaignId, with a
// platform-level spend/outcome breakdown added. Pure aggregation, zero Prisma
// access — same style as campaignFunnel.ts.

import { SUBJECT_GROUPS } from "@/lib/subjectGroups";

export interface TutorSupplyRow {
  status: string;
  area: string;
  subjectGroup: string;
}

export interface LeadRow {
  area: string;
  subjectGroup: string;
  hasNonRejectedMatch: boolean;
}

export interface ConversionRow {
  area: string | null; // ParentRequest.area via Match — defensive null handling
  subjectGroup: string | null;
  platform: string | null; // via ParentRequest.campaign?.platform — null if unattributed
  status: string; // Payment.status
  commission: number;
}

export interface SpendRow {
  area: string | null; // caller resolves: spend.area ?? spend.campaign?.area
  subjectGroup: string | null; // caller resolves: spend.subjectGroup ?? spend.campaign?.subjectGroup
  platform: string | null; // caller resolves: spend.platform ?? spend.campaign?.platform
  amount: number;
}

export interface PlatformBreakdownEntry {
  platform: string; // a PlatformName, or "unspecified"
  spend: number;
  converted: number;
  revenue: number;
  profit: number;
  costPerConversion: number | null;
  profitPerConversion: number | null;
}

export interface BalanceSheetRow {
  area: string; // "Unattributed" sentinel for unresolvable area
  subjectGroup: string; // "unspecified" sentinel for unresolvable subjectGroup
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

const SUCCESSFUL_STATUSES = new Set(["collected", "paid_out"]);
const UNATTRIBUTED_AREA = "Unattributed";
const UNSPECIFIED_SUBJECT_GROUP = "unspecified";
const UNSPECIFIED_PLATFORM = "unspecified";

function safeDiv(a: number, b: number): number | null {
  return b > 0 ? a / b : null;
}

function key(area: string, subjectGroup: string): string {
  return `${area}::${subjectGroup}`;
}

function emptyRow(area: string, subjectGroup: string): BalanceSheetRow {
  return {
    area,
    subjectGroup,
    tutorCount: 0,
    leads: 0,
    matched: 0,
    converted: 0,
    spend: 0,
    revenue: 0,
    profit: 0,
    costPerLead: null,
    profitPerConversion: null,
    platformBreakdown: [],
  };
}

export function computeMarketingBalanceSheet(
  zoneNames: string[],
  tutors: TutorSupplyRow[],
  leads: LeadRow[],
  conversions: ConversionRow[],
  spend: SpendRow[],
): BalanceSheetRow[] {
  const rows = new Map<string, BalanceSheetRow>();
  // Platform accumulators tracked separately per (area,subjectGroup) key, keyed
  // further by platform — merged into each row's platformBreakdown at the end.
  const platformAcc = new Map<string, Map<string, PlatformBreakdownEntry>>();

  function getRow(area: string, subjectGroup: string): BalanceSheetRow {
    const k = key(area, subjectGroup);
    let row = rows.get(k);
    if (!row) {
      row = emptyRow(area, subjectGroup);
      rows.set(k, row);
      platformAcc.set(k, new Map());
    }
    return row;
  }

  function getPlatformEntry(area: string, subjectGroup: string, platform: string): PlatformBreakdownEntry {
    const k = key(area, subjectGroup);
    const acc = platformAcc.get(k)!;
    let entry = acc.get(platform);
    if (!entry) {
      entry = { platform, spend: 0, converted: 0, revenue: 0, profit: 0, costPerConversion: null, profitPerConversion: null };
      acc.set(platform, entry);
    }
    return entry;
  }

  // Seed the canonical grid first — so a combo with supply but no activity yet
  // still appears (required for the recommendation engine to see it at all).
  for (const area of zoneNames) {
    for (const subjectGroup of SUBJECT_GROUPS) {
      getRow(area, subjectGroup);
    }
  }

  // Tutor supply (active only — same filter as computeTutorDensity).
  for (const t of tutors) {
    if (t.status !== "active") continue;
    getRow(t.area, t.subjectGroup).tutorCount += 1;
  }

  // Leads + matched.
  for (const l of leads) {
    const row = getRow(l.area, l.subjectGroup);
    row.leads += 1;
    if (l.hasNonRejectedMatch) row.matched += 1;
  }

  // Conversions (successful payments) — both the row totals and the per-platform breakdown.
  for (const c of conversions) {
    if (!SUCCESSFUL_STATUSES.has(c.status)) continue;
    const area = c.area ?? UNATTRIBUTED_AREA;
    const subjectGroup = c.subjectGroup ?? UNSPECIFIED_SUBJECT_GROUP;
    const platform = c.platform ?? UNSPECIFIED_PLATFORM;
    const row = getRow(area, subjectGroup);
    row.converted += 1;
    row.revenue += c.commission;
    row.profit += c.commission;

    const entry = getPlatformEntry(area, subjectGroup, platform);
    entry.converted += 1;
    entry.revenue += c.commission;
    entry.profit += c.commission;
  }

  // Spend — row totals + per-platform breakdown.
  for (const s of spend) {
    const area = s.area ?? UNATTRIBUTED_AREA;
    const subjectGroup = s.subjectGroup ?? UNSPECIFIED_SUBJECT_GROUP;
    const platform = s.platform ?? UNSPECIFIED_PLATFORM;
    const row = getRow(area, subjectGroup);
    row.spend += s.amount;
    row.profit -= s.amount;

    const entry = getPlatformEntry(area, subjectGroup, platform);
    entry.spend += s.amount;
    entry.profit -= s.amount;
  }

  // Finalize: compute derived ratios and attach the platform breakdown arrays.
  for (const [k, row] of rows) {
    row.costPerLead = safeDiv(row.spend, row.leads);
    row.profitPerConversion = safeDiv(row.profit, row.converted);

    const acc = platformAcc.get(k)!;
    row.platformBreakdown = Array.from(acc.values()).map((entry) => ({
      ...entry,
      costPerConversion: safeDiv(entry.spend, entry.converted),
      profitPerConversion: safeDiv(entry.profit, entry.converted),
    }));
  }

  return Array.from(rows.values());
}
