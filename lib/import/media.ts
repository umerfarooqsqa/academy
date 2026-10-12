// Zip handling for "Export Chat (with media)" uploads. Thin wrapper over
// fflate — the only zip dependency in this project (package.json), chosen for
// its small pure-JS footprint, consistent with this codebase's
// minimal-dependency habit (Section 2 flag: new dependency, pre-authorized by
// the operator's own request for .zip support).

import { unzipSync } from "fflate";

export class InvalidExportError extends Error {}

/** Returns every file in the zip as { path: bytes }. */
export function extractZipEntries(zipBytes: Uint8Array): Record<string, Uint8Array> {
  try {
    return unzipSync(zipBytes);
  } catch (err) {
    throw new InvalidExportError(`Could not read .zip file: ${(err as Error).message}`);
  }
}

/** Locates the chat transcript inside a zip's entries — WhatsApp names it
 * "_chat.txt" (Android) or "WhatsApp Chat with <Name>.txt" (iOS). Falls back
 * to the first .txt entry found if neither pattern matches. */
export function findTranscriptText(entries: Record<string, Uint8Array>): string {
  const names = Object.keys(entries);
  const byName =
    names.find((n) => /(^|\/)_chat\.txt$/i.test(n)) ??
    names.find((n) => /whatsapp chat with.*\.txt$/i.test(n)) ??
    names.find((n) => n.toLowerCase().endsWith(".txt"));
  if (!byName) throw new InvalidExportError("No chat transcript (.txt) found inside the .zip");
  return Buffer.from(entries[byName]).toString("utf-8");
}

const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|webp|gif)$/i;

/** Every image file in the zip, keyed by its bare filename (matching what the
 * transcript references, e.g. "IMG-20261012-WA0001.jpg") — the zip entry path
 * may have a directory prefix, the transcript reference never does. */
export function extractImageFilesByName(entries: Record<string, Uint8Array>): Map<string, Buffer> {
  const map = new Map<string, Buffer>();
  for (const [path, bytes] of Object.entries(entries)) {
    if (!IMAGE_EXTENSIONS.test(path)) continue;
    const baseName = path.split("/").pop()!;
    map.set(baseName, Buffer.from(bytes));
  }
  return map;
}

const EXTENSION_CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

/** Content-type for a filename's extension — the extension is already known
 * from the zip entry name, so no mime-sniffing is needed. Falls back to JPEG,
 * same default used elsewhere for an unrecognised type (lib/intake/documents.ts). */
export function contentTypeForFilename(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_CONTENT_TYPES[ext] ?? "image/jpeg";
}
