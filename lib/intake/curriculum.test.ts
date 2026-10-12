import { describe, it, expect } from "vitest";
import { classifyCurriculum } from "@/lib/intake/curriculum";

describe("classifyCurriculum (CLAUDE.md 6.1 step 7 — expanded scope, Section 1)", () => {
  it.each([
    "Cambridge",
    "CAIE",
    "Edexcel",
    "British curriculum",
    "O-level",
    "O levels",
    "A-Levels",
    "AS level",
    "IGCSE",
    "I teach Cambridge O and A levels",
    "FSc Pre-Medical",
    "FSc Pre-Engineering",
    "Intermediate",
    "Computer Science",
    "BS Computer Science",
    "University level",
  ])("accepts %s (in scope under the expanded plan)", (input) => {
    expect(classifyCurriculum(input)).toBe("accept");
  });

  it.each(["Matric", "matric only", "SSC", "grade 9", "grade 10", "9th class", "10th class"])(
    "declines %s (still excluded)",
    (input) => {
      expect(classifyCurriculum(input)).toBe("decline");
    },
  );

  it("does NOT decline when a higher-tier signal accompanies a decline keyword", () => {
    // e.g. "moving from matric to A-levels" — a higher-tier signal must win.
    expect(classifyCurriculum("was doing matric, now switching to A-levels")).toBe("accept");
    expect(classifyCurriculum("matric to FSc transition")).toBe("accept");
  });

  it("is ambiguous for empty / unknown input", () => {
    expect(classifyCurriculum(null)).toBe("ambiguous");
    expect(classifyCurriculum("")).toBe("ambiguous");
    expect(classifyCurriculum("science stream")).toBe("ambiguous");
  });

  it("is ambiguous for a bare board mention with no decline or accept keyword", () => {
    // "board" alone is not in the decline list per the current spec — a false
    // decline costs more than one manual check, so this goes to manual review.
    expect(classifyCurriculum("Federal Board")).toBe("ambiguous");
    expect(classifyCurriculum("Sindh Board")).toBe("ambiguous");
  });

  it("is ambiguous when the LLM itself flagged uncertainty", () => {
    expect(classifyCurriculum("something unclear", true)).toBe("ambiguous");
  });
});
