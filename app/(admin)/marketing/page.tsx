// /marketing — spend+supply+outcome ledger (NOT formal accounting) re-grouped
// by area and subjectGroup, plus a deterministic budget allocation
// recommendation. Operationalizes the heat map's stated purpose (6.11): "a
// zone with strong tutor supply but few matched parent requests is a direct
// signal for where to point parent-acquisition ad spend."

import { pageTitle } from "@/app/components/ui";
import MarketingClient from "./MarketingClient";

export const dynamic = "force-dynamic";

export default function MarketingPage() {
  return (
    <main>
      <h1 className={pageTitle}>Marketing</h1>
      <p className="mt-1 text-sm text-gray-500">
        A spend + supply + outcome ledger, not formal accounting — the same data as Finance and
        Campaigns, re-grouped by area and subject so tutor supply and ad spend can be compared
        side by side. The recommendation below is a deterministic weighted formula, never a
        trained model — every score component is shown, nothing is a black box.
      </p>
      <div className="mt-4">
        <MarketingClient />
      </div>
    </main>
  );
}
