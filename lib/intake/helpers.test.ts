import { describe, it, expect } from "vitest";
import {
  parseSenderType,
  mergeDraft,
  missingTutorFields,
  missingParentFields,
  nextTutorFollowup,
  looksLikeCallRequest,
  type TutorDraft,
} from "@/lib/intake/helpers";

describe("parseSenderType", () => {
  it("detects tutor", () => {
    expect(parseSenderType("tutor")).toBe("tutor");
    expect(parseSenderType("I am a teacher")).toBe("tutor");
  });
  it("detects parent", () => {
    expect(parseSenderType("parent")).toBe("parent");
    expect(parseSenderType("I'm looking for a tutor for my son")).toBe("parent");
  });
  it("returns null when unclear or contradictory", () => {
    expect(parseSenderType("hello")).toBeNull();
    expect(parseSenderType("I am a tutor and also a parent")).toBeNull();
  });
});

describe("mergeDraft", () => {
  it("keeps earlier answers when a later extraction omits them", () => {
    const base: TutorDraft = { name: "Ali", subjects: ["Chemistry"] };
    const merged = mergeDraft<TutorDraft>(base, { area: "Clifton", subjects: null });
    expect(merged).toEqual({ name: "Ali", subjects: ["Chemistry"], area: "Clifton" });
  });
  it("ignores empty arrays", () => {
    const merged = mergeDraft<TutorDraft>({ subjects: ["Bio"] }, { subjects: [] });
    expect(merged.subjects).toEqual(["Bio"]);
  });
});

describe("missing field checks", () => {
  it("lists all required tutor fields when draft is empty", () => {
    expect(missingTutorFields({})).toEqual([
      "name",
      "area",
      "subjects",
      "subjectGroup",
      "curriculum",
      "qualification",
      "gradesBySubject",
      "availability",
    ]);
  });
  it("does not require expectedFee/email/phone", () => {
    const full: TutorDraft = {
      name: "A",
      area: "B",
      subjects: ["C"],
      subjectGroup: "pre_medical",
      curriculum: "Cambridge",
      qualification: "BSc",
      gradesBySubject: { C: "A" },
      availability: ["weekday_evening"],
    };
    expect(missingTutorFields(full)).toEqual([]);
  });
  it("treats an empty gradesBySubject object as missing, not present", () => {
    expect(missingTutorFields({ gradesBySubject: {} })).toContain("gradesBySubject");
  });
  it("parent requires subjects/subjectGroup/curriculum/area (not budget)", () => {
    expect(
      missingParentFields({ subjects: ["Math"], subjectGroup: "pre_engineering", curriculum: "A-level", area: "DHA" }),
    ).toEqual([]);
    expect(
      missingParentFields({ subjects: ["Math"], subjectGroup: "pre_engineering", curriculum: "A-level" }),
    ).toEqual(["area"]);
  });
});

describe("nextTutorFollowup", () => {
  it("follows the §13 priority order", () => {
    expect(nextTutorFollowup({})).toBe("name");
    expect(nextTutorFollowup({ name: "Ali" })).toBe("area");
    expect(nextTutorFollowup({ name: "Ali", area: "Clifton", subjects: ["Bio"] })).toBe("subjectGroup");
  });
});

describe("looksLikeCallRequest", () => {
  it("matches common phrasings", () => {
    expect(looksLikeCallRequest("call me")).toBe(true);
    expect(looksLikeCallRequest("please call me")).toBe(true);
    expect(looksLikeCallRequest("can you ring me")).toBe(true);
  });
  it("does not match unrelated text", () => {
    expect(looksLikeCallRequest("my budget is 15000")).toBe(false);
  });
});
