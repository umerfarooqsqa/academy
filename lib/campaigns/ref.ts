// Campaign tracking for website leads (2026-10-15). Every Campaign has a
// tracking link — `?ref=<Campaign.id>` (copy it from /campaigns) — and Meta
// ads can instead use one generic link with Meta's dynamic parameter,
// `?ref={{ad.id}}`, which matches the campaign whose Campaign.metaAdId is set
// to that ad (the same field click-to-WhatsApp attribution uses, 6.1).
//
// The browser remembers the ref for 30 days (app/(public)/campaignRef.ts), and
// the parent/tutor web forms send it along; the intake routes resolve it here.
// An unknown or missing ref just means "unattributed" — a normal state (6.1).

import { prisma } from "@/lib/db";

/** Keeps only a plausible id: letters, digits, "-" and "_", at most 64 chars. */
export function normalizeRef(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const ref = raw.trim();
  return /^[A-Za-z0-9_-]{1,64}$/.test(ref) ? ref : null;
}

/** The Campaign.id a tracking ref points at (by campaign id or Meta ad id), or null. */
export async function resolveCampaignRef(raw: unknown): Promise<string | null> {
  const ref = normalizeRef(raw);
  if (!ref) return null;
  const campaign = await prisma.campaign.findFirst({
    where: { OR: [{ id: ref }, { metaAdId: ref }] },
    select: { id: true },
  });
  return campaign?.id ?? null;
}
