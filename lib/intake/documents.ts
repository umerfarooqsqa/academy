// CNIC/marksheet document capture — pure logic only (CLAUDE.md 6.1 step 10).
// No I/O here (mirrors the helpers.ts/persist.ts split used elsewhere in
// lib/intake/) — download/upload/DB writes live in lib/whatsapp/media.ts,
// lib/storage/supabase.ts, and lib/intake/persist.ts respectively.
//
// CNIC is required before a tutor can be activated; marksheet stays optional
// (operator decision, 2026-09 planning session). No OCR/vision model is ever
// used to classify these — a strict ordinal rule (first image = CNIC, every
// image after = marksheet) is the only zero-cost way to do it without one.

export const MAX_MARKSHEET_IMAGES = 5;

export type DocKind = "cnic" | "marksheet";

/** First image at the awaiting_documents step is always the CNIC; every image
 * after that is a marksheet page. */
export function classifyDocumentSlot(hasCnic: boolean): DocKind {
  return hasCnic ? "marksheet" : "cnic";
}

const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/** Falls back to "jpg" for an unrecognised/missing mime type — WhatsApp photos
 * are overwhelmingly JPEG, and the extension is only used for the storage
 * path, never to validate or interpret file content. */
export function extensionForMime(mime: string | undefined): string {
  if (!mime) return "jpg";
  return MIME_EXTENSIONS[mime.toLowerCase()] ?? "jpg";
}

/** Sanitizes whatsappId (digits/plus only expected, but never trust input in
 * a storage path) and builds a collision-resistant path. */
export function buildDocumentStoragePath(
  whatsappId: string,
  kind: DocKind,
  ext: string,
  now: number = Date.now(),
): string {
  const safeId = whatsappId.replace(/[^a-zA-Z0-9]/g, "");
  return `tutors/${safeId}/${kind}-${now}.${ext}`;
}

/** Auto-finalize once a tutor has sent enough marksheet images, so a tutor who
 * just keeps sending photos doesn't wait forever and Storage usage stays
 * bounded. Only ever relevant once CNIC is already set (marksheets only
 * accumulate after the first/CNIC image under classifyDocumentSlot). */
export function shouldAutoFinalize(marksheetCount: number): boolean {
  return marksheetCount >= MAX_MARKSHEET_IMAGES;
}
