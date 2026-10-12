// Zod schemas for LLM extraction output (CLAUDE.md 6.2 — "validate with zod
// before writing to the DB — never trust raw LLM output unchecked").

import { z } from "zod";
import { AVAILABILITY_TAGS } from "@/lib/messages";
import { SUBJECT_GROUPS } from "@/lib/subjectGroups";

const availabilityArray = z
  .array(z.enum(AVAILABILITY_TAGS))
  .nullable()
  // Defensive: drop any tag the model invented outside the fixed set instead of
  // failing the whole extraction.
  .catch(null);

const subjectGroupField = z
  .enum(SUBJECT_GROUPS)
  .nullable()
  // Defensive: an invented category outside the fixed set is treated as unknown
  // rather than failing the whole extraction.
  .catch(null);

export const tutorExtractionSchema = z.object({
  name: z.string().min(1).nullable(),
  email: z.string().min(1).nullable(),
  phone: z.string().min(1).nullable(),
  qualification: z.string().min(1).nullable(),
  subjects: z.array(z.string().min(1)).nullable(),
  subjectGroup: subjectGroupField,
  curriculum: z.string().min(1).nullable(),
  gradesBySubject: z.record(z.string(), z.string()).nullable(),
  area: z.string().min(1).nullable(),
  availability: availabilityArray,
  expectedFee: z.number().int().positive().nullable(),
  missingFields: z.array(z.string()),
});

export const parentExtractionSchema = z.object({
  studentInfo: z.string().min(1).nullable(),
  subjects: z.array(z.string().min(1)).nullable(),
  subjectGroup: subjectGroupField,
  curriculum: z.string().min(1).nullable(),
  area: z.string().min(1).nullable(),
  deliveryMode: z.enum(["in_person", "online", "both"]).nullable().catch(null),
  budget: z.number().int().positive().nullable(),
  availability: availabilityArray,
  missingFields: z.array(z.string()),
});

export type TutorExtraction = z.infer<typeof tutorExtractionSchema>;
export type ParentExtraction = z.infer<typeof parentExtractionSchema>;

export function schemaFor(senderType: "tutor" | "parent") {
  return senderType === "tutor" ? tutorExtractionSchema : parentExtractionSchema;
}
