// /robots.txt (SEO, 2026-10-15) — public pages open to all crawlers, AI
// assistants' crawlers explicitly welcome, the admin side and APIs blocked.

import type { MetadataRoute } from "next";
import { buildRobots } from "@/lib/seo/routes";

export default function robots(): MetadataRoute.Robots {
  return buildRobots();
}
