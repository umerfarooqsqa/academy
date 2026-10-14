import { describe, expect, it } from "vitest";
import { phoneKey, samePhone } from "./phone";

describe("phoneKey / samePhone", () => {
  it("treats local, +92 and WhatsApp-style formats as the same number", () => {
    expect(samePhone("0300 1234567", "923001234567")).toBe(true);
    expect(samePhone("+92 300 1234567", "0300-1234567")).toBe(true);
    expect(phoneKey("0300 1234567")).toBe("3001234567");
  });

  it("distinguishes different numbers", () => {
    expect(samePhone("0300 1234567", "0300 1234568")).toBe(false);
  });

  it("rejects numbers that are too short", () => {
    expect(phoneKey("12345")).toBeNull();
    expect(samePhone("12345", "12345")).toBe(false);
  });
});
