import { describe, expect, it } from "vitest";
import { agreementPlainText, agreementVersion } from "./agreementSnapshot";
import { DEFAULT_TUTOR_AGREEMENT } from "./defaultTutorAgreement";

describe("agreementPlainText", () => {
  it("numbers sections like the public page and keeps bullets", () => {
    const text = agreementPlainText("Tutor Agreement", "2026-10-19", [
      { heading: "In short", body: "Read this.\n\n- one\n- two" },
      { heading: "", body: "" },
      { heading: "General", body: "Pakistan law." },
    ]);
    expect(text).toBe(
      "Tutor Agreement\n\nLast updated 2026-10-19\n\n1. In short\n\nRead this.\n\n- one\n- two\n\n2. General\n\nPakistan law.",
    );
  });

  it("contains the key rules of the default agreement", () => {
    const text = agreementPlainText("Tutor Agreement", "2026-10-19", DEFAULT_TUTOR_AGREEMENT);
    expect(text).toContain("12 months");
    expect(text).toContain("one full month of the fee");
  });
});

describe("agreementVersion", () => {
  it("is stable for the same wording and changes when the wording does", async () => {
    const a = await agreementVersion([{ heading: "A", body: "x" }]);
    expect(a).toMatch(/^[0-9a-f]{12}$/);
    expect(await agreementVersion([{ heading: "A", body: "x" }, { heading: " ", body: "" }])).toBe(a);
    expect(await agreementVersion([{ heading: "A", body: "y" }])).not.toBe(a);
  });
});
