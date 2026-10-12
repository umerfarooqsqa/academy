// Campaign funnel + A/B comparison (CLAUDE.md 6.10). Same aggregation pattern as
// 6.9, just grouped by campaignId — pure functions over pre-fetched rows, no
// Prisma access here.

export interface CampaignRow {
  id: string;
  name: string;
  channel: string; // meta_ads | tutor_referral | organic_post | other
  area: string | null;
  audienceNote: string | null;
}

export interface ParentRequestFunnelRow {
  campaignId: string | null;
  hasNonRejectedMatch: boolean; // >= 1 Match with status != "rejected"
}

export interface TutorFunnelRow {
  campaignId: string | null;
}

export interface SpendFunnelRow {
  campaignId: string | null;
  amount: number;
}

export interface PaymentFunnelRow {
  campaignId: string | null; // Payment -> Match -> ParentRequest.campaignId
  status: string;
  commission: number;
}

export interface CampaignFunnelResult {
  campaignId: string | null; // null = "Unattributed"
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

const SUCCESSFUL_STATUSES = new Set(["collected", "paid_out"]);

function safeDiv(a: number, b: number): number | null {
  return b > 0 ? a / b : null;
}

export function computeCampaignFunnel(
  campaigns: CampaignRow[],
  parentRequests: ParentRequestFunnelRow[],
  tutors: TutorFunnelRow[],
  spend: SpendFunnelRow[],
  payments: PaymentFunnelRow[],
  includeUnattributed = true,
): CampaignFunnelResult[] {
  const groups = new Map<string | null, CampaignRow | null>();
  for (const c of campaigns) groups.set(c.id, c);
  if (includeUnattributed) groups.set(null, null);

  return Array.from(groups.entries()).map(([campaignId, campaign]) => {
    const leads = parentRequests.filter((p) => p.campaignId === campaignId).length;
    const tutorLeads = tutors.filter((t) => t.campaignId === campaignId).length;
    const matched = parentRequests.filter(
      (p) => p.campaignId === campaignId && p.hasNonRejectedMatch,
    ).length;
    const campaignPayments = payments.filter((p) => p.campaignId === campaignId);
    const convertedPayments = campaignPayments.filter((p) => SUCCESSFUL_STATUSES.has(p.status));
    const converted = convertedPayments.length;
    const campaignSpend = spend.filter((s) => s.campaignId === campaignId).reduce((sum, s) => sum + s.amount, 0);
    const revenue = convertedPayments.reduce((sum, p) => sum + p.commission, 0);
    const profit = revenue - campaignSpend;

    return {
      campaignId,
      name: campaign?.name ?? "Unattributed",
      channel: campaign?.channel ?? null,
      area: campaign?.area ?? null,
      audienceNote: campaign?.audienceNote ?? null,
      leads,
      tutorLeads,
      matched,
      converted,
      spend: campaignSpend,
      revenue,
      profit,
      costPerLead: safeDiv(campaignSpend, leads),
      leadToMatchRate: safeDiv(matched, leads),
      conversionRate: safeDiv(converted, leads),
      costPerConversion: safeDiv(campaignSpend, converted),
      profitPerConversion: safeDiv(profit, converted),
    };
  });
}
