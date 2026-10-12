// /zones — CLAUDE.md Section 7: manage AreaZone table. This is how the operator
// fixes the North Nazimabad/Malir class of problem directly, without touching code.

import { prisma } from "@/lib/db";
import { pageTitle } from "@/app/components/ui";
import ZonesTable from "./ZonesTable";

export const dynamic = "force-dynamic";

export default async function ZonesPage() {
  const zones = await prisma.areaZone.findMany({ orderBy: { name: "asc" } });
  return (
    <main>
      <h1 className={pageTitle}>Area zones</h1>
      <p className="mt-1 text-sm text-gray-500">
        Hard filter for matching (6.3 Step 2) — a parent is never shown a tutor outside their zone's max km radius.
      </p>
      <div className="mt-4">
        <ZonesTable zones={zones} />
      </div>
    </main>
  );
}
