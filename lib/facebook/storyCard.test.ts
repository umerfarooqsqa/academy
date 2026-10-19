import { describe, expect, it } from "vitest";
import { storyCardHtml } from "./storyCard";
import type { OpportunityListing } from "@/lib/opportunities/formatText";

const listing: OpportunityListing = {
  opportunityCode: "OPP-1246",
  subjects: ["physics", "chemistry"],
  subjectGroup: "school",
  curriculum: "matric",
  schoolName: "Beaconhouse <Clifton>",
  area: "Clifton",
  deliveryMode: "in_person",
  publishedAt: "2026-10-19T00:00:00.000Z",
  availability: ["weekday_evening", "made_up_tag"],
};

const opts = { siteName: "Lili Tutor Academy", siteUrl: "https://example.workers.dev" };

describe("storyCardHtml", () => {
  it("shows the tuition's public details", () => {
    const html = storyCardHtml(listing, opts);
    expect(html).toContain("Physics, Chemistry");
    expect(html).toContain("Matric");
    expect(html).toContain("Clifton");
    expect(html).toContain("Home tuition");
    expect(html).toContain("Weekday evenings");
    expect(html).toContain("OPP-1246");
    expect(html).toContain("example.workers.dev/opportunities");
  });

  it("escapes text so nothing typed can become markup", () => {
    const html = storyCardHtml(listing, opts);
    expect(html).toContain("Beaconhouse &lt;Clifton&gt;");
    expect(html).not.toContain("<Clifton>");
  });

  it("says online instead of an area for online tuitions", () => {
    const html = storyCardHtml({ ...listing, deliveryMode: "online", schoolName: null, availability: [] }, opts);
    expect(html).toContain("Online tuition");
    expect(html).not.toContain(">Clifton<");
    expect(html).not.toContain("Weekday");
  });
});
