// /finance — CLAUDE.md Section 7: the 6.9 cost-per-successful-deal calculator,
// date range + area filters, plus a MarketingSpend log/entry form.

import { prisma } from "@/lib/db";
import { pageTitle } from "@/app/components/ui";
import FinanceClient from "./FinanceClient";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  const [zones, spends, campaigns] = await Promise.all([
    prisma.areaZone.findMany({ select: { name: true }, orderBy: { name: "asc" } }),
    prisma.marketingSpend.findMany({ include: { campaign: true }, orderBy: { spentOn: "desc" }, take: 50 }),
    prisma.campaign.findMany({ select: { id: true, name: true, area: true, platform: true, subjectGroup: true } }),
  ]);

  return (
    <main>
      <h1 className={pageTitle}>Finance</h1>
      <p className="mt-1 text-sm text-gray-500">
        A "successful deal" is a Match whose linked Payment reached collected/paid_out — not just a demo.
      </p>
      <div className="mt-4">
        <FinanceClient
          zoneNames={zones.map((z) => z.name)}
          spends={spends.map((s) => ({ ...s, spentOn: s.spentOn.toISOString() }))}
          campaigns={campaigns}
        />
      </div>
    </main>
  );
}
