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
}

// Copy drawn directly from CLAUDE.md Section 11's brand positioning — premium
// positioning, hyperlocal guarantee, speed, curation; never cheapest-price
// framing. Used until the operator edits it from /website-content.
export const DEFAULT_SITE_CONTENT: SiteContent = {
  siteName: "Academy",
  heroEyebrow: "Premium, vetted tutors — matched to your own area",
  heroHeadline: "Matched with the right tutor — from your own area, guaranteed.",
  heroSubheadline:
    "Vetted, grade-verified tutors for O/A-levels, FSc/Intermediate, Computer Science, Skills, and university-level subjects — matched within hours, not days.",
  howItWorks: [
    "Tell us what you're looking for — subject, level, and your area.",
    "We match you with a short list of vetted tutors from your own area, never a distant commute.",
    "Pick a tutor, schedule a demo, and get started.",
  ],
  parentPitch:
    "A short list of vetted options, not an overwhelming directory — matched only with a tutor from your own area, and specifically strong in the subjects you need.",
  tutorPitch:
    "Get matched with students close to you — save on travel time and fuel cost, and teach the subjects you're strongest in.",
  testimonials: [],
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
