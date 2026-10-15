// The public site's indexable pages and the private ones search engines must
// skip (SEO, 2026-10-15) — used by app/robots.ts and app/sitemap.ts. Pure.

import type { MetadataRoute } from "next";
import { absUrl } from "@/lib/site";

/** Fixed public pages, most important first, with a rough priority. */
export const STATIC_PAGES: { path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" | "yearly" }[] = [
  { path: "/", priority: 1, changeFrequency: "daily" },
  { path: "/tutors-in-karachi", priority: 0.9, changeFrequency: "daily" },
  { path: "/online-tuition", priority: 0.9, changeFrequency: "weekly" },
  { path: "/home-tuition", priority: 0.9, changeFrequency: "weekly" },
  { path: "/subjects", priority: 0.8, changeFrequency: "monthly" },
  { path: "/find-a-tutor", priority: 0.8, changeFrequency: "monthly" },
  { path: "/become-a-tutor", priority: 0.7, changeFrequency: "monthly" },
  { path: "/opportunities", priority: 0.7, changeFrequency: "daily" },
  { path: "/our-tutors", priority: 0.7, changeFrequency: "weekly" },
  { path: "/blog", priority: 0.7, changeFrequency: "weekly" },
  { path: "/about", priority: 0.6, changeFrequency: "monthly" },
  { path: "/faq", priority: 0.6, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.5, changeFrequency: "monthly" },
  { path: "/terms", priority: 0.2, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.2, changeFrequency: "yearly" },
];

/** The admin dashboard, login and APIs — never indexed. */
export const PRIVATE_PATHS = [
  "/dashboard",
  "/admin",
  "/login",
  "/import",
  "/matches",
  // Not plain "/tutors": robots rules are prefix matches, and that would
  // also block the public /tutors-in-karachi pages.
  "/tutors$",
  "/tutors/",
  "/parents",
  "/zones",
  "/heatmap",
  "/website-content",
  "/articles",
  "/payments",
  "/finance",
  "/campaigns",
  "/marketing",
  "/users",
  "/logs",
  "/api/",
];

/** AI assistants' crawlers, explicitly welcome (GEO — being cited in AI answers). */
export const AI_CRAWLERS = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "PerplexityBot", "ClaudeBot", "Claude-SearchBot", "Google-Extended", "Applebot-Extended", "Bingbot"];

export function buildRobots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS },
      { userAgent: AI_CRAWLERS, allow: "/", disallow: PRIVATE_PATHS },
    ],
    sitemap: absUrl("/sitemap.xml"),
  };
}

export function buildSitemap(dynamicEntries: { path: string; lastModified?: Date; priority?: number }[], now = new Date()): MetadataRoute.Sitemap {
  return [
    ...STATIC_PAGES.map((p) => ({ url: absUrl(p.path), lastModified: now, changeFrequency: p.changeFrequency, priority: p.priority })),
    ...dynamicEntries.map((e) => ({ url: absUrl(e.path), lastModified: e.lastModified ?? now, changeFrequency: "weekly" as const, priority: e.priority ?? 0.6 })),
  ];
}
