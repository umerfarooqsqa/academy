-- SEO/GEO (2026-10-15): blog articles + optional local intro per area page.
ALTER TABLE "AreaZone" ADD COLUMN "description" TEXT;

CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");

-- Security rule (CLAUDE.md Section 4): every table gets RLS, no policies.
ALTER TABLE "Article" ENABLE ROW LEVEL SECURITY;
