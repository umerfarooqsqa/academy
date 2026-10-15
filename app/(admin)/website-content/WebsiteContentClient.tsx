"use client";

// /website-content editor (2026-10-13; 2026-10-15 redesign added contact
// details, titled how-it-works steps and FAQs). Everything here is shown on
// the public website — see lib/siteContent.ts for where each field appears.

import { useState } from "react";
import { card, input, label, btnPrimary, btnSecondary } from "@/app/components/ui";
import type { Faq, HowItWorksStep, SiteContent } from "@/lib/siteContent";

type ListKey = "howItWorksSteps" | "faqs" | "testimonials" | "terms";

function Field({
  title,
  hint,
  value,
  onChange,
  multiline = false,
  type = "text",
  placeholder,
}: {
  title: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className={label}>
        {title}
        {hint && <span className="ml-1 font-normal text-gray-500">— {hint}</span>}
      </label>
      {multiline ? (
        <textarea className={`${input} min-h-20`} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className={input} type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-4 border-t border-gray-200 pt-5 first:border-t-0 first:pt-0">
      <legend className="mb-1 text-base font-semibold text-gray-900">{title}</legend>
      {children}
    </fieldset>
  );
}

export default function WebsiteContentClient({ initial }: { initial: SiteContent }) {
  const [content, setContent] = useState<SiteContent>(initial);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setBusy(true);
    setSaved(false);
    const res = await fetch("/api/website-content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(content),
    });
    const data = await res.json().catch(() => ({}));
    // The server stamps the terms' "Last updated" date when they change.
    if (typeof data.termsUpdatedOn === "string") setContent((c) => ({ ...c, termsUpdatedOn: data.termsUpdatedOn }));
    setBusy(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const set = <K extends keyof SiteContent>(key: K, value: SiteContent[K]) => setContent((c) => ({ ...c, [key]: value }));

  function updateItem<K extends ListKey>(key: K, i: number, patch: Partial<SiteContent[K][number]>) {
    setContent((c) => ({ ...c, [key]: (c[key] as object[]).map((item, idx) => (idx === i ? { ...item, ...patch } : item)) }));
  }
  function addItem<K extends ListKey>(key: K, item: SiteContent[K][number]) {
    setContent((c) => ({ ...c, [key]: [...(c[key] as object[]), item] }));
  }
  function removeItem(key: ListKey, i: number) {
    setContent((c) => ({ ...c, [key]: (c[key] as object[]).filter((_, idx) => idx !== i) }));
  }
  function moveItem(key: ListKey, i: number, dir: -1 | 1) {
    setContent((c) => {
      const list = [...(c[key] as object[])];
      const j = i + dir;
      if (j < 0 || j >= list.length) return c;
      [list[i], list[j]] = [list[j], list[i]];
      return { ...c, [key]: list };
    });
  }

  const rowButtons = (key: ListKey, i: number) => (
    <div className="flex gap-1.5">
      <button className={btnSecondary} onClick={() => moveItem(key, i, -1)} type="button" aria-label="Move up">
        ↑
      </button>
      <button className={btnSecondary} onClick={() => moveItem(key, i, 1)} type="button" aria-label="Move down">
        ↓
      </button>
      <button className={btnSecondary} onClick={() => removeItem(key, i)} type="button">
        Remove
      </button>
    </div>
  );

  return (
    <div className={`${card} mt-4 flex flex-col gap-6`}>
      <Group title="Basics">
        <Field title="Site name" hint="nav, footer and browser tab" value={content.siteName} onChange={(v) => set("siteName", v)} />
        <Field title="Footer tagline" hint="one line under the logo in the footer" value={content.footerTagline} onChange={(v) => set("footerTagline", v)} />
      </Group>

      <Group title="Contact details (each one is hidden on the site while empty)">
        <Field
          title="WhatsApp number"
          hint="the floating WhatsApp button, /contact and the footer"
          placeholder="e.g. 0300 1234567"
          value={content.whatsappNumber}
          onChange={(v) => set("whatsappNumber", v)}
        />
        <Field title="Phone number for calls" placeholder="e.g. 0300 1234567" value={content.phoneNumber} onChange={(v) => set("phoneNumber", v)} />
        <Field
          title="Contact email"
          hint="also used on the Privacy page for data requests"
          type="email"
          placeholder="e.g. hello@yourdomain.com"
          value={content.contactEmail}
          onChange={(v) => set("contactEmail", v)}
        />
        <Field title="Area served" hint='shown as "Serving …"' placeholder="e.g. Karachi" value={content.serviceArea} onChange={(v) => set("serviceArea", v)} />
        <Field
          title="Facebook Page link"
          type="url"
          placeholder="https://www.facebook.com/YourPage/"
          value={content.facebookUrl}
          onChange={(v) => set("facebookUrl", v)}
        />
        <Field
          title="Google Business Place ID"
          hint="shows your live Google rating and reviews on the homepage"
          placeholder="e.g. ChIJN1t_tDeuEmsRUsoyG83frY4"
          value={content.googlePlaceId}
          onChange={(v) => set("googlePlaceId", v)}
        />
      </Group>

      <Group title="Homepage">
        <Field title="Badge above the headline" value={content.heroEyebrow} onChange={(v) => set("heroEyebrow", v)} />
        <Field title="Headline" value={content.heroHeadline} onChange={(v) => set("heroHeadline", v)} />
        <Field
          title="Site description"
          hint="shown in Google results and link previews, not on the page"
          multiline
          value={content.heroSubheadline}
          onChange={(v) => set("heroSubheadline", v)}
        />
        <Field title="Parent pitch" hint='"Why families choose us"' multiline value={content.parentPitch} onChange={(v) => set("parentPitch", v)} />
        <Field title="Tutor pitch" hint='"Looking for tuitions near you?"' multiline value={content.tutorPitch} onChange={(v) => set("tutorPitch", v)} />
      </Group>

      <Group title="How it works (steps, in order)">
        {content.howItWorksSteps.map((step: HowItWorksStep, i) => (
          <div key={i} className="flex flex-col gap-1.5 rounded border border-gray-200 p-3">
            <span className="text-xs font-semibold text-gray-500">Step {i + 1}</span>
            <input className={input} placeholder="Title" value={step.title} onChange={(e) => updateItem("howItWorksSteps", i, { title: e.target.value })} />
            <textarea
              className={`${input} min-h-16`}
              placeholder="Description"
              value={step.text}
              onChange={(e) => updateItem("howItWorksSteps", i, { text: e.target.value })}
            />
            {rowButtons("howItWorksSteps", i)}
          </div>
        ))}
        <button className={btnSecondary} onClick={() => addItem("howItWorksSteps", { title: "", text: "" })} type="button">
          Add step
        </button>
      </Group>

      <Group title="FAQ (homepage shows the first 6 parent questions; /faq shows all)">
        {content.faqs.map((f: Faq, i) => (
          <div key={i} className="flex flex-col gap-1.5 rounded border border-gray-200 p-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500">For</span>
              <select
                className={`${input} w-auto`}
                value={f.audience}
                onChange={(e) => updateItem("faqs", i, { audience: e.target.value as Faq["audience"] })}
              >
                <option value="parent">Parents</option>
                <option value="tutor">Tutors</option>
              </select>
            </div>
            <input className={input} placeholder="Question" value={f.q} onChange={(e) => updateItem("faqs", i, { q: e.target.value })} />
            <textarea className={`${input} min-h-20`} placeholder="Answer" value={f.a} onChange={(e) => updateItem("faqs", i, { a: e.target.value })} />
            {rowButtons("faqs", i)}
          </div>
        ))}
        <button className={btnSecondary} onClick={() => addItem("faqs", { q: "", a: "", audience: "parent" })} type="button">
          Add question
        </button>
      </Group>

      <Group title="Terms & Conditions (/terms — tutors must agree to these to register)">
        <p className="-mt-2 text-xs text-gray-500">
          Last updated {content.termsUpdatedOn} — this date updates by itself when you save changes here. Leave a blank line
          between paragraphs; start a line with &quot;- &quot; for a bullet point.{" "}
          <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            View page ↗
          </a>
        </p>
        {content.terms.map((s, i) => (
          <div key={i} className="flex flex-col gap-1.5 rounded border border-gray-200 p-3">
            <span className="text-xs font-semibold text-gray-500">Section {i + 1}</span>
            <input className={input} placeholder="Heading" value={s.heading} onChange={(e) => updateItem("terms", i, { heading: e.target.value })} />
            <textarea className={`${input} min-h-28`} placeholder="Text" value={s.body} onChange={(e) => updateItem("terms", i, { body: e.target.value })} />
            {rowButtons("terms", i)}
          </div>
        ))}
        <button className={btnSecondary} onClick={() => addItem("terms", { heading: "", body: "" })} type="button">
          Add section
        </button>
      </Group>

      <Group title="Testimonials (hidden while empty — only add real ones, with permission)">
        {content.testimonials.map((t, i) => (
          <div key={i} className="flex flex-col gap-1.5 rounded border border-gray-200 p-3">
            <input className={input} placeholder="Name" value={t.name} onChange={(e) => updateItem("testimonials", i, { name: e.target.value })} />
            <textarea className={`${input} min-h-16`} placeholder="Quote" value={t.quote} onChange={(e) => updateItem("testimonials", i, { quote: e.target.value })} />
            {rowButtons("testimonials", i)}
          </div>
        ))}
        <button className={btnSecondary} onClick={() => addItem("testimonials", { name: "", quote: "" })} type="button">
          Add testimonial
        </button>
      </Group>

      <div className="sticky bottom-0 -mx-1 border-t border-gray-200 bg-white px-1 pt-4">
        <button className={btnPrimary} disabled={busy} onClick={save}>
          {busy ? "Saving…" : saved ? "Saved!" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
