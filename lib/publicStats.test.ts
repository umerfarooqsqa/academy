import { describe, expect, it } from "vitest";
import { visibleStats } from "./publicStats";

describe("visibleStats", () => {
  it("hides counts below 10 and hides the band when only areas would show", () => {
    expect(visibleStats({ areas: 8, verifiedTutors: 9, studentsPlaced: 0 })).toEqual([]);
  });

  it("shows each count once it reaches 10, with areas alongside", () => {
    expect(visibleStats({ areas: 8, verifiedTutors: 10, studentsPlaced: 3 })).toEqual([
      { value: 10, label: "Verified tutors" },
      { value: 8, label: "Areas covered" },
    ]);
    expect(visibleStats({ areas: 8, verifiedTutors: 25, studentsPlaced: 12 }).map((s) => s.label)).toEqual([
      "Verified tutors",
      "Students placed",
      "Areas covered",
    ]);
  });
});
