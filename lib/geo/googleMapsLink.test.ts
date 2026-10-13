import { describe, it, expect } from "vitest";
import { extractCoordsFromText } from "@/lib/geo/googleMapsLink";

describe("extractCoordsFromText", () => {
  it("extracts coords from a WhatsApp iOS shared-location export line", () => {
    const line = "Location: https://maps.google.com/?q=51.5021456,-0.127397";
    expect(extractCoordsFromText(line)).toEqual({ latitude: 51.5021456, longitude: -0.127397 });
  });

  it("extracts coords from a WhatsApp Android shared-location export line", () => {
    const line = "location: https://maps.google.com/?q=51.50214569326172,-0.12739796972656";
    expect(extractCoordsFromText(line)).toEqual({ latitude: 51.50214569326172, longitude: -0.12739796972656 });
  });

  it("extracts coords from an @lat,lng,zoom style link", () => {
    const line = "Check this out: https://www.google.com/maps/place/@24.8938,67.0728,15z";
    expect(extractCoordsFromText(line)).toEqual({ latitude: 24.8938, longitude: 67.0728 });
  });

  it("extracts coords from a ?ll=lat,lng style link", () => {
    const line = "https://maps.google.com/maps?ll=24.8938,67.0728&z=14";
    expect(extractCoordsFromText(line)).toEqual({ latitude: 24.8938, longitude: 67.0728 });
  });

  it("returns null for plain text with no Maps link", () => {
    expect(extractCoordsFromText("I live near Sohrab Goth flyover")).toBeNull();
  });

  it("returns null for a non-Maps URL", () => {
    expect(extractCoordsFromText("https://example.com/?q=1,2")).toBeNull();
  });

  it("returns null for a Maps link with no embedded coordinates (e.g. a short link)", () => {
    expect(extractCoordsFromText("https://maps.app.goo.gl/abc123XYZ")).toBeNull();
  });

  it("rejects out-of-range values as invalid coordinates", () => {
    expect(extractCoordsFromText("https://maps.google.com/?q=200,67.0728")).toBeNull();
  });
});
