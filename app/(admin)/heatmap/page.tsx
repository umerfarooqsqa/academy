// /heatmap — reads the session role server-side so the admin-only "exact
// locations" layer is only offered to admins (2026-10-14). The data itself
// is also guarded server-side (GET /api/admin/exact-locations).

import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";
import HeatmapClient from "./HeatmapClient";

export default async function HeatmapPage() {
  const session = await verifySessionToken((await cookies()).get(SESSION_COOKIE_NAME)?.value);
  return <HeatmapClient isAdmin={session?.role === "admin"} />;
}
