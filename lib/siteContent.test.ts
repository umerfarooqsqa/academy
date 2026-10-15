import { describe, expect, it } from "vitest";
import { DEFAULT_SITE_CONTENT, internationalDigits, normalizeSiteContent } from "./siteContent";

describe("normalizeSiteContent", () => {
  it("upgrades a pre-redesign saved copy, keeping what the operator edited", () => {
    const old = {
      siteName: "Lili Tutor Academy",
      heroEyebrow: "Verified Best Tutors from your neighborhood ",
      heroSubheadline:
        "We match you with vetted, grade-verified tutors for O/A-levels, FSc, Computer Science, Skills, and university subjects — right from your own area, usually within hours.",
      howItWorks: ["a", "b", "c"],
      contactEmail: "me@example.com",
    };
    const c = normalizeSiteContent(old);
    expect(c.heroEyebrow).toBe(old.heroEyebrow); // edited — kept
    expect(c.contactEmail).toBe("me@example.com");
    expect(c.heroSubheadline).toBe(DEFAULT_SITE_CONTENT.heroSubheadline); // untouched old default — upgraded
    expect(c.howItWorksSteps).toHaveLength(5);
    expect("howItWorks" in c).toBe(false);
    expect(c.faqs.length).toBeGreaterThan(0);
    expect(c.whatsappNumber).toBe("");
  });

  it("keeps an edited subheadline and the operator's own steps and FAQs", () => {
    const c = normalizeSiteContent({ heroSubheadline: "Mine", howItWorksSteps: [{ title: "T", text: "X" }], faqs: [] });
    expect(c.heroSubheadline).toBe("Mine");
    expect(c.howItWorksSteps).toEqual([{ title: "T", text: "X" }]);
    expect(c.faqs).toEqual([]);
  });
});

describe("internationalDigits", () => {
  it("turns local Pakistani numbers into wa.me form", () => {
    expect(internationalDigits("0300 1234567")).toBe("923001234567");
    expect(internationalDigits("+92 300-1234567")).toBe("923001234567");
  });
});
