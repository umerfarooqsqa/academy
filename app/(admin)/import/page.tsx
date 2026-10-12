// /import — CLAUDE.md chat-export pivot (2026-10): replaces live WhatsApp API
// intake. The operator (or staff) talks to a tutor/parent from their own
// WhatsApp, exports the chat when done (WhatsApp's native "Export Chat",
// optionally "with media"), and uploads it here. One LLM call reads the whole
// transcript and creates the Tutor/ParentRequest record — no webhook, no
// outbound API calls, no tokens, no tunnel.

import { prisma } from "@/lib/db";
import { pageTitle } from "@/app/components/ui";
import ImportClient from "./ImportClient";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  const campaigns = await prisma.campaign.findMany({ orderBy: { startDate: "desc" } });

  return (
    <main className="max-w-2xl">
      <h1 className={pageTitle}>Import chat</h1>
      <p className="mt-1 text-sm text-gray-500">
        Export a WhatsApp conversation (Chat &gt; Export chat, with or without media) and upload it
        here — the system reads the whole conversation and creates the profile automatically.
      </p>
      <ImportClient campaigns={campaigns.map((c) => ({ id: c.id, name: c.name }))} />
    </main>
  );
}
