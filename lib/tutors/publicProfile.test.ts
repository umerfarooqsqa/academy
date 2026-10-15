import { describe, expect, it } from "vitest";
import { displayName, parseEducation, parseExperience, toPublicProfile } from "./publicProfile";

describe("displayName", () => {
  it("shows first name + last initial", () => {
    expect(displayName("Ayesha Khan")).toBe("Ayesha K.");
    expect(displayName("  muhammad ali raza ")).toBe("muhammad R.");
    expect(displayName("Sara")).toBe("Sara");
    expect(displayName("")).toBe("Tutor");
  });
});

describe("experience / education parsing", () => {
  it("keeps well-formed entries and drops empty ones", () => {
    expect(parseExperience([{ title: "Chemistry tutor", place: "Home tuition", period: "2022 – now", description: "O/A-level" }, {}, "junk"])).toEqual([
      { title: "Chemistry tutor", place: "Home tuition", period: "2022 – now", description: "O/A-level" },
    ]);
    expect(parseEducation([{ degree: "MBBS", institution: "DOW", year: "2027" }, { degree: " " }])).toEqual([
      { degree: "MBBS", institution: "DOW", year: "2027" },
    ]);
    expect(parseExperience(null)).toEqual([]);
  });
});

describe("toPublicProfile", () => {
  const row = {
    id: "t1",
    name: "Ayesha Khan",
    profilePhotoUrl: null,
    profileHeadline: "  MBBS student  ",
    profileBio: "",
    qualification: "A-levels",
    area: "PECHS",
    deliveryMode: "both",
    subjects: ["Biology"],
    subjectGroup: "pre_medical",
    curriculum: "A-levels",
    gradesBySubject: { Biology: "A*", Chemistry: " " },
    gradesVerifiedAt: null,
    yearsExperience: 3,
    profileExperience: [],
    profileEducation: [],
    rating: 0,
    ratingCount: 0,
  };

  it("exposes only public fields, tidied", () => {
    const p = toPublicProfile(row);
    expect(p).toMatchObject({ displayName: "Ayesha K.", headline: "MBBS student", bio: null, grades: [{ subject: "Biology", grade: "A*" }], gradesVerified: false, rating: null });
    expect(Object.keys(p)).not.toContain("name");
    expect(JSON.stringify(p)).not.toMatch(/whatsapp|cnic|expectedFee|latitude/i);
  });

  it("marks grades verified and shows a rating once rated", () => {
    const p = toPublicProfile({ ...row, gradesVerifiedAt: new Date(), rating: 4.5, ratingCount: 2 });
    expect(p.gradesVerified).toBe(true);
    expect(p.rating).toBe(4.5);
  });
});
