import { describe, it, expect } from "vitest";
import { shouldAlert, buildNeglectDigest, NEGLECT_THRESHOLD_HOURS, type NeglectedParentRow, type NeglectedMatchRow } from "@/lib/parents/neglect";

const now = new Date("2026-10-12T12:00:00Z");

function hoursAgo(h: number): Date {
  return new Date(now.getTime() - h * 60 * 60 * 1000);
}

describe("shouldAlert", () => {
  it("is false just under the threshold", () => {
    expect(shouldAlert(hoursAgo(NEGLECT_THRESHOLD_HOURS - 0.01), null, now)).toBe(false);
  });
  it("is true at/just over the threshold with no prior alert", () => {
    expect(shouldAlert(hoursAgo(NEGLECT_THRESHOLD_HOURS + 0.01), null, now)).toBe(true);
  });
  it("does not re-alert less than 3h after the last alert, even if still old", () => {
    expect(shouldAlert(hoursAgo(10), hoursAgo(1), now)).toBe(false);
  });
  it("re-alerts once 3h have passed since the last alert", () => {
    expect(shouldAlert(hoursAgo(10), hoursAgo(3.5), now)).toBe(true);
  });
});

describe("buildNeglectDigest", () => {
  function parent(overrides: Partial<NeglectedParentRow>): NeglectedParentRow {
    return {
      id: "p1",
      whatsappId: "923001234567",
      area: "North Nazimabad",
      subjects: ["Biology"],
      createdAt: hoursAgo(5),
      neglectAlertedAt: null,
      ...overrides,
    };
  }
  function match(overrides: Partial<NeglectedMatchRow>): NeglectedMatchRow {
    return {
      id: "m1",
      tutorName: "Ayesha Khan",
      parentWhatsappId: "923001234567",
      area: "North Nazimabad",
      createdAt: hoursAgo(5),
      neglectAlertedAt: null,
      ...overrides,
    };
  }

  it("returns null when nothing qualifies", () => {
    const freshParent = parent({ createdAt: hoursAgo(0.5) });
    expect(buildNeglectDigest([freshParent], [], now)).toBeNull();
  });

  it("includes both a qualifying parent and a qualifying match in one digest", () => {
    const digest = buildNeglectDigest([parent({ id: "p1" })], [match({ id: "m1" })], now);
    expect(digest).not.toBeNull();
    expect(digest!.parentIds).toEqual(["p1"]);
    expect(digest!.matchIds).toEqual(["m1"]);
    expect(digest!.subject).toContain("2 items");
    expect(digest!.html).toContain("923001234567");
    expect(digest!.html).toContain("Ayesha Khan");
  });

  it("excludes a parent/match that isn't due yet", () => {
    const due = parent({ id: "due" });
    const notDue = parent({ id: "not-due", createdAt: hoursAgo(1) });
    const digest = buildNeglectDigest([due, notDue], [], now);
    expect(digest!.parentIds).toEqual(["due"]);
  });

  it("sorts entries oldest-first", () => {
    const newer = parent({ id: "newer", createdAt: hoursAgo(4) });
    const older = parent({ id: "older", createdAt: hoursAgo(20) });
    const digest = buildNeglectDigest([newer, older], [], now);
    expect(digest!.parentIds).toEqual(["older", "newer"]);
  });

  it("singular wording for exactly one item", () => {
    const digest = buildNeglectDigest([parent({})], [], now);
    expect(digest!.subject).toContain("1 item ");
  });
});
