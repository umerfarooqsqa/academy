import { describe, it, expect } from "vitest";
import {
  computeCampaignFunnel,
  type CampaignRow,
  type ParentRequestFunnelRow,
  type PaymentFunnelRow,
  type SpendFunnelRow,
} from "@/lib/finance/campaignFunnel";

const campaigns: CampaignRow[] = [
  { id: "camp-a", name: "Meta Ads - North Nazimabad - Audience A", channel: "meta_ads", area: "North Nazimabad", audienceNote: "exam-prep interest" },
  { id: "camp-b", name: "Meta Ads - North Nazimabad - Audience B", channel: "meta_ads", area: "North Nazimabad", audienceNote: "parents 30-45" },
];

describe("computeCampaignFunnel (CLAUDE.md 6.10)", () => {
  it("computes the full funnel for a campaign with leads, matches, and a conversion", () => {
    const parentRequests: ParentRequestFunnelRow[] = [
      { campaignId: "camp-a", hasNonRejectedMatch: true },
      { campaignId: "camp-a", hasNonRejectedMatch: true },
      { campaignId: "camp-a", hasNonRejectedMatch: false },
      { campaignId: "camp-a", hasNonRejectedMatch: false },
    ];
    const spend: SpendFunnelRow[] = [{ campaignId: "camp-a", amount: 4000 }];
    const payments: PaymentFunnelRow[] = [
      { campaignId: "camp-a", status: "collected", commission: 8000 },
    ];

    const result = computeCampaignFunnel(campaigns, parentRequests, [], spend, payments, false);
    const a = result.find((r) => r.campaignId === "camp-a")!;

    expect(a.leads).toBe(4);
    expect(a.matched).toBe(2);
    expect(a.converted).toBe(1);
    expect(a.spend).toBe(4000);
    expect(a.revenue).toBe(8000);
    expect(a.profit).toBe(4000);
    expect(a.costPerLead).toBe(1000);
    expect(a.leadToMatchRate).toBe(0.5);
    expect(a.conversionRate).toBe(0.25);
    expect(a.costPerConversion).toBe(4000);
    expect(a.profitPerConversion).toBe(4000);
  });

  it("returns null (displayed as '—') for rate fields when leads/converted are zero", () => {
    const result = computeCampaignFunnel(campaigns, [], [], [], [], false);
    const a = result.find((r) => r.campaignId === "camp-a")!;
    expect(a.costPerLead).toBeNull();
    expect(a.leadToMatchRate).toBeNull();
    expect(a.conversionRate).toBeNull();
  });

  it("groups an unattributed (campaignId: null) row separately from named campaigns", () => {
    const parentRequests: ParentRequestFunnelRow[] = [
      { campaignId: null, hasNonRejectedMatch: false },
      { campaignId: "camp-a", hasNonRejectedMatch: false },
    ];
    const result = computeCampaignFunnel(campaigns, parentRequests, [], [], [], true);
    const unattributed = result.find((r) => r.campaignId === null)!;
    expect(unattributed.leads).toBe(1);
    expect(unattributed.name).toBe("Unattributed");
  });

  it("keeps two same-area/channel campaigns independently comparable via audienceNote (A/B pair)", () => {
    const parentRequests: ParentRequestFunnelRow[] = [
      { campaignId: "camp-a", hasNonRejectedMatch: true },
      { campaignId: "camp-b", hasNonRejectedMatch: false },
    ];
    const result = computeCampaignFunnel(campaigns, parentRequests, [], [], [], false);
    const a = result.find((r) => r.campaignId === "camp-a")!;
    const b = result.find((r) => r.campaignId === "camp-b")!;
    expect(a.audienceNote).toBe("exam-prep interest");
    expect(b.audienceNote).toBe("parents 30-45");
    expect(a.leadToMatchRate).toBe(1);
    expect(b.leadToMatchRate).toBe(0);
  });
});
