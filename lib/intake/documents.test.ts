import { describe, it, expect } from "vitest";
import {
  classifyDocumentSlot,
  extensionForMime,
  buildDocumentStoragePath,
  shouldAutoFinalize,
  MAX_MARKSHEET_IMAGES,
} from "@/lib/intake/documents";

describe("classifyDocumentSlot (CLAUDE.md 6.1 step 10)", () => {
  it("classifies the first image (no CNIC yet) as cnic", () => {
    expect(classifyDocumentSlot(false)).toBe("cnic");
  });
  it("classifies every subsequent image (CNIC already set) as marksheet", () => {
    expect(classifyDocumentSlot(true)).toBe("marksheet");
  });
});

describe("extensionForMime", () => {
  it("maps common image mime types", () => {
    expect(extensionForMime("image/jpeg")).toBe("jpg");
    expect(extensionForMime("image/png")).toBe("png");
    expect(extensionForMime("image/webp")).toBe("webp");
  });
  it("is case-insensitive", () => {
    expect(extensionForMime("IMAGE/PNG")).toBe("png");
  });
  it("falls back to jpg for an unrecognised or missing mime type", () => {
    expect(extensionForMime("application/pdf")).toBe("jpg");
    expect(extensionForMime(undefined)).toBe("jpg");
  });
});

describe("buildDocumentStoragePath", () => {
  it("builds a path under tutors/<whatsappId>/<kind>-<timestamp>.<ext>", () => {
    const path = buildDocumentStoragePath("923001110001", "cnic", "jpg", 1700000000000);
    expect(path).toBe("tutors/923001110001/cnic-1700000000000.jpg");
  });
  it("strips non-alphanumeric characters from whatsappId (path safety)", () => {
    const path = buildDocumentStoragePath("+92 300-111-0001", "marksheet", "png", 1);
    expect(path).toBe("tutors/923001110001/marksheet-1.png");
  });
});

describe("shouldAutoFinalize", () => {
  it("is false below the marksheet image cap", () => {
    expect(shouldAutoFinalize(MAX_MARKSHEET_IMAGES - 1)).toBe(false);
  });
  it("is true exactly at the cap", () => {
    expect(shouldAutoFinalize(MAX_MARKSHEET_IMAGES)).toBe(true);
  });
  it("is true beyond the cap", () => {
    expect(shouldAutoFinalize(MAX_MARKSHEET_IMAGES + 1)).toBe(true);
  });
});
