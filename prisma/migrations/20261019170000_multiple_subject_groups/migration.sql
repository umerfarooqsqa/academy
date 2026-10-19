-- Several categories per tutor / parent request (2026-10-19). subjectGroup
-- stays as the first ("main") one; existing rows get their single category.
ALTER TABLE "Tutor" ADD COLUMN "subjectGroups" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "ParentRequest" ADD COLUMN "subjectGroups" TEXT[] DEFAULT ARRAY[]::TEXT[];

UPDATE "Tutor" SET "subjectGroups" = ARRAY["subjectGroup"];
UPDATE "ParentRequest" SET "subjectGroups" = ARRAY["subjectGroup"];
