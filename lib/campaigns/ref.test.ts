import { describe, expect, it } from "vitest";
import { normalizeRef } from "./ref";
import { readStoredRef } from "@/app/(public)/campaignRef";

describe("normalizeRef", () => {
  it("accepts campaign ids and Meta ad ids", () => {
    expect(normalizeRef(" cmv7z13020004kkvm5ky21b0f ")).toBe("cmv7z13020004kkvm5ky21b0f");
    expect(normalizeRef("120210000123456789")).toBe("120210000123456789");
  });

  it("rejects missing, odd or oversized values", () => {
    expect(normalizeRef(undefined)).toBeNull();
    expect(normalizeRef("")).toBeNull();
    expect(normalizeRef("{{ad.id}}")).toBeNull(); // Meta placeholder not filled in
    expect(normalizeRef("a b")).toBeNull();
    expect(normalizeRef("x".repeat(65))).toBeNull();
  });
});

describe("readStoredRef (30-day memory on the visitor's device)", () => {
  const now = Date.UTC(2026, 9, 15);
  const day = 86_400_000;
  it("returns a stored ref within 30 days", () => {
    expect(readStoredRef(JSON.stringify({ ref: "abc", at: now - 29 * day }), now)).toBe("abc");
  });
  it("expires after 30 days", () => {
    expect(readStoredRef(JSON.stringify({ ref: "abc", at: now - 31 * day }), now)).toBeNull();
  });
  it("ignores missing or corrupted values", () => {
    expect(readStoredRef(null, now)).toBeNull();
    expect(readStoredRef("not json", now)).toBeNull();
    expect(readStoredRef(JSON.stringify({ ref: 5, at: now }), now)).toBeNull();
  });
});
