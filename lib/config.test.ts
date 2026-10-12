import { describe, it, expect } from "vitest";
import { splitPayment } from "@/lib/config";

describe("splitPayment", () => {
  it("splits at the configured commission percent (default 50)", () => {
    expect(splitPayment(10000)).toEqual({ commission: 5000, tutorPayout: 5000 });
  });
  it("keeps commission + payout equal to the original amount", () => {
    const { commission, tutorPayout } = splitPayment(9999);
    expect(commission + tutorPayout).toBe(9999);
  });
});
