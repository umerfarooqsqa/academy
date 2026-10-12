// /campaigns — CLAUDE.md Section 7: create/edit Campaign rows and the 6.10 A/B
// comparison table — the primary page for deciding which audience/creative is
// worth continued spend.

import { prisma } from "@/lib/db";
import { pageTitle } from "@/app/components/ui";
import CampaignsClient from "./CampaignsClient";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const [campaigns, zones] = await Promise.all([
    prisma.campaign.findMany({ orderBy: { startDate: "desc" } }),
    prisma.areaZone.findMany({ select: { name: true }, orderBy: { name: "asc" } }),
  ]);
  return (
    <main>
      <h1 className={pageTitle}>Campaigns</h1>
      <p className="mt-1 text-sm text-gray-500">
        For meta_ads campaigns, paste the Meta ad ID here once the ad is live so inbound leads
        auto-attribute silently (6.1).
      </p>
      <div className="mt-4">
        <CampaignsClient campaigns={campaigns} zoneNames={zones.map((z) => z.name)} />
      </div>
    </main>
  );
}
