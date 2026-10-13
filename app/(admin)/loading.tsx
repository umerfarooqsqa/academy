// Shown immediately on navigation while a page's server-side data fetch is
// in flight (Suspense fallback via the loading.js file convention). Admin
// pages each do their own DB queries with no streaming before this existed,
// so clicking a nav link gave zero feedback until the whole page resolved —
// this, plus AdminNav's per-link pending indicator, is what actually fixes
// the "navbar feels slow" complaint (the DB round-trip itself is unchanged,
// see CLAUDE.md Section 4 on the Cloudflare/Hyperdrive per-request Prisma
// client — not something to alter here). No animation, per Section 7.
import { pageWrap } from "@/app/components/ui";

export default function AdminLoading() {
  return (
    <div className={pageWrap}>
      <p className="text-sm text-gray-400">Loading…</p>
    </div>
  );
}
