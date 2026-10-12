// Meta WhatsApp Cloud API inbound webhook payload shapes (subset we use).
// https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples

export interface WhatsAppReferral {
  source_url?: string;
  source_id?: string; // matched against Campaign.metaAdId (CLAUDE.md 6.1 step 2)
  source_type?: string; // e.g. "ad" | "post"
  headline?: string;
  body?: string;
  ctwa_clid?: string;
}

export interface WhatsAppInboundMessage {
  from: string; // sender's WhatsApp phone number (our whatsappId)
  id: string; // message id (for dedupe)
  timestamp: string;
  type: string; // "text" | "image" | "button" | ...
  text?: { body: string };
  image?: { id: string; mime_type?: string; sha256?: string; caption?: string }; // 6.1 step 10
  button?: { text: string; payload: string };
  interactive?: {
    type: string;
    button_reply?: { id: string; title: string };
    list_reply?: { id: string; title: string };
  };
  referral?: WhatsAppReferral;
}

export interface WhatsAppValue {
  messaging_product: "whatsapp";
  metadata: { display_phone_number: string; phone_number_id: string };
  contacts?: Array<{ profile: { name: string }; wa_id: string }>;
  messages?: WhatsAppInboundMessage[];
  statuses?: unknown[];
}

export interface WhatsAppWebhookBody {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{ value: WhatsAppValue; field: string }>;
  }>;
}

/** Best-effort plain-text extraction from an inbound message of any supported type. */
export function messageText(msg: WhatsAppInboundMessage): string | null {
  if (msg.text?.body) return msg.text.body.trim();
  if (msg.button?.text) return msg.button.text.trim();
  if (msg.interactive?.button_reply?.title) return msg.interactive.button_reply.title.trim();
  if (msg.interactive?.list_reply?.title) return msg.interactive.list_reply.title.trim();
  return null;
}
