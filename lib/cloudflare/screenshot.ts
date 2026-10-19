// HTML → PNG via Cloudflare Browser Rendering's REST API (2026-10-19), used
// for the Facebook Story pictures (lib/facebook/storyCard.ts). A plain fetch —
// no puppeteer or image library in the Worker, so the bundle doesn't grow.
// Free plan: 10 minutes of browser time per day and 6 requests per minute;
// the 3-hourly job stays far inside that (lib/opportunities/digest.ts caps it).
//
// Needs CLOUDFLARE_BROWSER_API_TOKEN (a Cloudflare API token with the
// "Browser Rendering - Edit" permission). The account ID is not a secret — it
// is the same one as wrangler.jsonc's account_id.

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || "f0a99462abbc2d4caa90b7c2d936ee93";
// Cloudflare's docs now name the endpoint "browser-run"; older accounts/docs
// use "browser-rendering". Try the current name first, fall back on a 404.
const ENDPOINTS = ["browser-run", "browser-rendering"];

export type ScreenshotResult = { ok: true; png: Uint8Array<ArrayBuffer> } | { ok: false; error: string };

export async function renderHtmlToPng(html: string, viewport: { width: number; height: number }): Promise<ScreenshotResult> {
  const token = process.env.CLOUDFLARE_BROWSER_API_TOKEN;
  if (!token) return { ok: false, error: "CLOUDFLARE_BROWSER_API_TOKEN not configured" };

  let lastError = "no endpoint answered";
  for (const endpoint of ENDPOINTS) {
    try {
      const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/${endpoint}/screenshot`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          html,
          viewport,
          screenshotOptions: { type: "png" },
          gotoOptions: { waitUntil: "networkidle0", timeout: 30000 },
        }),
      });
      if (res.status === 404) {
        lastError = `${endpoint}: HTTP 404`;
        continue;
      }
      const type = res.headers.get("content-type") ?? "";
      if (!res.ok || !type.startsWith("image/")) {
        const body = await res.text().catch(() => "");
        return { ok: false, error: `${endpoint}: HTTP ${res.status} ${body.slice(0, 300)}` };
      }
      return { ok: true, png: new Uint8Array(await res.arrayBuffer()) };
    } catch (err) {
      lastError = `${endpoint}: ${(err as Error).message}`;
    }
  }
  return { ok: false, error: lastError };
}
