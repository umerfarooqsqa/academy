// Meta WhatsApp Cloud API outbound sender (CLAUDE.md Section 4 — official/direct,
// no third-party SaaS).

const GRAPH_VERSION = "v21.0";

export class WhatsAppError extends Error {}

interface SendResult {
  ok: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send a plain text WhatsApp message. Returns a result object rather than
 * throwing, so a delivery failure never crashes webhook processing (Meta retries
 * the webhook if we 500, which would re-run intake logic).
 */
export async function sendText(to: string, body: string): Promise<SendResult> {
  const token = process.env.WHATSAPP_CLOUD_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) {
    return { ok: false, error: "WhatsApp env vars not configured" };
  }

  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: { preview_url: false, body },
      }),
    });
    const json = (await res.json()) as {
      messages?: Array<{ id: string }>;
      error?: { message: string };
    };
    if (!res.ok) {
      return { ok: false, error: json.error?.message ?? `HTTP ${res.status}` };
    }
    return { ok: true, messageId: json.messages?.[0]?.id };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

/** Notify the operator (CLAUDE.md 6.1 step 5, 6.4). */
export async function notifyOperator(body: string): Promise<SendResult> {
  const adminNumber = process.env.ADMIN_WHATSAPP_NUMBER;
  if (!adminNumber) return { ok: false, error: "ADMIN_WHATSAPP_NUMBER not set" };
  return sendText(adminNumber, body);
}
