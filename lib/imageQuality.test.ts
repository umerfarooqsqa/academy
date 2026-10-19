import { describe, expect, it } from "vitest";
import { assessPhoto, describeIssues, toGray } from "./imageQuality";

const W = 200;
const H = 260;

/** Light paper with thin dark "text" lines every 6 rows. */
function sharpPage(): Float32Array {
  const g = new Float32Array(W * H).fill(235);
  for (let y = 10; y < H - 10; y += 6) for (let x = 10; x < W - 10; x++) if ((x >> 2) % 3 !== 0) g[y * W + x] = 30;
  return g;
}

/** Box-blur a few times — text smears into the paper. */
function blurred(src: Float32Array, passes: number): Float32Array {
  let g = src;
  for (let p = 0; p < passes; p++) {
    const out = new Float32Array(g);
    for (let y = 1; y < H - 1; y++)
      for (let x = 1; x < W - 1; x++) {
        let s = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) s += g[(y + dy) * W + x + dx];
        out[y * W + x] = s / 9;
      }
    g = out;
  }
  return g;
}

describe("assessPhoto", () => {
  it("passes a sharp, well-lit, full-size photo", () => {
    expect(assessPhoto(sharpPage(), W, H, 3000, 4000).issues).toEqual([]);
  });

  it("flags a blurred photo", () => {
    expect(assessPhoto(blurred(sharpPage(), 6), W, H, 3000, 4000).issues).toContain("blurry");
  });

  it("flags a dark photo and a tiny one", () => {
    const dark = sharpPage().map((v) => v * 0.2);
    expect(assessPhoto(dark, W, H, 3000, 4000).issues).toContain("too_dark");
    expect(assessPhoto(sharpPage(), W, H, 480, 640).issues).toContain("low_resolution");
  });

  it("flags a blank, washed-out photo as too bright and blurry", () => {
    expect(assessPhoto(new Float32Array(W * H).fill(252), W, H, 3000, 4000).issues).toEqual(["too_bright", "blurry"]);
  });
});

describe("helpers", () => {
  it("turns RGBA into luminance", () => {
    expect(Array.from(toGray([255, 255, 255, 255, 0, 0, 0, 255])).map(Math.round)).toEqual([255, 0]);
  });

  it("joins issues into a sentence", () => {
    expect(describeIssues(["blurry"])).toBe("looks blurry");
    expect(describeIssues(["too_dark", "blurry"])).toBe("is too dark and looks blurry");
  });
});
