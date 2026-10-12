// Meta WhatsApp Cloud API webhook (CLAUDE.md 6.1, Section 8).
//
// GET  — verification handshake (hub.mode / hub.verify_token / hub.challenge)
// POST — inbound messages. We 200 immediately and process with `after()` so Meta
//        does not retry-storm us; each message id is de-duped in the DB.
//
// NOTE (Phase 0): live testing is blocked until the operator completes Meta
// Business verification + WhatsApp Cloud API number + webhook URL registration.
// The contract below follows Meta's documented payload shape.

import { after, NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { processInboundMessage, processInboundImage } from "@/lib/intake/process";
import { messageText, type WhatsAppWebhookBody } from "@/lib/whatsapp/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");

  if (mode === "subscribe" && token && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

type Job =
  | {
      kind: "text";
      whatsappId: string;
      messageId: string;
      text: string;
      referralSourceId?: string | null;
      contactName?: string | null;
    }
  | { kind: "image"; whatsappId: string; messageId: string; mediaId: string };

export async function POST(req: NextRequest) {
  let body: WhatsAppWebhookBody;
  try {
    body = (await req.json()) as WhatsAppWebhookBody;
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  if (body.object !== "whatsapp_business_account") {
    return NextResponse.json({ ignored: true });
  }

  // Flatten to the inbound messages we care about: text (the existing intake
  // flow) and image (CNIC/marksheet capture, 6.1 step 10). Everything else
  // (unsupported types) is still safely ignored.
  const jobs: Job[] = [];

  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      if (!value?.messages) continue;
      const contactName = value.contacts?.[0]?.profile?.name ?? null;
      for (const msg of value.messages) {
        const text = messageText(msg);
        if (text) {
          jobs.push({
            kind: "text",
            whatsappId: msg.from,
            messageId: msg.id,
            text,
            referralSourceId: msg.referral?.source_id ?? null,
            contactName,
          });
        } else if (msg.type === "image" && msg.image?.id) {
          jobs.push({ kind: "image", whatsappId: msg.from, messageId: msg.id, mediaId: msg.image.id });
        }
        // else: unsupported type — ignore
      }
    }
  }

  after(async () => {
    for (const job of jobs) {
      try {
        // Idempotency: skip a message id we've already handled.
        await prisma.processedInboundMessage.create({ data: { id: job.messageId } });
      } catch {
        console.info(`[webhook] duplicate message ${job.messageId} — skipping`);
        continue;
      }
      try {
        if (job.kind === "text") {
          await processInboundMessage({
            whatsappId: job.whatsappId,
            text: job.text,
            referralSourceId: job.referralSourceId,
            contactName: job.contactName,
          });
        } else {
          // Only meaningful mid-document-capture — an unrelated photo sent at
          // any other time is silently ignored, no operator notification.
          const session = await prisma.intakeSession.findUnique({ where: { whatsappId: job.whatsappId } });
          if (session?.step === "awaiting_documents") {
            await processInboundImage({ whatsappId: job.whatsappId, mediaId: job.mediaId });
          }
        }
      } catch (err) {
        console.error(`[webhook] processing failed for message ${job.messageId}:`, err);
      }
    }
  });

  return NextResponse.json({ received: true });
}
