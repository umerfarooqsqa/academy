-- Evidence of the Tutor Agreement / Terms a tutor accepted on /become-a-tutor (2026-10-19).
-- CreateTable
CREATE TABLE "TermsAcceptance" (
    "id" TEXT NOT NULL,
    "tutorId" TEXT,
    "document" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "updatedOn" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "whatsappId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TermsAcceptance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TermsAcceptance_tutorId_idx" ON "TermsAcceptance"("tutorId");

-- AddForeignKey
ALTER TABLE "TermsAcceptance" ADD CONSTRAINT "TermsAcceptance_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "Tutor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Row-Level Security on every table (CLAUDE.md Section 4 security hardening).
ALTER TABLE "TermsAcceptance" ENABLE ROW LEVEL SECURITY;
