-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "neglectAlertedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ParentRequest" ADD COLUMN     "neglectAlertedAt" TIMESTAMP(3);
