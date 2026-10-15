import { describe, expect, it } from "vitest";
import { DEFAULT_SITE_CONTENT } from "@/lib/siteContent";
import { PUBLIC_SITE_URL } from "@/lib/site";
import { articleLd, breadcrumbLd, faqLd, ldJson, organizationLd, serviceLd } from "./jsonLd";
import { buildRobots, buildSitemap, PRIVATE_PATHS } from "./routes";
import { findZoneBySlug, nearbyZones, zoneSlug } from "./areas";
import { PUBLIC_SUBJECTS } from "@/lib/publicSubjects";

const zones = [
  { name: "North Nazimabad", latitude: 24.9342, longitude: 67.0392, maxKm: 10 },
  { name: "Gulshan-e-Iqbal", latitude: 24.9179, longitude: 67.0961, maxKm: 10 },
  { name: "Malir", latitude: 24.8916, longitude: 67.2081, maxKm: 10 },
];

describe("structured data", () => {
  const content = { ...DEFAULT_SITE_CONTENT, whatsappNumber: "0339 1458909", contactEmail: "a@b.com" };

  it("describes the academy without any rating or review markup", () => {
    const ld = organizationLd(content, ["Clifton"]);
    const json = JSON.stringify(ld);
    expect(json).not.toMatch(/AggregateRating|"review"|ratingValue/i);
    expect(ld[0]).toMatchObject({ name: "Lili Tutor Academy", telephone: "+923391458909", email: "a@b.com", url: `${PUBLIC_SITE_URL}/` });
    expect(json).toContain("Clifton, Karachi");
    expect(json).not.toMatch(/streetAddress/);
  });

  it("uses absolute URLs for breadcrumbs, services and articles", () => {
    expect(breadcrumbLd([{ name: "Home", path: "/" }]).itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "Home", item: `${PUBLIC_SITE_URL}/` },
    ]);
    expect(serviceLd({ name: "x", serviceType: "Online tuition", path: "/online-tuition", description: "d", areaServed: ["Pakistan"] }).url).toBe(
      `${PUBLIC_SITE_URL}/online-tuition`,
    );
    const a = articleLd({ title: "T", description: "D", slug: "t", publishedAt: new Date("2026-10-15"), updatedAt: new Date("2026-10-16") }, "Lili");
    expect(a).toMatchObject({ "@type": "BlogPosting", url: `${PUBLIC_SITE_URL}/blog/t`, datePublished: "2026-10-15T00:00:00.000Z" });
  });

  it("builds FAQPage only when there are questions, and escapes < in the script", () => {
    expect(faqLd([])).toBeNull();
    expect(faqLd([{ q: "Q?", a: "A" }])?.mainEntity).toHaveLength(1);
    expect(ldJson({ x: "</script><b>" })).not.toContain("</script>");
  });
});

describe("robots and sitemap", () => {
  it("blocks the admin side but never the public /tutors-in-karachi pages", () => {
    const r = buildRobots();
    const rules = Array.isArray(r.rules) ? r.rules : [r.rules];
    expect(rules[0].disallow).toEqual(PRIVATE_PATHS);
    expect(PRIVATE_PATHS).toContain("/api/");
    expect(PRIVATE_PATHS).not.toContain("/tutors"); // would prefix-match /tutors-in-karachi
    expect(PRIVATE_PATHS).toEqual(expect.arrayContaining(["/tutors$", "/tutors/", "/dashboard", "/login"]));
    expect(rules[1].userAgent).toEqual(expect.arrayContaining(["GPTBot", "PerplexityBot", "ClaudeBot", "Google-Extended"]));
    expect(r.sitemap).toBe(`${PUBLIC_SITE_URL}/sitemap.xml`);
  });

  it("lists static pages plus the dynamic entries, all absolute", () => {
    const sm = buildSitemap([{ path: "/tutors-in-karachi/malir" }, { path: "/blog/x", lastModified: new Date("2026-01-01") }]);
    const urls = sm.map((e) => e.url);
    expect(urls).toContain(`${PUBLIC_SITE_URL}/`);
    expect(urls).toContain(`${PUBLIC_SITE_URL}/online-tuition`);
    expect(urls).toContain(`${PUBLIC_SITE_URL}/tutors-in-karachi/malir`);
    expect(urls.some((u) => /\/(dashboard|login|api)\b/.test(u))).toBe(false);
  });
});

describe("area pages", () => {
  it("round-trips zone names through slugs", () => {
    expect(zoneSlug("Gulshan-e-Iqbal")).toBe("gulshan-e-iqbal");
    expect(zoneSlug("North Nazimabad")).toBe("north-nazimabad");
    expect(findZoneBySlug(zones, "north-nazimabad")?.name).toBe("North Nazimabad");
    expect(findZoneBySlug(zones, "lahore")).toBeNull();
  });

  it("lists only areas within the zone's own radius, nearest first", () => {
    const near = nearbyZones(zones[0], zones);
    expect(near.map((z) => z.name)).toEqual(["Gulshan-e-Iqbal"]); // Malir is ~17 km away
  });
});

describe("subject pages", () => {
  it("have unique slugs and keyword titles under 60 characters", () => {
    const slugs = PUBLIC_SUBJECTS.map((s) => s.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of PUBLIC_SUBJECTS) {
      expect(s.seoTitle.length).toBeLessThanOrEqual(60);
      expect(s.metaDescription.length).toBeLessThanOrEqual(160);
      expect(s.faqs.length).toBeGreaterThan(0);
    }
  });
});
