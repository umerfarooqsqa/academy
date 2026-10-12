import { describe, it, expect } from "vitest";
import { zipSync, strToU8 } from "fflate";
import {
  extractZipEntries,
  findTranscriptText,
  extractImageFilesByName,
  contentTypeForFilename,
  InvalidExportError,
} from "@/lib/import/media";

function buildExport(opts: { txtName: string; transcript: string; images: Record<string, string> }) {
  const files: Record<string, Uint8Array> = { [opts.txtName]: strToU8(opts.transcript) };
  for (const [name, content] of Object.entries(opts.images)) files[name] = strToU8(content);
  return zipSync(files);
}

describe("extractZipEntries / findTranscriptText / extractImageFilesByName", () => {
  it("finds the Android-style _chat.txt transcript", () => {
    const zip = buildExport({ txtName: "_chat.txt", transcript: "hello world", images: {} });
    const entries = extractZipEntries(zip);
    expect(findTranscriptText(entries)).toBe("hello world");
  });

  it("finds an iOS-style 'WhatsApp Chat with X.txt' transcript", () => {
    const zip = buildExport({ txtName: "WhatsApp Chat with Ali Tutor.txt", transcript: "hi there", images: {} });
    const entries = extractZipEntries(zip);
    expect(findTranscriptText(entries)).toBe("hi there");
  });

  it("extracts image files keyed by bare filename", () => {
    const zip = buildExport({
      txtName: "_chat.txt",
      transcript: "...",
      images: { "IMG-20261012-WA0001.jpg": "fake-jpg-bytes", "IMG-20261012-WA0002.png": "fake-png-bytes" },
    });
    const entries = extractZipEntries(zip);
    const images = extractImageFilesByName(entries);
    expect(images.size).toBe(2);
    expect(images.get("IMG-20261012-WA0001.jpg")?.toString()).toBe("fake-jpg-bytes");
    expect(images.get("IMG-20261012-WA0002.png")?.toString()).toBe("fake-png-bytes");
  });

  it("throws InvalidExportError when no .txt entry exists", () => {
    const zip = zipSync({ "photo.jpg": strToU8("bytes") });
    const entries = extractZipEntries(zip);
    expect(() => findTranscriptText(entries)).toThrow(InvalidExportError);
  });

  it("throws InvalidExportError on garbage (non-zip) bytes", () => {
    const garbage = new Uint8Array([1, 2, 3, 4, 5]);
    expect(() => extractZipEntries(garbage)).toThrow(InvalidExportError);
  });
});

describe("contentTypeForFilename", () => {
  it("maps known extensions to their mime type", () => {
    expect(contentTypeForFilename("a.jpg")).toBe("image/jpeg");
    expect(contentTypeForFilename("a.jpeg")).toBe("image/jpeg");
    expect(contentTypeForFilename("a.png")).toBe("image/png");
    expect(contentTypeForFilename("a.webp")).toBe("image/webp");
    expect(contentTypeForFilename("a.gif")).toBe("image/gif");
  });

  it("falls back to jpeg for an unrecognised extension", () => {
    expect(contentTypeForFilename("a.heic")).toBe("image/jpeg");
  });
});
