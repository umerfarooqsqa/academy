import { describe, it, expect } from "vitest";
import { computeLiveTier, isSubscriptionActive } from "@/lib/tutors/tier";

const now = new Date("2026-06-15");

describe("computeLiveTier (CLAUDE.md 6.5 — checked live, never cached)", () => {
  it("is free with no subscriptions", () => {
    expect(computeLiveTier([], now)).toBe("free");
  });

  it("is premium with an active subscription covering now", () => {
    const subs = [{ status: "active", periodStart: new Date("2026-06-01"), periodEnd: new Date("2026-07-01") }];
    expect(computeLiveTier(subs, now)).toBe("premium");
  });

  it("demotes to free the moment a subscription lapses past periodEnd — not just at renewal time", () => {
    const subs = [{ status: "active", periodStart: new Date("2026-01-01"), periodEnd: new Date("2026-02-01") }];
    expect(computeLiveTier(subs, now)).toBe("free");
  });

  it("ignores a subscription explicitly marked lapsed/cancelled even within its date window", () => {
    const subs = [{ status: "lapsed", periodStart: new Date("2026-06-01"), periodEnd: new Date("2026-07-01") }];
    expect(computeLiveTier(subs, now)).toBe("free");
    expect(isSubscriptionActive(subs[0], now)).toBe(false);
  });

  it("is premium if ANY subscription row is currently active, even with older lapsed rows", () => {
    const subs = [
      { status: "lapsed", periodStart: new Date("2026-01-01"), periodEnd: new Date("2026-02-01") },
      { status: "active", periodStart: new Date("2026-06-01"), periodEnd: new Date("2026-07-01") },
    ];
    expect(computeLiveTier(subs, now)).toBe("premium");
  });
});
