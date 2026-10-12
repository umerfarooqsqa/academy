// Live tier derivation (CLAUDE.md Section 5 Tutor.tier comment, 6.5). A tutor's
// premium perks depend on having an ACTIVE subscription whose period covers
// `now` — never cached on Tutor, always checked live, so a lapsed subscription
// demotes a tutor to free-tier treatment on the very next match, not just at
// renewal time (Section 14 success criteria).

export interface SubscriptionPeriod {
  status: string; // active | lapsed | cancelled
  periodStart: Date;
  periodEnd: Date;
}

export function isSubscriptionActive(sub: SubscriptionPeriod, now: Date = new Date()): boolean {
  return sub.status === "active" && now >= sub.periodStart && now <= sub.periodEnd;
}

export function computeLiveTier(
  subscriptions: SubscriptionPeriod[],
  now: Date = new Date(),
): "free" | "premium" {
  return subscriptions.some((s) => isSubscriptionActive(s, now)) ? "premium" : "free";
}
