import { describe, it, expect } from "vitest";
import {
  formatOpportunityLine,
  formatOpportunityCopyText,
  formatDigestText,
  formatFullDigestText,
  type OpportunityListing,
} from "@/lib/opportunities/formatText";
import { generateOpportunityCode, parseOpportunityCode } from "@/lib/opportunities/code";

const listing: OpportunityListing = {
  opportunityCode: "OPP-1234",
  subjects: ["Biology", "Chemistry"],
  subjectGroup: "pre_medical",
  curriculum: "FSc Pre-Medical",
  area: "North Nazimabad",
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

  it("copy text includes the reply-with-code instruction (Section 13 self-interest pattern)", () => {
    const text = formatOpportunityCopyText(listing);
    expect(text).toContain("OPP-1234");
    expect(text).toContain("North Nazimabad");
  });

  it("digest text is one combined post, never one line per opportunity object", () => {
    const listings = [listing, { ...listing, opportunityCode: "OPP-5678", area: "Gulshan-e-Iqbal", subjects: ["Computer Science"] }];
    const digest = formatDigestText(listings);
    expect(digest.split("\n")).toHaveLength(1);
    expect(digest).toContain("North Nazimabad");
    expect(digest).toContain("Gulshan-e-Iqbal");
  });

  it("handles zero open opportunities gracefully", () => {
    expect(formatDigestText([])).not.toContain("undefined");
    expect(formatFullDigestText([])).not.toContain("undefined");
  });

  it("full digest includes every listing's copy text", () => {
    const listings = [listing, { ...listing, opportunityCode: "OPP-5678" }];
    const full = formatFullDigestText(listings);
    expect(full).toContain("OPP-1234");
    expect(full).toContain("OPP-5678");
  });
});
