// Supabase Storage upload (CLAUDE.md 6.1 step 10 — CNIC/marksheet images,
// "uploads it to Supabase Storage"). Plain REST via fetch, no
// @supabase/supabase-js dependency — matches this codebase's established
// pattern of avoiding SDK weight for a single-endpoint integration (see
// lib/facebook/client.ts's rationale). Guarded the same way every other
// outbound client in this project is: never throws, returns {ok, error}.

export interface UploadResult {
  ok: boolean;
  publicUrl?: string;
  error?: string;
}

// Not in CLAUDE.md Section 9 — flagged for operator sign-off (Section 2).
// Safe default, degrades gracefully like every other config value here.
const DEFAULT_BUCKET = "tutor-documents";

/** PUBLIC bucket for featured-tutor profile photos (2026-10-15) — anything
 * here can be opened by link, so never put documents in it. */
export const PHOTO_BUCKET = "tutor-photos";

/**
 * Uploads bytes to Supabase Storage at `path` within the configured bucket and
 * returns its storage URL. Since 2026-10-15 the bucket is PRIVATE (CNIC and
 * marksheet images must never be openable by link alone): the returned URL is
 * only an identifier — staff view a file through GET /api/tutor-documents,
 * which checks the login and redirects to a 5-minute signed link
 * (signedUrlFor below).
 */
export async function uploadToSupabaseStorage(
  path: string,
  bytes: Buffer,
  contentType: string,
  bucketOverride?: string,
): Promise<UploadResult> {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) {
    return { ok: false, error: "Supabase env vars not configured" };
  }
  const bucket = bucketOverride ?? (process.env.SUPABASE_STORAGE_BUCKET || DEFAULT_BUCKET);

  try {
    const res = await fetch(`${url}/storage/v1/object/${bucket}/${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
        "Content-Type": contentType,
        "x-upsert": "true",
      },
      // Buffer is a Uint8Array at runtime, but TS's DOM BodyInit type doesn't
      // structurally accept Node's Buffer type — an explicit Uint8Array view
      // satisfies both without copying.
      body: new Uint8Array(bytes),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, error: `HTTP ${res.status} uploading to Supabase Storage: ${body.slice(0, 200)}` };
    }
    return { ok: true, publicUrl: `${url}/storage/v1/object/public/${bucket}/${path}` };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

/** Turns a stored document URL (…/storage/v1/object/public/<bucket>/<path>)
 * into a short-lived signed link, or null if it isn't one of our documents.
 * The bucket is private, so this is the only way to open a CNIC/marksheet. */
export async function signedUrlFor(storedUrl: string, expiresInSeconds = 300): Promise<string | null> {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) return null;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || DEFAULT_BUCKET;
  const prefix = `${url}/storage/v1/object/public/${bucket}/`;
  if (!storedUrl.startsWith(prefix)) return null;
  const path = storedUrl.slice(prefix.length);
  if (!path || path.includes("..")) return null;
  try {
    const res = await fetch(`${url}/storage/v1/object/sign/${bucket}/${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey, "Content-Type": "application/json" },
      body: JSON.stringify({ expiresIn: expiresInSeconds }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { signedURL?: string };
    return json.signedURL ? `${url}/storage/v1${json.signedURL}` : null;
  } catch {
    return null;
  }
}
