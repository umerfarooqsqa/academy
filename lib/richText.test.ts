import { describe, expect, it } from "vitest";
import { parseInline, parseRichText, readingMinutes, safeHref, slugify } from "./richText";

describe("parseRichText", () => {
  it("parses headings, paragraphs, bullet and numbered lists", () => {
    const blocks = parseRichText("## Why\nFirst line\nwraps.\n\n- one\n- two\n1. a\n2. b\n### Sub\nEnd.");
    expect(blocks.map((b) => b.kind)).toEqual(["h2", "p", "ul", "ol", "h3", "p"]);
    expect(blocks[1]).toEqual({ kind: "p", inline: [{ kind: "text", text: "First line wraps." }] });
    expect(blocks[2]).toMatchObject({ kind: "ul", items: [[{ text: "one" }], [{ text: "two" }]] });
  });

  it("keeps HTML as plain text", () => {
    expect(parseRichText("<script>alert(1)</script>")).toEqual([{ kind: "p", inline: [{ kind: "text", text: "<script>alert(1)</script>" }] }]);
  });
});

describe("inline formatting", () => {
  it("handles bold and safe links", () => {
    expect(parseInline("Read **this** and [our FAQ](/faq).")).toEqual([
      { kind: "text", text: "Read " },
      { kind: "bold", text: "this" },
      { kind: "text", text: " and " },
      { kind: "link", text: "our FAQ", href: "/faq" },
      { kind: "text", text: "." },
    ]);
  });

  it("drops unsafe link targets to plain text", () => {
    expect(parseInline("[x](javascript:alert(1))")[0]).toMatchObject({ kind: "text" });
    expect(safeHref("//evil.com")).toBeNull();
    expect(safeHref("data:text/html,x")).toBeNull();
    expect(safeHref("https://example.com/a")).toBe("https://example.com/a");
    expect(safeHref("#top")).toBe("#top");
  });
});

describe("helpers", () => {
  it("slugifies titles", () => {
    expect(slugify("How to Find a Home Tutor in Karachi?")).toBe("how-to-find-a-home-tutor-in-karachi");
    expect(slugify("Home tuition vs Online tuition: which is right?")).toBe("home-tuition-vs-online-tuition-which-is-right");
    expect(slugify("O & A-levels")).toBe("o-and-a-levels");
  });

  it("estimates reading time", () => {
    expect(readingMinutes("word ".repeat(450))).toBe(2);
    expect(readingMinutes("short")).toBe(1);
  });
});
