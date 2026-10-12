// Fixed platform set for marketing spend/campaign attribution — not in CLAUDE.md
// Section 9/5, added for the marketing balance sheet + budget recommendation
// module. Plain string, not a Postgres enum, same pattern as lib/subjectGroups.ts
// — extensible for new platforms without a migration.

export const PLATFORMS = ["facebook", "instagram", "tiktok", "youtube", "other"] as const;

export type PlatformName = (typeof PLATFORMS)[number];

export const PLATFORM_LABELS: Record<PlatformName, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  other: "Other",
};
