// Structured data (schema.org JSON-LD) for the public site (SEO + GEO,
// 2026-10-15). Pure builders, tested. Rules:
//   - facts only, from site content / the database — nothing invented
//   - NO AggregateRating / Review markup: self-published ratings aren't
//     eligible for stars and risk a manual penalty
//   - no street address (service-area business — no public office)
//   - absolute URLs from lib/site.ts, so a domain switch updates everything

import { absUrl } from "@/lib/site";
import { internationalDigits, type SiteContent } from "@/lib/siteContent";

type Ld = Record<string, unknown>;

export const ORG_ID = absUrl("/#organization");

/** Site-wide: the academy as an organization + a service-area local business, and the WebSite. */
export function organizationLd(c: SiteContent, zoneNames: string[]): Ld[] {
  const phone = c.whatsappNumber || c.phoneNumber;
  const contactPoint = phone
    ? [
        {
          "@type": "ContactPoint",
          contactType: "customer service",
          telephone: `+${internationalDigits(phone)}`,
          availableLanguage: ["English", "Urdu"],
          areaServed: "PK",
        },
      ]
    : undefined;
  return [
    {
      "@context": "https://schema.org",
      "@type": ["EducationalOrganization", "LocalBusiness"],
      "@id": ORG_ID,
      name: c.siteName,
      url: absUrl("/"),
      logo: absUrl("/brand/lili-tutor-academy-logo-square.png"),
      image: absUrl("/brand/og-default.png"),
      description: c.heroSubheadline,
      ...(c.contactEmail ? { email: c.contactEmail } : {}),
      ...(phone ? { telephone: `+${internationalDigits(phone)}` } : {}),
      ...(contactPoint ? { contactPoint } : {}),
      parentOrganization: { "@type": "Organization", name: "Suntex Services" },
      areaServed: [
        { "@type": "City", name: "Karachi", containedInPlace: { "@type": "Country", name: "Pakistan" } },
        ...zoneNames.map((n) => ({ "@type": "Place", name: `${n}, Karachi` })),
        { "@type": "Country", name: "Pakistan" },
      ],
      knowsAbout: ["Home tuition", "Online tuition", "O-levels", "A-levels", "Matric", "FSc", "Computer Science"],
      ...(c.facebookUrl ? { sameAs: [c.facebookUrl] } : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": absUrl("/#website"),
      name: c.siteName,
      url: absUrl("/"),
      inLanguage: "en-PK",
      publisher: { "@id": ORG_ID },
    },
  ];
}

export function breadcrumbLd(items: { name: string; path: string }[]): Ld {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: absUrl(it.path) })),
  };
}

export function faqLd(faqs: { q: string; a: string }[]): Ld | null {
  if (faqs.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}

export function serviceLd(s: { name: string; serviceType: string; path: string; description: string; areaServed: string[] }): Ld {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: s.name,
    serviceType: s.serviceType,
    description: s.description,
    url: absUrl(s.path),
    provider: { "@id": ORG_ID },
    areaServed: s.areaServed.map((name) => ({ "@type": "Place", name })),
    audience: { "@type": "EducationalAudience", educationalRole: "student" },
  };
}

export function articleLd(a: { title: string; description: string; slug: string; publishedAt: Date | null; updatedAt: Date }, siteName: string): Ld {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: a.title,
    description: a.description,
    url: absUrl(`/blog/${a.slug}`),
    mainEntityOfPage: absUrl(`/blog/${a.slug}`),
    image: absUrl("/brand/og-default.png"),
    ...(a.publishedAt ? { datePublished: a.publishedAt.toISOString() } : {}),
    dateModified: a.updatedAt.toISOString(),
    author: { "@type": "Organization", name: siteName, url: absUrl("/") },
    publisher: { "@id": ORG_ID },
    inLanguage: "en-PK",
  };
}

export function tutorProfileLd(t: { id: string; displayName: string; headline: string | null; subjects: string[]; area: string; photoUrl: string | null }): Ld {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: absUrl(`/our-tutors/${t.id}`),
    mainEntity: {
      "@type": "Person",
      name: t.displayName,
      ...(t.headline ? { description: t.headline } : {}),
      ...(t.photoUrl ? { image: t.photoUrl } : {}),
      jobTitle: "Tutor",
      knowsAbout: t.subjects,
      homeLocation: { "@type": "Place", name: `${t.area}, Karachi` },
      worksFor: { "@id": ORG_ID },
    },
  };
}

/** Serialises JSON-LD for a <script type="application/ld+json"> (escapes "<"). */
export function ldJson(data: Ld | Ld[] | null): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
