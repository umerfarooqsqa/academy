import { describe, it, expect } from "vitest";
import {
  formatOpportunityLine,
  formatOpportunityCopyText,
  formatTuitionsPost,
  type OpportunityListing,
} from "@/lib/opportunities/formatText";
import { generateOpportunityCode, parseOpportunityCode } from "@/lib/opportunities/code";

const listing: OpportunityListing = {
  opportunityCode: "OPP-1234",
  subjects: ["Biology", "Chemistry"],
  subjectGroup: "pre_medical",
  curriculum: "FSc Pre-Medical",
  area: "North Nazimabad",
  deliveryMode: "in_person",
  publishedAt: "2026-10-14T10:00:00.000Z",
};

describe("opportunity code (CLAUDE.md 6.5 step 2/4)", () => {
  it("generates a code matching the OPP-XXXX shape", () => {
    expect(generateOpportunityCode()).toMatch(/^OPP-\d{4}$/);
  });

  it("parses an OPP-XXXX code out of a free-text inbound message", () => {
    expect(parseOpportunityCode("interested in OPP-1234 please")).toBe("OPP-1234");
    expect(parseOpportunityCode("no code here")).toBeNull();
  });

  it("is case-insensitive when parsing", () => {
    expect(parseOpportunityCode("opp-5678")).toBe("OPP-5678");
  });
});

describe("opportunity text formatting (CLAUDE.md 6.5, reused by digest + copy buttons)", () => {
  it("formats one listing line with subjects, area, curriculum, and the ref code", () => {
    const line = formatOpportunityLine(listing);
    expect(line).toContain("Biology/Chemistry");
    expect(line).toContain("North Nazimabad");
    expect(line).toContain("OPP-1234");
  });

  it("share text points at the I'm-interested button by code, with the page link when given", () => {
    const text = formatOpportunityCopyText(listing, "https://example.com/opportunities");
    expect(text).toContain("OPP-1234");
    expect(text).toContain("North Nazimabad");
    expect(text).toContain("I'm interested");
    expect(text).toContain("https://example.com/opportunities");
    expect(formatOpportunityCopyText(listing)).not.toContain("undefined");
  });

  it("share text says Online instead of an area for online-only requests", () => {
    expect(formatOpportunityCopyText({ ...listing, deliveryMode: "online" })).toContain("— Online");
  });

  it("Facebook post lists every new tuition in one post, with the page link", () => {
    const post = formatTuitionsPost(
      [listing, { ...listing, opportunityCode: "OPP-5678", area: "Gulshan-e-Iqbal", subjects: ["Computer Science"], curriculum: "A-levels" }],
      "https://example.com/opportunities",
    );
    expect(post).toContain("New tuitions — tutors needed");
    expect(post).toContain("• Biology, Chemistry (FSc Pre-Medical) — North Nazimabad");
    expect(post).toContain("• Computer Science (A-levels) — Gulshan-e-Iqbal");
    expect(post).toContain("https://example.com/opportunities");
  });

  it("Facebook post says Online for online requests, uses the singular for one, and has no contact details", () => {
    const post = formatTuitionsPost([{ ...listing, deliveryMode: "online", subjects: ["Physics"] }], "https://example.com/opportunities");
    expect(post).toContain("New tuition — tutor needed");
    expect(post).toContain("— Online");
    expect(post).not.toMatch(/\d{10}|whatsapp|\+92/i);
  });

  it("falls back to the category when a request has no level written", () => {
    expect(formatTuitionsPost([{ ...listing, curriculum: " " }], "u")).toContain("(Pre-Medical)");
  });
});
