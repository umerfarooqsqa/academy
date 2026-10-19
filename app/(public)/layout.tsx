// Shared chrome for the public client website: sticky nav header, footer and
// the floating WhatsApp button, wrapping every public page. Route groups don't
// affect URLs; middleware.ts's PUBLIC_PATHS decides what's reachable without
// a login.
//
// 2026-10-15 professional redesign (operator request, inspired by
// beacontutorspk.com): Poppins headings + Inter body (next/font/google —
// bundled by Next.js, no external stylesheet), white header with the full
// site nav, a four-column footer with contact details, and a floating
// WhatsApp chat link when a business number is set in /website-content.

import Link from "next/link";
import { Inter, Poppins } from "next/font/google";
import type { Metadata } from "next";
import { getSiteContent, internationalDigits } from "@/lib/siteContent";
import { countFeaturedTutors } from "@/lib/tutors/publicProfile";
import { prisma } from "@/lib/db";
import { PUBLIC_SITE_URL } from "@/lib/site";
import { organizationLd } from "@/lib/seo/jsonLd";
import { areaPath } from "@/lib/seo/areas";
import { PUBLIC_SUBJECTS, subjectPath } from "@/lib/publicSubjects";
import JsonLd from "./JsonLd";
import MobileNav, { type NavLink } from "./MobileNav";
import CampaignRefCapture from "./CampaignRefCapture";
import WhatsAppButton from "./WhatsAppButton";
import { btnPrimary, btnSecondary, container } from "./ui";

const headingFont = Poppins({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-heading" });
const bodyFont = Inter({ subsets: ["latin"], variable: "--font-body" });

// SEO (2026-10-15): absolute URLs from lib/site.ts (one-line domain switch),
// a "%s | <site name>" title template, en_PK link previews with the share
// image, and the Search Console / Bing verification tags set in
// /website-content. Each page adds its own title, description and canonical.
export async function generateMetadata(): Promise<Metadata> {
  const content = await getSiteContent();
  const verification: Metadata["verification"] = {};
  if (content.googleSiteVerification) verification.google = content.googleSiteVerification;
  if (content.bingSiteVerification) verification.other = { "msvalidate.01": content.bingSiteVerification };
  return {
    metadataBase: new URL(PUBLIC_SITE_URL),
    title: { default: `Tutors in Karachi & Online Tuition in Pakistan | ${content.siteName}`, template: `%s | ${content.siteName}` },
    description: content.heroSubheadline,
    applicationName: content.siteName,
    openGraph: {
      type: "website",
      locale: "en_PK",
      siteName: content.siteName,
      description: content.heroSubheadline,
      images: [{ url: "/brand/og-default.png", width: 1200, height: 630, alt: content.siteName }],
    },
    twitter: { card: "summary_large_image" },
    verification,
    robots: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  };
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.88v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07Z" />
    </svg>
  );
}

function Logo({ siteName }: { siteName: string }) {
  const [first, ...rest] = siteName.split(" ");
  return (
    <Link href="/" className="group flex shrink-0 items-center gap-2.5" aria-label={`${siteName} — home`}>
      {/* Lili's head on the rose badge (public/brand/, 2026-10-15). */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/lili-logo-mark-192.webp"
        alt=""
        width={167}
        height={192}
        className="h-11 w-auto transition-transform duration-300 group-hover:-rotate-6"
      />
      <span className="font-heading font-bold leading-none tracking-tight">
        <span className="block text-[22px] text-rose-600">{first}</span>
        {rest.length > 0 && <span className="mt-0.5 block text-[13px] font-semibold text-slate-800">{rest.join(" ")}</span>}
      </span>
    </Link>
  );
}

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [content, featuredCount, zones] = await Promise.all([
    getSiteContent(),
    countFeaturedTutors(),
    prisma.areaZone.findMany({ select: { name: true }, orderBy: { name: "asc" } }),
  ]);

  // Desktop header (keyword pages first — SEO, 2026-10-15); "Our tutors" only
  // once at least one tutor is featured. The phone menu also gets Home, Home
  // tuition, About, FAQ and Contact.
  const nav: NavLink[] = [
    { href: "/tutors-in-karachi", label: "Tutors in Karachi" },
    { href: "/online-tuition", label: "Online tuition" },
    { href: "/subjects", label: "Subjects" },
    ...(featuredCount > 0 ? [{ href: "/our-tutors", label: "Our tutors" }] : []),
    { href: "/opportunities", label: "Tuition jobs" },
    { href: "/blog", label: "Blog" },
  ];
  const mobileNav: NavLink[] = [
    { href: "/", label: "Home" },
    ...nav,
    { href: "/home-tuition", label: "Home tuition" },
    { href: "/about", label: "About us" },
    { href: "/faq", label: "FAQ" },
    { href: "/contact", label: "Contact" },
  ];
  const whatsapp = content.whatsappNumber ? internationalDigits(content.whatsappNumber) : "";
  const year = new Date().getFullYear();

  return (
    <div className={`${headingFont.variable} ${bodyFont.variable} flex min-h-screen flex-col bg-white font-body text-slate-900`}>
      {/* Marks that JavaScript runs, before anything paints — the scroll-reveal
          CSS (app/globals.css) only hides content when it can reveal it again. */}
      <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className={`${container} relative flex h-16 items-center justify-between gap-6 sm:h-[72px]`}>
          <Logo siteName={content.siteName} />
          <nav className="hidden items-center gap-5 lg:flex xl:gap-6" aria-label="Main">
            {nav.map((l) => (
              <Link key={l.href} href={l.href} className="text-sm font-medium text-slate-600 transition hover:text-rose-600">
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="hidden items-center gap-2 lg:flex">
            <Link href="/become-a-tutor" className={`${btnSecondary} px-4 py-2.5`}>
              Become a tutor
            </Link>
            <Link href="/find-a-tutor" className={`${btnPrimary} px-4 py-2.5`}>
              Find a tutor
            </Link>
          </div>
          <MobileNav links={mobileNav} siteName={content.siteName} whatsapp={whatsapp} />
        </div>
      </header>

      {/* Who we are, for search engines and AI assistants (lib/seo/jsonLd.ts). */}
      <JsonLd data={organizationLd(content, zones.map((z) => z.name))} />
      {/* Remembers a campaign tracking link's ?ref= (lib/campaigns/ref.ts). */}
      <CampaignRefCapture />
      <main className="flex-1">{children}</main>

      <footer className="bg-slate-900 text-slate-300">
        <div className={`${container} grid grid-cols-1 gap-10 py-14 sm:grid-cols-2 lg:grid-cols-5`}>
          <div>
            <div className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/lili-logo-mark-192.webp" alt="" width={167} height={192} className="h-10 w-auto" />
              <span className="font-heading text-lg font-bold text-white">{content.siteName}</span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">{content.footerTagline}</p>
            {content.facebookUrl && (
              <a
                href={content.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white"
              >
                <FacebookIcon className="h-5 w-5 fill-current" />
                Follow us on Facebook
              </a>
            )}
          </div>
          {/* Internal links to every landing page (SEO, 2026-10-15). */}
          <div>
            <h2 className="font-heading text-sm font-semibold text-white">Tuition</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link href="/home-tuition" className="hover:text-white">Home tuition</Link></li>
              <li><Link href="/online-tuition" className="hover:text-white">Online tuition</Link></li>
              {PUBLIC_SUBJECTS.map((s) => (
                <li key={s.key}><Link href={subjectPath(s)} className="hover:text-white">{s.title} tutors</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-heading text-sm font-semibold text-white">Tutors in Karachi</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {zones.slice(0, 8).map((z) => (
                <li key={z.name}><Link href={areaPath(z.name)} className="hover:text-white">Tutors in {z.name}</Link></li>
              ))}
              <li><Link href="/tutors-in-karachi" className="hover:text-white">All areas →</Link></li>
            </ul>
          </div>
          <div>
            <h2 className="font-heading text-sm font-semibold text-white">{content.siteName}</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link href="/find-a-tutor" className="hover:text-white">Find a tutor</Link></li>
              <li><Link href="/become-a-tutor" className="hover:text-white">Become a tutor</Link></li>
              <li><Link href="/opportunities" className="hover:text-white">Tuition jobs</Link></li>
              {featuredCount > 0 && <li><Link href="/our-tutors" className="hover:text-white">Our tutors</Link></li>}
              <li><Link href="/about" className="hover:text-white">About us</Link></li>
              <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
              <li><Link href="/faq" className="hover:text-white">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <h2 className="font-heading text-sm font-semibold text-white">Contact</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {whatsapp && (
                <li>
                  <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                    WhatsApp: {content.whatsappNumber}
                  </a>
                </li>
              )}
              {content.phoneNumber && (
                <li>
                  <a href={`tel:+${internationalDigits(content.phoneNumber)}`} className="hover:text-white">
                    Call: {content.phoneNumber}
                  </a>
                </li>
              )}
              {content.contactEmail && (
                <li>
                  <a href={`mailto:${content.contactEmail}`} className="break-all hover:text-white">
                    {content.contactEmail}
                  </a>
                </li>
              )}
              {content.serviceArea && <li className="text-slate-400">Serving {content.serviceArea}</li>}
              <li><Link href="/contact" className="hover:text-white">All contact options →</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className={`${container} flex flex-col gap-2 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between`}>
            <p>
              © {year} {content.siteName}. A registered company — part of Suntex Services.
            </p>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <Link href="/terms" className="hover:text-slate-300">
                Terms &amp; Conditions
              </Link>
              <Link href="/tutor-agreement" className="hover:text-slate-300">
                Tutor Agreement
              </Link>
              <Link href="/privacy" className="hover:text-slate-300">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>

      <WhatsAppButton number={whatsapp} />
    </div>
  );
}
