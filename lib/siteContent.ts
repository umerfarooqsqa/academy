// Public website content — admin-editable (new 2026-10-13 feature: a real
// client-facing website, managed from the admin dashboard). Stored in the
// existing SystemState singleton table (CLAUDE.md Section 5 — "a generic,
// reusable key-value slot", already used the same way by
// lib/opportunities/digest.ts's last-digest-posted-at tracking) rather than a
// new Prisma model — one row, one JSON blob, no migration needed.

import { prisma } from "@/lib/db";

const STATE_KEY = "site_content";

export interface SiteContent {
  siteName: string;
  heroHeadline: string;
  heroSubheadline: string;
  heroEyebrow: string;
  howItWorks: string[];
  parentPitch: string;
  tutorPitch: string;
  testimonials: { name: string; quote: string }[];
  /** Shown on /privacy as the address for data requests and questions (2026-10-15). */
  contactEmail: string;
  /** Google Business Profile Place ID — enables the live Google rating/reviews
   * section on the homepage (lib/google/reviews.ts, 2026-10-15). Empty = hidden. */
  googlePlaceId: string;
}

// Copy keeps the real substance of CLAUDE.md Section 11's brand positioning
// (hyperlocal guarantee, speed, curation, premium-not-cheapest) but phrased
// warmer and more conversational — 2026-10-13, operator feedback: the first
// pass read "too formal," wanted something playful and distinct. Used until
// the operator edits it from /website-content.
export const DEFAULT_SITE_CONTENT: SiteContent = {
  siteName: "Lili Tutor Academy",
  heroEyebrow: "Tutors from your own neighborhood 👋",
  heroHeadline: "The right tutor is closer than you think.",
  heroSubheadline:
    "We match you with vetted, grade-verified tutors for O/A-levels, FSc, Computer Science, Skills, and university subjects — right from your own area, usually within hours.",
  howItWorks: [
    "Tell us what you need — subject, level, your area. Takes two minutes.",
    "We hand-pick a short list of great tutors from your own neighborhood.",
    "Pick your favorite, lock in a demo, and you're off.",
  ],
  parentPitch:
    "No endless scrolling through directories. Just a short, curated list of tutors from your own area who are genuinely strong in what your child needs.",
  tutorPitch:
    "Teach students near you, not across town. Less commuting, more teaching — matched to the subjects you're actually great at.",
  testimonials: [],
  contactEmail: "",
  googlePlaceId: "",
};

export async function getSiteContent(): Promise<SiteContent> {
  const row = await prisma.systemState.findUnique({ where: { key: STATE_KEY } });
  if (!row) return DEFAULT_SITE_CONTENT;
  try {
    const parsed = JSON.parse(row.value);
    return { ...DEFAULT_SITE_CONTENT, ...parsed };
  } catch {
    return DEFAULT_SITE_CONTENT;
  }
}

export async function saveSiteContent(content: SiteContent): Promise<void> {
  const value = JSON.stringify(content);
  await prisma.systemState.upsert({
    where: { key: STATE_KEY },
    create: { key: STATE_KEY, value },
    update: { value },
  });
}
