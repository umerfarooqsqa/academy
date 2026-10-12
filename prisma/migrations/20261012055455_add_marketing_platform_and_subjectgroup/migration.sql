-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "platform" TEXT,
ADD COLUMN     "subjectGroup" TEXT;

-- AlterTable
ALTER TABLE "MarketingSpend" ADD COLUMN     "platform" TEXT,
ADD COLUMN     "subjectGroup" TEXT;
