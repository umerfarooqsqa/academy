// The public website's address, for links that leave the site (e.g. the daily
// Facebook Page digest — a post needs a full URL, and the cron-triggered route
// runs on an internal request with no real host to derive it from) and for
// SEO: canonical URLs, the sitemap, robots.txt, llms.txt and structured data
// (2026-10-15). Change this one constant when the site moves to a custom
// domain (and add a redirect from the old address).
export const PUBLIC_SITE_URL = "https://tutor-parent-matching.umerfarooqsqa.workers.dev";

/** Absolute URL for a site path ("/faq" → "https://…/faq"). */
export function absUrl(path: string): string {
  return `${PUBLIC_SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
