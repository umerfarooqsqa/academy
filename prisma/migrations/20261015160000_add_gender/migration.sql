-- Tutor gender + parent's tutor-gender preference (2026-10-15).
ALTER TABLE "Tutor" ADD COLUMN "gender" TEXT;
ALTER TABLE "ParentRequest" ADD COLUMN "tutorGenderPreference" TEXT NOT NULL DEFAULT 'any';
