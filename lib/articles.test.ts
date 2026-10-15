import { describe, expect, it } from "vitest";
import { parseArticleInput } from "./articles";

const ok = { title: "How to Find a Home Tutor in Karachi?", description: "A short guide.", body: "## Hi\nText" };

describe("parseArticleInput", () => {
  it("derives the slug from the title when none is given", () => {
    expect(parseArticleInput(ok, false)).toEqual({
      data: { title: ok.title, slug: "how-to-find-a-home-tutor-in-karachi", description: "A short guide.", body: "## Hi\nText" },
    });
  });

  it("cleans a typed slug and validates status", () => {
    expect(parseArticleInput({ slug: "  My Guide!! " }, true)).toEqual({ data: { slug: "my-guide" } });
    expect(parseArticleInput({ status: "live" }, true)).toHaveProperty("error");
    expect(parseArticleInput({ status: "published" }, true)).toEqual({ data: { status: "published" } });
  });

  it("requires title, description and body on create", () => {
    expect(parseArticleInput({ ...ok, title: " " }, false)).toHaveProperty("error");
    expect(parseArticleInput({ ...ok, description: "" }, false)).toHaveProperty("error");
    expect(parseArticleInput({ ...ok, body: "" }, false)).toHaveProperty("error");
    expect(parseArticleInput({ ...ok, description: "x".repeat(201) }, false)).toHaveProperty("error");
  });
});
