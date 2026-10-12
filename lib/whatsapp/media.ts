// Meta WhatsApp Cloud API inbound media download (CLAUDE.md 6.1 step 10 —
// "media links expire quickly, so download immediately"). Two-step flow:
// resolve the media id to a short-lived URL, then fetch that URL with the
// same bearer token. Guarded the same way lib/whatsapp/client.ts's sendText
// is — never throws, so a failure here can't crash webhook processing.

const GRAPH_VERSION = "v21.0";

export interface MediaDownloadResult {
  ok: boolean;
  bytes?: Buffer;
  mimeType?: string;
  error?: string;
}

export async function downloadWhatsAppMedia(mediaId: string): Promise<MediaDownloadResult> {
  const token = process.env.WHATSAPP_CLOUD_API_TOKEN;
  if (!token) {
    return { ok: false, error: "WhatsApp env vars not configured" };
  }

  try {
    const metaRes = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${mediaId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const meta = (await metaRes.json()) as { url?: string; mime_type?: string; error?: { message: string } };
    if (!metaRes.ok || !meta.url) {
      return { ok: false, error: meta.error?.message ?? `HTTP ${metaRes.status} resolving media URL` };
    }

    const fileRes = await fetch(meta.url, { headers: { Authorization: `Bearer ${token}` } });
    if (!fileRes.ok) {
      return { ok: false, error: `HTTP ${fileRes.status} downloading media bytes` };
    }
    const arrayBuffer = await fileRes.arrayBuffer();
    return { ok: true, bytes: Buffer.from(arrayBuffer), mimeType: meta.mime_type };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
