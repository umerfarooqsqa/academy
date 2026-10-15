// Public website content — admin-editable (new 2026-10-13 feature: a real
// client-facing website, managed from the admin dashboard). Stored in the
// existing SystemState singleton table (CLAUDE.md Section 5 — "a generic,
// reusable key-value slot", already used the same way by
// lib/opportunities/digest.ts's last-digest-posted-at tracking) rather than a
// new Prisma model — one row, one JSON blob, no migration needed.
//
// 2026-10-15 professional redesign: titled how-it-works steps, FAQs, and
// contact details (WhatsApp / phone / service area) were added. Claims in the
// defaults are only the ones the operator confirmed are true: free demo
// class, home and online tuition, male and female tutors, every class from
// primary to university.

import { prisma } from "@/lib/db";

const STATE_KEY = "site_content";

export interface HowItWorksStep {
  title: string;
  text: string;
}

export interface Faq {
  q: string;
  a: string;
  audience: "parent" | "tutor";
}

export interface SiteContent {
  siteName: string;
  heroHeadline: string;
  /** The description in Google results/link previews — not shown on the page (2026-10-15). */
  heroSubheadline: string;
  heroEyebrow: string;
  howItWorksSteps: HowItWorksStep[];
  parentPitch: string;
  tutorPitch: string;
  testimonials: { name: string; quote: string }[];
  faqs: Faq[];
  /** Shown on /privacy and /contact, and in the footer (2026-10-15). Empty = hidden. */
  contactEmail: string;
  /** Business WhatsApp number — the floating chat button, /contact and the footer. Empty = hidden. */
  whatsappNumber: string;
  /** Phone number for calls — /contact and the footer. Empty = hidden. */
  phoneNumber: string;
  /** e.g. "Karachi" — /contact, the footer and the FAQ. */
  serviceArea: string;
  /** One line under the logo in the footer. */
  footerTagline: string;
  /** Google Business Profile Place ID — enables the live Google rating/reviews
   * section on the homepage (lib/google/reviews.ts, 2026-10-15). Empty = hidden. */
  googlePlaceId: string;
  /** Facebook Page link shown in the public footer (2026-10-15). Empty = hidden. */
  facebookUrl: string;
}

// Copy keeps the real substance of CLAUDE.md Section 11's brand positioning
// (hyperlocal guarantee, speed, curation, premium-not-cheapest). Used until
// the operator edits it from /website-content.
export const DEFAULT_SITE_CONTENT: SiteContent = {
  siteName: "Lili Tutor Academy",
  heroEyebrow: "Verified tutors from your own neighbourhood",
  heroHeadline: "The right tutor is closer than you think.",
  heroSubheadline:
    "Home and online tutors for every class — primary, Matric, O/A-levels, FSc, Computer Science, skills and university — ID-checked, grade-verified and from your own area. Your first demo class is free.",
  howItWorksSteps: [
    {
      title: "Tell us what you need",
      text: "Share the subject, class and your area — on our website or WhatsApp. It takes about two minutes.",
    },
    {
      title: "We shortlist tutors near you",
      text: "We hand-pick a few ID-checked tutors from your own area who are strong in exactly those subjects — usually within hours.",
    },
    {
      title: "Choose your tutor",
      text: "Look through the short list and pick the tutor you like. Prefer a female or male tutor? Just tell us.",
    },
    {
      title: "Free demo class",
      text: "Meet the tutor in a free demo class, at home or online, and see if they're the right fit.",
    },
    {
      title: "Start lessons",
      text: "Happy with the demo? Confirm the first month and lessons begin. Not the right fit? We'll find you another tutor.",
    },
  ],
  parentPitch:
    "No endless scrolling through directories. Just a short, curated list of tutors from your own area who are genuinely strong in what your child needs.",
  tutorPitch:
    "Teach students near you, not across town. Less commuting, more teaching — matched to the subjects you're actually great at.",
  testimonials: [],
  faqs: [
    {
      audience: "parent",
      q: "How do you match tutors?",
      a: "We look at the subjects and class you need, your area, and the times that suit you. Only tutors from your own area (or nearby) who teach those subjects are considered, and we rank them by their grades in those subjects, ratings from other parents and availability. Our team checks every match before you see it.",
    },
    {
      audience: "parent",
      q: "Is the demo class free?",
      a: "Yes. Your first demo class with the tutor you choose is free, so you can see if they're the right fit before committing.",
    },
    {
      audience: "parent",
      q: "Can I ask for a female or male tutor?",
      a: "Yes. Just tell us your preference when you request a tutor and we'll only suggest tutors who match it.",
    },
    {
      audience: "parent",
      q: "Do you offer home tuition and online classes?",
      a: "Both. Choose home tuition, online, or either when you request a tutor. For home tuition we only suggest tutors from your own area, so they're never travelling across town.",
    },
    {
      audience: "parent",
      q: "Which classes and subjects do you cover?",
      a: "Every class from primary to university: primary and Matric, O and A-levels, FSc/Intermediate (pre-medical and pre-engineering), Computer Science, skills courses and university subjects.",
    },
    {
      audience: "parent",
      q: "How do you check tutors?",
      a: "Every tutor shares their CNIC and marksheets. Our team checks the ID by hand, and tutors marked “Grades verified” have had their marksheets checked against the grades they told us.",
    },
    {
      audience: "parent",
      q: "How do I pay?",
      a: "Nothing is due before the free demo. Once you're happy with the tutor, you pay the first month's fee through us — we'll send you the payment details on WhatsApp.",
    },
    {
      audience: "parent",
      q: "What if the tutor isn't right for us?",
      a: "Just let us know. We'll offer you another tutor from your area.",
    },
    {
      audience: "parent",
      q: "Which areas do you cover?",
      a: "We match tutors across Karachi's neighbourhoods. Use “What's near you?” on our homepage to see how many verified tutors are near you, or request a tutor and we'll tell you.",
    },
    {
      audience: "tutor",
      q: "How do I become a tutor?",
      a: "Register on our “Become a tutor” page — it takes about three minutes. Add your subjects, area, grades and a photo of your CNIC and marksheet, and we'll verify your profile.",
    },
    {
      audience: "tutor",
      q: "Is there a fee for tutors?",
      a: "Registering is free. When you're placed with a student, a matching fee is taken from the first month's fee — we'll explain the details before you accept a tuition. Contact us if you have questions.",
    },
    {
      audience: "tutor",
      q: "How do tuition jobs work?",
      a: "Open tuitions are listed on our Tuition jobs page with the subject, class and area (never the family's contact details). Tap “I'm interested”, enter your WhatsApp number, and we'll confirm with you.",
    },
  ],
  contactEmail: "",
  whatsappNumber: "",
  phoneNumber: "",
  serviceArea: "Karachi",
  footerTagline: "Verified home and online tutors from your own neighbourhood.",
  googlePlaceId: "",
  facebookUrl: "https://www.facebook.com/Lilitutoracademy/",
};

// Values that were the defaults before the 2026-10-15 redesign: a saved copy
// still holding one of these was never edited, so it gets the new default.
const OLD_DEFAULTS: Partial<Record<keyof SiteContent, string>> = {
  heroSubheadline:
    "We match you with vetted, grade-verified tutors for O/A-levels, FSc, Computer Science, Skills, and university subjects — right from your own area, usually within hours.",
};

/** Saved JSON (possibly from an older version) → complete SiteContent. Pure. */
export function normalizeSiteContent(parsed: Record<string, unknown>): SiteContent {
  const merged = { ...DEFAULT_SITE_CONTENT, ...parsed } as SiteContent & { howItWorks?: unknown };
  for (const [key, old] of Object.entries(OLD_DEFAULTS)) {
    const k = key as keyof SiteContent;
    if (merged[k] === old) (merged as unknown as Record<string, unknown>)[k] = DEFAULT_SITE_CONTENT[k];
  }
  // The old 3-step `howItWorks: string[]` is retired in favour of the titled
  // 5-step flow (the saved steps were never edited — 2026-10-15).
  delete merged.howItWorks;
  if (!Array.isArray(merged.howItWorksSteps)) merged.howItWorksSteps = DEFAULT_SITE_CONTENT.howItWorksSteps;
  if (!Array.isArray(merged.faqs)) merged.faqs = DEFAULT_SITE_CONTENT.faqs;
  if (!Array.isArray(merged.testimonials)) merged.testimonials = [];
  return merged;
}

export async function getSiteContent(): Promise<SiteContent> {
  const row = await prisma.systemState.findUnique({ where: { key: STATE_KEY } });
  if (!row) return DEFAULT_SITE_CONTENT;
  try {
    return normalizeSiteContent(JSON.parse(row.value));
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

/** Digits-only form of a phone number for wa.me / tel: links ("0300 1234567" → "923001234567"). */
export function internationalDigits(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 11) return `92${digits.slice(1)}`;
  return digits;
}
