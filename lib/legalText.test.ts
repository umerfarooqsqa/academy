import { describe, expect, it } from "vitest";
import { parseLegalText } from "./legalText";

describe("parseLegalText", () => {
  it("splits paragraphs on blank lines and joins wrapped lines", () => {
    expect(parseLegalText("First line\ncontinues.\n\nSecond paragraph.")).toEqual([
      { kind: "p", text: "First line continues." },
      { kind: "p", text: "Second paragraph." },
    ]);
  });

  it("turns '- ' and '• ' lines into a list, keeping text around it", () => {
    expect(parseLegalText("You agree to:\n- be on time\n• be polite\nThanks.")).toEqual([
      { kind: "p", text: "You agree to:" },
      { kind: "ul", items: ["be on time", "be polite"] },
      { kind: "p", text: "Thanks." },
    ]);
  });

  it("ignores empty input and keeps markup as plain text", () => {
    expect(parseLegalText("  \n\n ")).toEqual([]);
    expect(parseLegalText("<script>x</script>")).toEqual([{ kind: "p", text: "<script>x</script>" }]);
  });
});
