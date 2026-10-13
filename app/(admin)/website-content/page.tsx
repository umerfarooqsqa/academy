// /website-content — CLAUDE.md Section 7-adjacent (2026-10-13 public website
// feature): lets the operator edit the public homepage's copy without
// touching code. Staff-accessible, not admin-only (content, not money).

import { getSiteContent } from "@/lib/siteContent";
import { pageTitle } from "@/app/components/ui";
import WebsiteContentClient from "./WebsiteContentClient";

export const dynamic = "force-dynamic";

export default async function WebsiteContentPage() {
  const content = await getSiteContent();

  return (
    <main className="max-w-3xl">
      <h1 className={pageTitle}>Website content</h1>
      <p className="mt-1 text-sm text-gray-500">
        Edits the public homepage at <code>/</code> — no code changes needed.
      </p>
      <WebsiteContentClient initial={content} />
    </main>
  );
}
