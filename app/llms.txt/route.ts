// /llms.txt (GEO, 2026-10-15) — a plain-text summary of the academy for AI
// assistants (ChatGPT, Gemini, Perplexity, Claude…): who we are, what we
// offer, where, how matching and verification work, and the key pages.
// Built from live site content, so it never goes stale. Public, no personal
// data — only the business's own contact details.

import { prisma } from "@/lib/db";
import { getSiteContent } from "@/lib/siteContent";
import { absUrl } from "@/lib/site";
import { areaPath } from "@/lib/seo/areas";
import { PUBLIC_SUBJECTS, subjectPath } from "@/lib/publicSubjects";
import { getPublishedArticles } from "@/lib/articles";

export const dynamic = "force-dynamic";

export async function GET() {
  const [c, zones, articles] = await Promise.all([
    getSiteContent(),
    prisma.areaZone.findMany({ select: { name: true }, orderBy: { name: "asc" } }),
    getPublishedArticles(),
  ]);
  const link = (title: string, path: string, note = "") => `- [${title}](${absUrl(path)})${note ? `: ${note}` : ""}`;

  const lines = [
    `# ${c.siteName}`,
    "",
    `> ${c.siteName} is a tutor academy in Karachi, Pakistan that matches students with ID-checked home tutors from their own neighbourhood, and with online tutors for students anywhere in Pakistan and abroad. The first demo class is free.`,
    "",
    "## Key facts",
    "- Service: home tuition in Karachi and online tuition (Pakistan and overseas students).",
    "- Levels: every class — primary, Matric/SSC, O-levels and A-levels (Cambridge and Edexcel), FSc/Intermediate (pre-medical and pre-engineering), Computer Science, skills courses and university.",
    `- Areas of Karachi covered for home tuition: ${zones.map((z) => z.name).join(", ")}.`,
    "- Home tutors are only suggested from the student's own area (or a nearby one), never across the city.",
    "- Every tutor shares their CNIC, which the team checks by hand; marksheets are checked for tutors marked “Grades verified”.",
    "- Matching ranks tutors by their own grades in the requested subjects, parent ratings and availability; the team reviews every match before the family sees it.",
    "- Families can ask for a female or male tutor.",
    "- The first demo class is free; after it, the first month's fee is paid through the academy.",
    "- Tutors register free.",
    `- Part of Suntex Services.${c.whatsappNumber ? ` WhatsApp: ${c.whatsappNumber}.` : ""}${c.contactEmail ? ` Email: ${c.contactEmail}.` : ""}`,
    "",
    "## Main pages",
    link("Find a tutor", "/find-a-tutor", "request a tutor in about two minutes"),
    link("Tutors in Karachi", "/tutors-in-karachi", "home tutors by area"),
    link("Online tuition", "/online-tuition", "for students anywhere in Pakistan and abroad"),
    link("Home tuition", "/home-tuition"),
    link("Become a tutor", "/become-a-tutor"),
    link("Tuition jobs for tutors", "/opportunities"),
    link("About us", "/about"),
    link("FAQ", "/faq"),
    link("Contact", "/contact"),
    "",
    "## Subjects",
    ...PUBLIC_SUBJECTS.map((s) => link(s.seoTitle, subjectPath(s), s.levels)),
    "",
    "## Areas of Karachi",
    ...zones.map((z) => link(`Tutors in ${z.name}, Karachi`, areaPath(z.name))),
    ...(articles.length ? ["", "## Guides", ...articles.map((a) => link(a.title, `/blog/${a.slug}`, a.description))] : []),
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
