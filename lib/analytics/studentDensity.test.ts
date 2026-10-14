import { describe, expect, it } from "vitest";
import { computeStudentDensity, needsTutor, type StudentDensityInput } from "./studentDensity";

const zones = [
  { name: "North Nazimabad", latitude: 24.9425, longitude: 67.0384 },
  { name: "Malir", latitude: 24.8936, longitude: 67.2075 },
];

const req = (over: Partial<StudentDensityInput>): StudentDensityInput => ({
  area: "Malir",
  subjectGroup: "pre_medical",
  status: "pending",
  placed: false,
  ...over,
});

describe("needsTutor", () => {
  it("is true for open requests with no paid/completed match", () => {
    expect(needsTutor({ status: "pending", placed: false })).toBe(true);
    expect(needsTutor({ status: "matched", placed: false })).toBe(true);
  });

  it("is false once closed or placed with a tutor", () => {
    expect(needsTutor({ status: "closed", placed: false })).toBe(false);
    expect(needsTutor({ status: "matched", placed: true })).toBe(false);
  });
});

describe("computeStudentDensity", () => {
  const requests = [
    req({}),
    req({ area: "malir", status: "matched" }),
    req({ status: "closed" }),
    req({ placed: true }),
    req({ area: "North Nazimabad", subjectGroup: "computer" }),
    req({ area: "Block 7, near Hassan Square" }),
  ];

  it("counts every request per zone by default (case-insensitive), with unzoned reported separately", () => {
    const r = computeStudentDensity(zones, requests);
    expect(r.zones.find((z) => z.zone === "Malir")?.studentCount).toBe(4);
    expect(r.zones.find((z) => z.zone === "North Nazimabad")?.studentCount).toBe(1);
    expect(r.unzoned).toBe(1);
  });

  it("can show only students who still need a tutor", () => {
    const r = computeStudentDensity(zones, requests, { needsTutorOnly: true });
    expect(r.zones.find((z) => z.zone === "Malir")?.studentCount).toBe(2);
    expect(r.unzoned).toBe(1);
  });

  it("filters by subject group and keeps zero-count zones", () => {
    const r = computeStudentDensity(zones, requests, { subjectGroup: "computer" });
    expect(r.zones).toEqual([
      { zone: "North Nazimabad", latitude: 24.9425, longitude: 67.0384, studentCount: 1 },
      { zone: "Malir", latitude: 24.8936, longitude: 67.2075, studentCount: 0 },
    ]);
    expect(r.unzoned).toBe(0);
  });
});
