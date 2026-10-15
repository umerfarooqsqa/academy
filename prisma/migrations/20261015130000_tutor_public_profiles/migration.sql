-- AlterTable
ALTER TABLE "ParentRequest" ADD COLUMN     "preferredTutorId" TEXT;

-- AlterTable
ALTER TABLE "Tutor" ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "gradesVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "profileBio" TEXT,
ADD COLUMN     "profileEducation" JSONB,
ADD COLUMN     "profileExperience" JSONB,
ADD COLUMN     "profileHeadline" TEXT,
ADD COLUMN     "profilePhotoUrl" TEXT,
ADD COLUMN     "yearsExperience" INTEGER;
