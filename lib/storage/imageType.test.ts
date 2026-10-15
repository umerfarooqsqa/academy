import { describe, expect, it } from "vitest";
import { sniffImageType } from "./imageType";

const bytes = (...v: number[]) => new Uint8Array(v);
const text = (s: string) => new TextEncoder().encode(s);

describe("sniffImageType", () => {
  it("recognises JPEG, PNG and WebP", () => {
    expect(sniffImageType(bytes(0xff, 0xd8, 0xff, 0xe0))?.mime).toBe("image/jpeg");
    expect(sniffImageType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0))?.mime).toBe("image/png");
    expect(sniffImageType(text("RIFF\0\0\0\0WEBPVP8 "))?.mime).toBe("image/webp");
  });

  it("rejects anything else, whatever it's called", () => {
    expect(sniffImageType(text("<svg xmlns='http://www.w3.org/2000/svg'>"))).toBeNull();
    expect(sniffImageType(text("<!doctype html>"))).toBeNull();
    expect(sniffImageType(bytes())).toBeNull();
  });
});
