import { describe, expect, it } from "vitest";
import { matchZoneByName, nearestZoneWithin, parseCoordPair } from "./zoneLookup";

const zones = [
  { name: "North Nazimabad", latitude: 24.9425, longitude: 67.0348, maxKm: 6 },
  { name: "Gulshan-e-Iqbal", latitude: 24.9208, longitude: 67.0943, maxKm: 6 },
  { name: "Malir", latitude: 24.8936, longitude: 67.2097, maxKm: 6 },
];

describe("nearestZoneWithin", () => {
  it("picks the nearest zone and marks it in range", () => {
    const r = nearestZoneWithin(24.93, 67.1, zones);
    expect(r?.zone.name).toBe("Gulshan-e-Iqbal");
    expect(r?.inRange).toBe(true);
    expect(r!.distanceKm).toBeLessThan(2);
  });

  it("flags a location beyond the nearest zone's maxKm as out of range", () => {
    const lahore = nearestZoneWithin(31.5204, 74.3587, zones);
    expect(lahore?.inRange).toBe(false);
  });

  it("uses each zone's own maxKm", () => {
    // ~8.6 km from North Nazimabad, farther from every other zone
    const point = { lat: 25.0, lon: 66.98 };
    expect(nearestZoneWithin(point.lat, point.lon, zones)?.inRange).toBe(false);
    const wider = zones.map((z) => (z.name === "North Nazimabad" ? { ...z, maxKm: 10 } : z));
    expect(nearestZoneWithin(point.lat, point.lon, wider)?.inRange).toBe(true);
  });

  it("returns null when there are no zones", () => {
    expect(nearestZoneWithin(24.9, 67.0, [])).toBeNull();
  });
});

describe("matchZoneByName", () => {
  it("matches typed areas case-insensitively, exact first then contained", () => {
    expect(matchZoneByName("malir", zones)?.name).toBe("Malir");
    expect(matchZoneByName("Block 5, North Nazimabad near Hydri", zones)?.name).toBe("North Nazimabad");
    expect(matchZoneByName("Gulshan", zones)?.name).toBe("Gulshan-e-Iqbal");
  });

  it("returns null for unknown or empty text", () => {
    expect(matchZoneByName("near Hassan Square", zones)).toBeNull();
    expect(matchZoneByName("   ", zones)).toBeNull();
  });
});

describe("parseCoordPair", () => {
  it("accepts numbers and numeric strings", () => {
    expect(parseCoordPair(24.9, 67.1)).toEqual({ latitude: 24.9, longitude: 67.1 });
    expect(parseCoordPair("24.9", "67.1")).toEqual({ latitude: 24.9, longitude: 67.1 });
  });

  it("rejects missing, non-numeric and out-of-range values", () => {
    expect(parseCoordPair(null, 67)).toBeNull();
    expect(parseCoordPair("", "")).toBeNull();
    expect(parseCoordPair("abc", "67")).toBeNull();
    expect(parseCoordPair(91, 67)).toBeNull();
    expect(parseCoordPair(24, 181)).toBeNull();
    expect(parseCoordPair(Infinity, 67)).toBeNull();
  });
});
