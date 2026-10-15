import { describe, expect, it } from "vitest";
import { displayName, parseEducation, parseExperience, parsePublicProfilePatch, toPublicProfile } from "./publicProfile";

describe("parsePublicProfilePatch", () => {
  it("only returns keys that were sent, tidied and capped", () => {
    const r = parsePublicProfilePatch({ profileHeadline: "  " + "x".repeat(200), profileBio: "   " });
    expect(r).toEqual({ data: { profileHeadline: "x".repeat(120), profileBio: null } });
  });

  it("validates flags and years", () => {
    expect(parsePublicProfilePatch({ featured: "yes" })).toHaveProperty("error");
    expect(parsePublicProfilePatch({ yearsExperience: 99 })).toHaveProperty("error");
    expect(parsePublicProfilePatch({ yearsExperience: "" })).toEqual({ data: { yearsExperience: null } });
    const r = parsePublicProfilePatch({ featured: true, gradesVerified: false, yearsExperience: "4" });
    expect(r).toEqual({ data: { featured: true, gradesVerifiedAt: null, yearsExperience: 4 } });
  });

  it("caps experience/education lists at 10 and drops empty rows", () => {
    const many = Array.from({ length: 15 }, (_, i) => ({ title: `T${i}`, place: "", period: "", description: "" }));
    const r = parsePublicProfilePatch({ profileExperience: [...many, {}], profileEducation: [{ degree: "MBBS" }, { degree: "" }] });
    expect("data" in r && (r.data.profileExperience as unknown[]).length).toBe(10);
    expect("data" in r && r.data.profileEducation).toEqual([{ degree: "MBBS", institution: "", year: "" }]);
  });
});

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
