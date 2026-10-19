import { describe, expect, it } from "vitest";
import {
  collectGrades,
  currentStepIndex,
  formatAnswer,
  resolveSteps,
  setAnswer,
  splitSubjects,
  validateAmount,
  validatePhone,
  type Answers,
  type StepDef,
} from "./liliFormFlow";
import { makeParentSteps, buildParentPayload, verifiedTutorsLine } from "./find-a-tutor/parentSteps";

const PARENT_STEPS = makeParentSteps();
import { TUTOR_STEPS, buildTutorFormData } from "./become-a-tutor/tutorSteps";

const defs: StepDef[] = [
  { kind: "text", id: "name", label: "Name", prompt: "Name?" },
  { kind: "text", id: "subjects", label: "Subjects", prompt: "Subjects?" },
  { kind: "grades", id: "grades", subjectsFrom: "subjects", label: (s) => `${s} grade`, prompt: (s) => `Grade in ${s}?` },
  { kind: "text", id: "fee", label: "Fee", prompt: "Fee?", optional: true },
];

describe("step progression", () => {
  it("starts at the first step and advances as answers arrive", () => {
    let answers: Answers = {};
    expect(currentStepIndex(resolveSteps(defs, answers), answers)).toBe(0);
    answers = setAnswer(defs, answers, "name", "Ayesha");
    expect(currentStepIndex(resolveSteps(defs, answers), answers)).toBe(1);
  });

  it("expands one labelled grade step per subject, after subjects is answered", () => {
    expect(resolveSteps(defs, {}).map((s) => s.id)).toEqual(["name", "subjects", "fee"]);
    const steps = resolveSteps(defs, { name: "A", subjects: "Biology, Chemistry" });
    expect(steps.map((s) => s.id)).toEqual(["name", "subjects", "grades:Biology", "grades:Chemistry", "fee"]);
    expect(steps[2].label).toBe("Biology grade");
  });

  it("counts a skipped (null) optional step as done", () => {
    const answers: Answers = { name: "A", subjects: "Biology", "grades:Biology": "A", fee: null };
    const steps = resolveSteps(defs, answers);
    expect(currentStepIndex(steps, answers)).toBe(steps.length);
  });
});

describe("setAnswer (editing in place)", () => {
  const full: Answers = { name: "A", subjects: "Biology, Physics", "grades:Biology": "A", "grades:Physics": "B", fee: "5000" };

  it("changes one answer and keeps every later answer", () => {
    expect(setAnswer(defs, full, "name", "Ayesha")).toEqual({ ...full, name: "Ayesha" });
  });

  it("drops grades for a removed subject, keeps the rest", () => {
    const next = setAnswer(defs, full, "subjects", "Biology");
    expect(next).toEqual({ name: "A", subjects: "Biology", "grades:Biology": "A", fee: "5000" });
    expect(collectGrades(next, "grades", splitSubjects(next.subjects))).toEqual({ Biology: "A" });
  });

  it("asks only the new grade when a subject is added", () => {
    const next = setAnswer(defs, full, "subjects", "Biology, Physics, Maths");
    const steps = resolveSteps(defs, next);
    expect(steps[currentStepIndex(steps, next)].id).toBe("grades:Maths");
    expect(next.fee).toBe("5000");
  });
});

describe("helpers", () => {
  it("splits subjects on commas only, deduping", () => {
    expect(splitSubjects("Biology,  Chemistry, biology, English Language and Literature")).toEqual([
      "Biology",
      "Chemistry",
      "English Language and Literature",
    ]);
  });

  it("validates phone numbers and amounts", () => {
    expect(validatePhone("0300 1234567")).toBeNull();
    expect(validatePhone("12345")).not.toBeNull();
    expect(validateAmount("15,000")).toBeNull();
    expect(validateAmount("15k")).not.toBeNull();
  });

  it("formats answers for the filled-in rows", () => {
    const loc = PARENT_STEPS.find((s) => s.id === "location")!;
    if (loc.kind === "grades") throw new Error("unexpected");
    expect(formatAnswer(loc, { latitude: 24.9, longitude: 67.1, area: "Gulshan", viaGps: true })).toBe("📍 Gulshan (shared location)");
    expect(formatAnswer(loc, { latitude: null, longitude: null, area: "near Hassan Square", viaGps: false })).toBe("near Hassan Square");
    expect(formatAnswer(loc, null)).toBe("—");
  });

  it("gives every step a label", () => {
    for (const s of [...resolveSteps(PARENT_STEPS, {}), ...resolveSteps(TUTOR_STEPS, { subjects: "Biology" })]) {
      expect(s.label, s.id).toBeTruthy();
    }
  });
});

describe("verified tutors line after the parent's location answer", () => {
  const counts = [
    { name: "Gulshan-e-Iqbal", latitude: 24.9204, longitude: 67.0971, maxKm: 6, verified: 3, bySubjectGroup: { pre_medical: 2, computer: 1 }, byGroupSet: { pre_medical: 2, computer: 1 } },
  ];

  it("names the count for the chosen category and area", () => {
    const a: Answers = { subjectGroup: ["pre_medical"], location: { latitude: null, longitude: null, area: "Gulshan-e-Iqbal", viaGps: false } };
    expect(verifiedTutorsLine(a, counts)).toBe("Good news — 2 verified Pre-Medical tutors near Gulshan-e-Iqbal! ");
    const steps = resolveSteps(makeParentSteps(counts), a);
    const availability = steps.find((s) => s.id === "availability")!;
    expect(typeof availability.prompt === "function" && availability.prompt(a)).toBe(
      "Good news — 2 verified Pre-Medical tutors near Gulshan-e-Iqbal! When suits the student?",
    );
  });

  it("says nothing when there are none, or for a typed area that isn't a zone", () => {
    expect(verifiedTutorsLine({ subjectGroup: ["skills"], location: { latitude: null, longitude: null, area: "Gulshan-e-Iqbal", viaGps: false } }, counts)).toBe("");
    expect(verifiedTutorsLine({ location: { latitude: null, longitude: null, area: "near Hassan Square", viaGps: false } }, counts)).toBe("");
    expect(verifiedTutorsLine({}, counts)).toBe("");
  });
});

describe("payload builders", () => {
  it("builds the parent-request JSON body", () => {
    const answers: Answers = {
      subjects: "Chemistry, Biology",
      subjectGroup: ["pre_medical", "school"],
      curriculum: "FSc",
      schoolName: " The City School ",
      deliveryMode: "in_person",
      tutorGenderPreference: "female",
      location: { latitude: 24.93, longitude: 67.1, area: "Gulshan-e-Iqbal", viaGps: true },
      availability: ["weekday_evening"],
      budget: "15,000",
      studentInfo: null,
      whatsappId: " 03001234567 ",
    };
    expect(PARENT_STEPS.every((s) => s.id in answers)).toBe(true);
    expect(buildParentPayload(answers)).toEqual({
      whatsappId: "03001234567",
      subjects: ["Chemistry", "Biology"],
      subjectGroups: ["pre_medical", "school"],
      curriculum: "FSc",
      deliveryMode: "in_person",
      tutorGenderPreference: "female",
      area: "Gulshan-e-Iqbal",
      latitude: 24.93,
      longitude: 67.1,
      availability: ["weekday_evening"],
      budget: 15000,
      studentInfo: null,
      schoolName: "The City School",
    });
  });

  it("builds the tutor-apply form data, files included", () => {
    const cnic = new File(["x"], "cnic.jpg", { type: "image/jpeg" });
    const answers: Answers = {
      name: "Ayesha Khan",
      whatsappId: "03001234567",
      gender: "female",
      location: { latitude: null, longitude: null, area: "Malir", viaGps: false },
      subjects: "Biology, Chemistry",
      subjectGroup: ["pre_medical", "university_level"],
      curriculum: "A-levels",
      qualification: "MBBS",
      schoolName: "DJ Science College",
      "grades:Biology": "A",
      "grades:Chemistry": "A-",
      availability: ["weekend_morning", "weekend_afternoon"],
      expectedFee: null,
      cnic: [cnic],
      marksheets: null,
    };
    const steps = resolveSteps(TUTOR_STEPS, answers);
    expect(currentStepIndex(steps, answers)).toBe(steps.length);

    const fd = buildTutorFormData(answers);
    expect(fd.get("area")).toBe("Malir");
    expect(fd.get("gender")).toBe("female");
    expect(fd.get("schoolName")).toBe("DJ Science College");
    expect(fd.get("latitude")).toBeNull();
    expect(fd.get("subjects")).toBe("Biology, Chemistry");
    expect(fd.getAll("subjectGroup")).toEqual(["pre_medical", "university_level"]);
    expect(JSON.parse(fd.get("gradesBySubject") as string)).toEqual({ Biology: "A", Chemistry: "A-" });
    expect(fd.getAll("availability")).toEqual(["weekend_morning", "weekend_afternoon"]);
    expect(fd.get("expectedFee")).toBeNull();
    expect((fd.get("cnic") as File).name).toBe("cnic.jpg");
    expect(fd.getAll("marksheets")).toEqual([]);
  });

  it("shows a numbered list answer as numbered lines (2026-10-19)", () => {
    const subjects = resolveSteps(TUTOR_STEPS, {}).find((s) => s.id === "subjects")!;
    expect(subjects.kind).toBe("list");
    expect(formatAnswer(subjects, "Physics, Chemistry")).toBe("1. Physics\n2. Chemistry");
  });

  it("sends shared coordinates as strings for the tutor route", () => {
    const fd = buildTutorFormData({ location: { latitude: 24.93, longitude: 67.1, area: "Gulshan-e-Iqbal", viaGps: true } });
    expect(fd.get("latitude")).toBe("24.93");
    expect(fd.get("longitude")).toBe("67.1");
  });
});
