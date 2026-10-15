-- 2026-10-15 security hardening.
--
-- 1) Rate-limit bookkeeping (lib/security/rateLimit.ts).
CREATE TABLE "RateLimitHit" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateLimitHit_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "RateLimitHit_key_createdAt_idx" ON "RateLimitHit"("key", "createdAt");

-- 2) Row-Level Security on every table, with no policies: Supabase's
-- auto-generated REST/GraphQL API (anon/authenticated roles) can then read
-- nothing, even if a project API key leaks. The app connects as the table
-- owner (postgres, via Hyperdrive/DATABASE_URL), which RLS does not restrict,
-- so the website is unaffected. Any NEW table must get the same line.
ALTER TABLE "ApprovalLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AreaZone" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Campaign" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "IntakeSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MarketingSpend" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Match" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ParentRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProcessedInboundMessage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Rating" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SystemState" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Tutor" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TutorSubscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RateLimitHit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
