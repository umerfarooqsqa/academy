import { describe, expect, it } from "vitest";
import {
  collectGrades,
  currentStepIndex,
  formatAnswer,
  resolveSteps,
  rewindTo,
  splitSubjects,
  validateAmount,
  validatePhone,
  type Answers,
  type StepDef,
} from "./liliChatFlow";
import { PARENT_STEPS, buildParentPayload } from "./find-a-tutor/parentSteps";
import { TUTOR_STEPS, buildTutorFormData } from "./become-a-tutor/tutorSteps";

const defs: StepDef[] = [
  { kind: "text", id: "name", prompt: "Name?" },
  { kind: "text", id: "subjects", prompt: "Subjects?" },
  { kind: "grades", id: "grades", subjectsFrom: "subjects", prompt: (s) => `Grade in ${s}?` },
  { kind: "text", id: "fee", prompt: "Fee?", optional: true },
];

describe("step progression", () => {
  it("starts at the first step and advances as answers arrive", () => {
    let answers: Answers = {};
    expect(currentStepIndex(resolveSteps(defs, answers), answers)).toBe(0);
    answers = { name: "Ayesha" };
    expect(currentStepIndex(resolveSteps(defs, answers), answers)).toBe(1);
  });

  it("expands one grade step per subject, after subjects is answered", () => {
    expect(resolveSteps(defs, {}).map((s) => s.id)).toEqual(["name", "subjects", "fee"]);
    const steps = resolveSteps(defs, { name: "A", subjects: "Biology, Chemistry" });
    expect(steps.map((s) => s.id)).toEqual(["name", "subjects", "grades:Biology", "grades:Chemistry", "fee"]);
  });

  it("counts a skipped (null) optional step as done", () => {
    const answers: Answers = { name: "A", subjects: "Biology", "grades:Biology": "A", fee: null };
    const steps = resolveSteps(defs, answers);
    expect(currentStepIndex(steps, answers)).toBe(steps.length);
  });
});

describe("rewindTo", () => {
  it("clears the edited step and everything after it", () => {
    const answers: Answers = { name: "A", subjects: "Biology", "grades:Biology": "A", fee: "5000" };
    const steps = resolveSteps(defs, answers);
    expect(rewindTo(steps, answers, "subjects")).toEqual({ name: "A" });
  });

  it("drops grades for subjects removed by an edit", () => {
    let answers: Answers = { name: "A", subjects: "Biology, Physics", "grades:Biology": "A", "grades:Physics": "B" };
    answers = rewindTo(resolveSteps(defs, answers), answers, "subjects");
    answers = { ...answers, subjects: "Biology" };
    expect(resolveSteps(defs, answers).map((s) => s.id)).toEqual(["name", "subjects", "grades:Biology", "fee"]);
    expect(collectGrades(answers, "grades")).toEqual({});
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

  it("formats answers for the chat bubbles", () => {
    const loc = PARENT_STEPS.find((s) => s.id === "location")!;
    if (loc.kind === "grades") throw new Error("unexpected");
    expect(formatAnswer(loc, { latitude: 24.9, longitude: 67.1, area: "Gulshan", viaGps: true })).toBe("📍 My location (Gulshan)");
    expect(formatAnswer(loc, { latitude: null, longitude: null, area: "Gulshan", viaGps: false })).toBe("Gulshan");
    expect(formatAnswer(loc, null)).toBe("Skip");
  });
});

describe("payload builders", () => {
  it("builds the parent-request JSON body", () => {
    const answers: Answers = {
      subjects: "Chemistry, Biology",
      subjectGroup: "pre_medical",
      curriculum: "FSc",
      deliveryMode: "in_person",
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
      subjectGroup: "pre_medical",
      curriculum: "FSc",
      deliveryMode: "in_person",
      area: "Gulshan-e-Iqbal",
      latitude: 24.93,
      longitude: 67.1,
      availability: ["weekday_evening"],
      budget: 15000,
      studentInfo: null,
    });
  });

  it("builds the tutor-apply form data, files included", () => {
    const cnic = new File(["x"], "cnic.jpg", { type: "image/jpeg" });
    const answers: Answers = {
      name: "Ayesha Khan",
      whatsappId: "03001234567",
      location: { latitude: null, longitude: null, area: "Malir", viaGps: false },
      subjects: "Biology, Chemistry",
      subjectGroup: "pre_medical",
      curriculum: "A-levels",
      qualification: "MBBS",
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
    expect(fd.get("latitude")).toBeNull();
    expect(fd.get("subjects")).toBe("Biology, Chemistry");
    expect(JSON.parse(fd.get("gradesBySubject") as string)).toEqual({ Biology: "A", Chemistry: "A-" });
    expect(fd.getAll("availability")).toEqual(["weekend_morning", "weekend_afternoon"]);
    expect(fd.get("expectedFee")).toBeNull();
    expect((fd.get("cnic") as File).name).toBe("cnic.jpg");
    expect(fd.getAll("marksheets")).toEqual([]);
  });

  it("sends shared coordinates as strings for the tutor route", () => {
    const fd = buildTutorFormData({ location: { latitude: 24.93, longitude: 67.1, area: "Gulshan-e-Iqbal", viaGps: true } });
    expect(fd.get("latitude")).toBe("24.93");
    expect(fd.get("longitude")).toBe("67.1");
  });
});
