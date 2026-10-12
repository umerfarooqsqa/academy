// Centralised runtime config, read from environment (CLAUDE.md Section 9).
// No secrets are hard-coded; all values come from env vars.

function required(name: string): string {
  const v = process.env[name];
  if (!v) {
    // Don't throw at import time in dev — routes that need a given var validate it
    // themselves so the dashboard can still boot without every integration configured.
    return "";
  }
  return v;
}

export const config = {
  commissionPercent: Number(process.env.COMMISSION_PERCENT ?? 50),
  premiumNotificationDelayMinutes: Number(
    process.env.PREMIUM_NOTIFICATION_DELAY_MINUTES ?? 60,
  ),
  ratingRequestDelayDays: Number(process.env.RATING_REQUEST_DELAY_DAYS ?? 30),
  adminWhatsappNumber: required("ADMIN_WHATSAPP_NUMBER"),
  // ADMIN_DASHBOARD_PASSWORD retired (2026-10 planning session) — replaced by
  // real per-user accounts (prisma User model). SESSION_SECRET is now its own
  // dedicated secret, no longer derived from a password being deleted.
  sessionSecret: required("SESSION_SECRET") || "dev-only-insecure-secret",
  // One-time bootstrap for the first admin account — see lib/auth/bootstrap.ts.
  // Inert once any User row exists.
  initialAdmin: {
    email: required("INITIAL_ADMIN_EMAIL"),
    password: required("INITIAL_ADMIN_PASSWORD"),
  },
  supabase: {
    url: required("SUPABASE_URL"),
    serviceKey: required("SUPABASE_SERVICE_KEY"),
    // Not in CLAUDE.md Section 9 — added for CNIC/marksheet storage (6.1 step
    // 10), flagged for operator sign-off (Section 2). Safe default.
    storageBucket: process.env.SUPABASE_STORAGE_BUCKET || "tutor-documents",
  },
  whatsapp: {
    token: required("WHATSAPP_CLOUD_API_TOKEN"),
    phoneNumberId: required("WHATSAPP_PHONE_NUMBER_ID"),
    verifyToken: required("WHATSAPP_VERIFY_TOKEN"),
  },
  llm: {
    groqApiKey: required("GROQ_API_KEY"),
    geminiApiKey: required("GEMINI_API_KEY"),
  },
  jazzcash: {
    merchantId: required("JAZZCASH_MERCHANT_ID"),
    password: required("JAZZCASH_PASSWORD"),
    integritySalt: required("JAZZCASH_INTEGRITY_SALT"),
  },
  facebook: {
    pageAccessToken: required("FACEBOOK_PAGE_ACCESS_TOKEN"),
    pageId: required("FACEBOOK_PAGE_ID"),
  },
  // Not in CLAUDE.md Section 9 — added for the neglected-parent alert (2026-10
  // planning session). Resend specifically chosen to keep this off the
  // WhatsApp cost budget (Section 1).
  email: {
    resendApiKey: required("RESEND_API_KEY"),
    fromEmail: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
    operatorEmail: required("OPERATOR_EMAIL"),
  },
} as const;

// Commission split for a collected payment (6.6/6.7). Commission percent is an env
// var / config constant per Section 4 (currently 50%, first month only — Section 1/9).
export function splitPayment(amount: number): { commission: number; tutorPayout: number } {
  const commission = Math.round((amount * config.commissionPercent) / 100);
  return { commission, tutorPayout: amount - commission };
}
