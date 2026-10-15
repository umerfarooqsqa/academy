// Browser side of campaign tracking (lib/campaigns/ref.ts, 2026-10-15): when
// someone lands on the site through a tracking link (`?ref=…`), remember the
// ref on their device for 30 days, so a form they submit later — even after
// browsing around or coming back another day — is credited to that campaign.
// Last click wins. Only the campaign ref is stored; no personal data. Storage
// can be unavailable (private mode, blocked), so every access is guarded and
// tracking simply falls back to "unattributed".

const KEY = "lili_campaign_ref";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

/** Pure: the stored ref if the stored value is valid and not expired. */
export function readStoredRef(raw: string | null, now: number = Date.now()): string | null {
  if (!raw) return null;
  try {
    const { ref, at } = JSON.parse(raw) as { ref?: unknown; at?: unknown };
    if (typeof ref !== "string" || typeof at !== "number") return null;
    return now - at <= MAX_AGE_MS ? ref : null;
  } catch {
    return null;
  }
}

/** Called on every public page load: stores `?ref=` from the URL if present. */
export function captureRefFromUrl() {
  try {
    const ref = new URLSearchParams(window.location.search).get("ref")?.trim();
    if (ref && /^[A-Za-z0-9_-]{1,64}$/.test(ref)) {
      window.localStorage.setItem(KEY, JSON.stringify({ ref, at: Date.now() }));
    }
  } catch {
    // storage unavailable — this visit just stays unattributed
  }
}

/** The ref to send with a form submission, or undefined. */
export function getCampaignRef(): string | undefined {
  try {
    return readStoredRef(window.localStorage.getItem(KEY)) ?? undefined;
  } catch {
    return undefined;
  }
}
