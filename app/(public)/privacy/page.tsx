// /privacy — public privacy policy (2026-10-15). Needed as the Privacy Policy
// URL (and the data-deletion instructions, #delete-your-data) for switching
// the "lililearn" Meta app to Live so its Facebook Page posts are public.
// Describes what this codebase actually collects and does — keep it in step
// with real data handling if that changes. The contact email comes from
// /website-content (SiteContent.contactEmail).

import type { Metadata } from "next";
import Link from "next/link";
import { getSiteContent } from "@/lib/siteContent";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Privacy Policy", alternates: { canonical: "/privacy" } };

const EFFECTIVE_DATE = "15 October 2026";

function Section({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mt-10 scroll-mt-24">
      <h2 className="font-heading text-2xl font-bold text-slate-900">{title}</h2>
      <div className="mt-3 space-y-3 text-base leading-relaxed text-slate-700">{children}</div>
    </section>
  );
}

export default async function PrivacyPage() {
  const { siteName, contactEmail } = await getSiteContent();
  const contact = contactEmail ? (
    <a href={`mailto:${contactEmail}`} className="font-semibold text-rose-600 underline underline-offset-2">
      {contactEmail}
    </a>
  ) : (
    <>us on WhatsApp, from the number you registered with</>
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="font-heading text-4xl font-bold tracking-tight text-slate-900">Privacy Policy</h1>
      <p className="mt-2 text-sm text-slate-500">Effective {EFFECTIVE_DATE}</p>
      <p className="mt-6 text-base leading-relaxed text-slate-700">
        {siteName} (also known as Lili Learn, part of Suntex Services) matches students with tutors in their own area.
        This policy explains what information we collect, why, who can see it, and how to have it deleted.
      </p>

      <Section title="What we collect">
        <p>
          <strong>From parents and students:</strong> the subjects and level needed, your area, your WhatsApp number,
          preferred times, the student&apos;s school, whether you&apos;d prefer a female or male tutor, and — only if
          you choose to give them —
          your monthly budget and notes about the student.
        </p>
        <p>
          <strong>From tutors:</strong> your name, WhatsApp number, gender, area, subjects, curriculum/level,
          qualification, the school or college you studied at, the grades you report, availability, and — if you choose — your expected fee. To verify your
          identity and grades we ask for a photo of your CNIC and your marksheet or transcript.
        </p>
        <p>
          <strong>Your location, only if you tap &ldquo;Share my location&rdquo;.</strong> Your browser asks your
          permission first. We use it to find your area and nearby tutors or tuitions. You can always type or pick
          your area instead. When you use &ldquo;Show tuitions near me&rdquo; or &ldquo;Check my area&rdquo;, the
          distance is worked out on your own device and your location is not sent to us.
        </p>
        <p>
          <strong>Messages you send us on WhatsApp</strong>, so we can understand your request and reply.
        </p>
        <p>
          <strong>Which ad or link brought you to us</strong>, if you arrived through one of our campaign links. This is
          remembered only on your own device for 30 days and contains no personal information — it just tells us which
          adverts are working.
        </p>
      </Section>

      <Section title="How we use it">
        <p>
          To match students with suitable tutors nearby, contact you about matches and demo classes, verify tutors,
          arrange payment for tuition, and keep our service safe and working. CNIC and marksheet photos are used only
          for verification and are viewed only by our team.
        </p>
      </Section>

      <Section title="What is shown publicly">
        <p>
          On our website and our Facebook Page we only ever show a tuition&apos;s subject, level, area and the
          student&apos;s school. We never
          publish a student&apos;s or parent&apos;s name, phone number, address or exact location. Public counts such
          as &ldquo;verified tutors near you&rdquo; are totals per area.
        </p>
        <p>
          <strong>Featured tutor profiles:</strong> with a tutor&apos;s agreement, we may show their profile on our
          &ldquo;Our tutors&rdquo; page — first name and last initial, an optional photo, area, subjects, grades,
          qualifications and teaching experience. We never show a tutor&apos;s phone number, fee, CNIC or documents.
        </p>
        <p>
          When we offer a parent a short list of tutors, the parent sees those tutors&apos; names and teaching details.
          A tutor is put in touch with a family only once a match is arranged.
        </p>
      </Section>

      <Section title="Who we share it with">
        <p>We do not sell your information. We use a small number of service providers to run the service:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Cloudflare — hosting this website</li>
          <li>Supabase — storing our database and uploaded documents</li>
          <li>Meta (WhatsApp and Facebook) — messaging you, and posting tuition listings to our Page</li>
          <li>Groq and Google (Gemini) — automatically reading WhatsApp messages to fill in your request</li>
          <li>JazzCash — processing tuition payments</li>
          <li>Google — showing our public Google Business rating and reviews on our homepage</li>
        </ul>
        <p>We may also share information if the law requires it.</p>
      </Section>

      <Section title="How long we keep it">
        <p>
          We keep your information while you use our service, and afterwards only as long as we need it for
          payments, records or legal reasons. You can ask us to delete it at any time.
        </p>
      </Section>

      <Section id="delete-your-data" title="Delete your data">
        <p>
          To see, correct or delete your information — including CNIC and marksheet photos — contact {contact}. Tell
          us the WhatsApp number you used with us. We will delete your data within 30 days and confirm when it&apos;s
          done.
        </p>
        <p>
          If you connected to us through Facebook, you can also remove our app in your Facebook settings under
          <em> Apps and Websites</em>, and ask us as above to delete any data we hold.
        </p>
      </Section>

      <Section title="Children">
        <p>
          Tutoring requests for students are made by a parent or guardian. Students should not send us their own
          details without a parent or guardian.
        </p>
      </Section>

      <Section title="Changes">
        <p>
          If we change this policy we will update this page and the date at the top. Questions? Contact {contact}.
        </p>
      </Section>

      <p className="mt-12 text-sm text-slate-500">
        <Link href="/" className="font-semibold text-slate-700 underline underline-offset-2">
          Back to home
        </Link>
      </p>
    </div>
  );
}
