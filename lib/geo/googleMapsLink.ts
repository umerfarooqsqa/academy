// Pure text parsing — no I/O, no network calls, no geocoding API (operator's
// no-paid-API constraint). Extracts a precise lat/long from a Google Maps URL
// found in free text.
//
// Confirmed format sources (2026-10-13 planning session):
// - A WhatsApp chat export renders a shared location as a plain text line,
//   e.g. "Location: https://maps.google.com/?q=51.5021456,-0.127397" (iOS) or
//   "location: https://maps.google.com/?q=51.50214569326172,-0.12739796972656"
//   (Android) — confirmed via the whats_json export-parsing library's
//   documented examples.
// - A pasted/forwarded Google Maps link can also use "@lat,lng,zoom" or
//   "?ll=lat,lng" — confirmed via the open-source chat_to_map project's
//   extractGoogleMapsCoords(), which checks exactly these three patterns.
//
// Deliberately NOT an LLM call (Section 3: "LLM does language only, code does
// logic") — a regex is both cheaper and more reliable for numeric extraction.

export interface ExtractedCoords {
  latitude: number;
  longitude: number;
}

const MAPS_HOST_PATTERN = /(?:maps\.google\.com|google\.com\/maps|goo\.gl\/maps|maps\.app\.goo\.gl)/i;

const COORD_PATTERNS = [
  /@(-?\d+\.?\d*),(-?\d+\.?\d*)/,
  /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
  /[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
];

function isValidCoord(lat: number, lon: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;
}

/**
 * Scans arbitrary text for a Google Maps URL and extracts the embedded
 * lat/long, if present. Returns null if no Maps URL is found, or if a Maps
 * URL is found but no coordinate pattern inside it matches (e.g. a short
 * link with no embedded coordinates, or a place-name-only link).
 */
export function extractCoordsFromText(text: string): ExtractedCoords | null {
  if (!MAPS_HOST_PATTERN.test(text)) return null;

  for (const pattern of COORD_PATTERNS) {
    const match = text.match(pattern);
    if (!match) continue;
    const latitude = Number.parseFloat(match[1]);
    const longitude = Number.parseFloat(match[2]);
    if (isValidCoord(latitude, longitude)) {
      return { latitude, longitude };
    }
  }

  return null;
}
