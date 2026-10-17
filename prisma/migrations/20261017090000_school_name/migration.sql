-- The school/college a tutor studied at, and the school a student goes to (2026-10-17).
ALTER TABLE "Tutor" ADD COLUMN "schoolName" TEXT;
ALTER TABLE "ParentRequest" ADD COLUMN "schoolName" TEXT;
