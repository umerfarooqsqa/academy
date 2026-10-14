import { describe, expect, it } from "vitest";
import { hasExactLocation } from "./exactLocations";

const zones = [{ name: "Gulshan-e-Iqbal", latitude: 24.9204, longitude: 67.0971 }];

describe("hasExactLocation", () => {
  it("is false for a zone-centroid fallback (picked or typed area)", () => {
    expect(hasExactLocation({ latitude: 24.9204, longitude: 67.0971, area: "gulshan-e-iqbal" }, zones)).toBe(false);
  });

  it("is true for a shared location inside the zone", () => {
    expect(hasExactLocation({ latitude: 24.925, longitude: 67.1, area: "Gulshan-e-Iqbal" }, zones)).toBe(true);
  });

  it("is true for a shared location whose area isn't a zone (outside every zone)", () => {
    expect(hasExactLocation({ latitude: 31.52, longitude: 74.36, area: "Malir-ish" }, zones)).toBe(true);
  });

  it("is false with no coordinates", () => {
    expect(hasExactLocation({ latitude: null, longitude: null, area: "Gulshan-e-Iqbal" }, zones)).toBe(false);
  });
});
