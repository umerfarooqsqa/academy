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

/**
 * Uploads bytes to Supabase Storage at `path` within the configured bucket and
 * returns its public URL. Requires the bucket to be marked public in the
 * Supabase dashboard — no signed-URL logic is implemented (operator glances
 * at these from the /tutors dashboard, per 6.1 step 10, not a public-facing
 * flow, but a public bucket keeps this simple with no token-refresh burden).
 */
export async function uploadToSupabaseStorage(
  path: string,
  bytes: Buffer,
  contentType: string,
): Promise<UploadResult> {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) {
    return { ok: false, error: "Supabase env vars not configured" };
  }
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || DEFAULT_BUCKET;

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
