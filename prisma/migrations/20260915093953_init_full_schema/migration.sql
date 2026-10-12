-- CreateTable
CREATE TABLE "Tutor" (
    "id" TEXT NOT NULL,
    "whatsappId" TEXT NOT NULL,
    "campaignId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "qualification" TEXT NOT NULL,
    "subjects" TEXT[],
    "subjectGroup" TEXT NOT NULL,
    "curriculum" TEXT NOT NULL,
    "gradesBySubject" JSONB,
    "cnicImageUrl" TEXT,
    "marksheetImageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "area" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "availability" TEXT[],
    "expectedFee" INTEGER,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "tier" TEXT NOT NULL DEFAULT 'free',
    "deliveryMode" TEXT NOT NULL DEFAULT 'in_person',
    "radiusOverrideKm" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "internalNote" TEXT,
    "rawMessage" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tutor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TutorSubscription" (
    "id" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "amount" INTEGER NOT NULL,
    "paymentMethod" TEXT,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TutorSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParentRequest" (
    "id" TEXT NOT NULL,
    "whatsappId" TEXT NOT NULL,
    "campaignId" TEXT,
    "studentInfo" TEXT,
    "subjects" TEXT[],
    "subjectGroup" TEXT NOT NULL,
    "curriculum" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "budget" INTEGER,
    "deliveryMode" TEXT NOT NULL DEFAULT 'in_person',
    "availability" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'pending',
    "internalNote" TEXT,
    "rawMessage" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParentRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntakeSession" (
    "id" TEXT NOT NULL,
    "whatsappId" TEXT NOT NULL,
    "senderType" TEXT NOT NULL,
    "step" TEXT NOT NULL,
    "partialData" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntakeSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AreaZone" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "maxKm" DOUBLE PRECISION NOT NULL DEFAULT 6,

    CONSTRAINT "AreaZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "parentRequestId" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'awaiting_approval',
    "internalNote" TEXT,
    "opportunityCode" TEXT,
    "notifyAt" TIMESTAMP(3),
    "publishedToPageAt" TIMESTAMP(3),
    "interestedTutorId" TEXT,
    "demoSlots" JSONB,
    "demoScheduledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalLog" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApprovalLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "commission" INTEGER NOT NULL,
    "tutorPayout" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "provider" TEXT NOT NULL DEFAULT 'jazzcash',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ratingRequestedAt" TIMESTAMP(3),

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rating" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "stars" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketingSpend" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT,
    "channel" TEXT NOT NULL,
    "area" TEXT,
    "amount" INTEGER NOT NULL,
    "spentOn" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketingSpend_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemState" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemState_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "area" TEXT,
    "audienceNote" TEXT,
    "metaAdId" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessedInboundMessage" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessedInboundMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tutor_whatsappId_key" ON "Tutor"("whatsappId");

-- CreateIndex
CREATE INDEX "Tutor_status_idx" ON "Tutor"("status");

-- CreateIndex
CREATE INDEX "Tutor_campaignId_idx" ON "Tutor"("campaignId");

-- CreateIndex
CREATE INDEX "Tutor_area_idx" ON "Tutor"("area");

-- CreateIndex
CREATE INDEX "TutorSubscription_tutorId_idx" ON "TutorSubscription"("tutorId");

-- CreateIndex
CREATE INDEX "ParentRequest_status_idx" ON "ParentRequest"("status");

-- CreateIndex
CREATE INDEX "ParentRequest_campaignId_idx" ON "ParentRequest"("campaignId");

-- CreateIndex
CREATE INDEX "ParentRequest_area_idx" ON "ParentRequest"("area");

-- CreateIndex
CREATE UNIQUE INDEX "IntakeSession_whatsappId_key" ON "IntakeSession"("whatsappId");

-- CreateIndex
CREATE UNIQUE INDEX "AreaZone_name_key" ON "AreaZone"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Match_opportunityCode_key" ON "Match"("opportunityCode");

-- CreateIndex
CREATE INDEX "Match_status_idx" ON "Match"("status");

-- CreateIndex
CREATE INDEX "Match_parentRequestId_idx" ON "Match"("parentRequestId");

-- CreateIndex
CREATE INDEX "Match_tutorId_idx" ON "Match"("tutorId");

-- CreateIndex
CREATE INDEX "ApprovalLog_matchId_idx" ON "ApprovalLog"("matchId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Payment_matchId_idx" ON "Payment"("matchId");

-- CreateIndex
CREATE INDEX "Rating_tutorId_idx" ON "Rating"("tutorId");

-- CreateIndex
CREATE INDEX "Rating_matchId_idx" ON "Rating"("matchId");

-- CreateIndex
CREATE INDEX "MarketingSpend_campaignId_idx" ON "MarketingSpend"("campaignId");

-- CreateIndex
CREATE INDEX "MarketingSpend_spentOn_idx" ON "MarketingSpend"("spentOn");

-- CreateIndex
CREATE UNIQUE INDEX "Campaign_metaAdId_key" ON "Campaign"("metaAdId");

-- AddForeignKey
ALTER TABLE "Tutor" ADD CONSTRAINT "Tutor_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutorSubscription" ADD CONSTRAINT "TutorSubscription_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "Tutor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentRequest" ADD CONSTRAINT "ParentRequest_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_parentRequestId_fkey" FOREIGN KEY ("parentRequestId") REFERENCES "ParentRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "Tutor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalLog" ADD CONSTRAINT "ApprovalLog_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "Tutor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingSpend" ADD CONSTRAINT "MarketingSpend_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
