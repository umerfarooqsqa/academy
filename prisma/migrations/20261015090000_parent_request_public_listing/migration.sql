-- AlterTable
ALTER TABLE "ParentRequest" ADD COLUMN     "facebookPostedAt" TIMESTAMP(3),
ADD COLUMN     "opportunityCode" TEXT,
ADD COLUMN     "publicHiddenAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "ParentRequest_opportunityCode_key" ON "ParentRequest"("opportunityCode");
