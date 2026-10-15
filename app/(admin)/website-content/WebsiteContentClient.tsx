"use client";

import { useState } from "react";
import { card, input, label, btnPrimary, btnSecondary } from "@/app/components/ui";
import type { SiteContent } from "@/lib/siteContent";

export default function WebsiteContentClient({ initial }: { initial: SiteContent }) {
  const [content, setContent] = useState<SiteContent>(initial);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setBusy(true);
    setSaved(false);
    await fetch("/api/website-content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(content),
    });
    setBusy(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function updateStep(i: number, value: string) {
    const steps = [...content.howItWorks];
    steps[i] = value;
    setContent({ ...content, howItWorks: steps });
  }

  function addStep() {
    setContent({ ...content, howItWorks: [...content.howItWorks, ""] });
  }

  function removeStep(i: number) {
    setContent({ ...content, howItWorks: content.howItWorks.filter((_, idx) => idx !== i) });
  }

  function updateTestimonial(i: number, field: "name" | "quote", value: string) {
    const testimonials = content.testimonials.map((t, idx) => (idx === i ? { ...t, [field]: value } : t));
    setContent({ ...content, testimonials });
  }

  function addTestimonial() {
    setContent({ ...content, testimonials: [...content.testimonials, { name: "", quote: "" }] });
  }

  function removeTestimonial(i: number) {
    setContent({ ...content, testimonials: content.testimonials.filter((_, idx) => idx !== i) });
  }

  return (
    <div className={`${card} mt-4 flex flex-col gap-4`}>
      <div>
        <label className={label}>Site name (shown in the nav and footer)</label>
        <input className={input} value={content.siteName} onChange={(e) => setContent({ ...content, siteName: e.target.value })} />
      </div>
      <div>
        <label className={label}>Contact email (shown on the Privacy page for data requests)</label>
        <input
          className={input}
          type="email"
          placeholder="e.g. hello@yourdomain.com"
          value={content.contactEmail}
          onChange={(e) => setContent({ ...content, contactEmail: e.target.value })}
        />
      </div>
      <div>
        <label className={label}>Facebook Page link (shown in the website footer)</label>
        <input
          className={input}
          type="url"
          placeholder="https://www.facebook.com/YourPage/ — leave empty to hide"
          value={content.facebookUrl}
          onChange={(e) => setContent({ ...content, facebookUrl: e.target.value })}
        />
      </div>
      <div>
        <label className={label}>Google Business Place ID (shows your live Google rating and reviews on the homepage)</label>
        <input
          className={input}
          placeholder="e.g. ChIJN1t_tDeuEmsRUsoyG83frY4 — leave empty to hide the section"
          value={content.googlePlaceId}
          onChange={(e) => setContent({ ...content, googlePlaceId: e.target.value })}
        />
      </div>
      <div>
        <label className={label}>Eyebrow badge (small text above the headline)</label>
        <input className={input} value={content.heroEyebrow} onChange={(e) => setContent({ ...content, heroEyebrow: e.target.value })} />
      </div>
      <div>
        <label className={label}>Hero headline</label>
        <input
          className={input}
          value={content.heroHeadline}
          onChange={(e) => setContent({ ...content, heroHeadline: e.target.value })}
        />
      </div>
      <div>
        <label className={label}>Site description (shown in Google results and link previews — no longer on the homepage)</label>
        <textarea
          className={`${input} min-h-20`}
          value={content.heroSubheadline}
          onChange={(e) => setContent({ ...content, heroSubheadline: e.target.value })}
        />
      </div>
      <div>
        <label className={label}>Parent pitch</label>
        <textarea
          className={`${input} min-h-20`}
          value={content.parentPitch}
          onChange={(e) => setContent({ ...content, parentPitch: e.target.value })}
        />
      </div>
      <div>
        <label className={label}>Tutor pitch</label>
        <textarea
          className={`${input} min-h-20`}
          value={content.tutorPitch}
          onChange={(e) => setContent({ ...content, tutorPitch: e.target.value })}
        />
      </div>

      <div>
        <label className={label}>How it works (steps)</label>
        <div className="flex flex-col gap-2">
          {content.howItWorks.map((step, i) => (
            <div key={i} className="flex gap-1.5">
              <input className={input} value={step} onChange={(e) => updateStep(i, e.target.value)} />
              <button className={btnSecondary} onClick={() => removeStep(i)} type="button">
                Remove
              </button>
            </div>
          ))}
          <button className={btnSecondary} onClick={addStep} type="button">
            Add step
          </button>
        </div>
      </div>

      <div>
        <label className={label}>Testimonials</label>
        <div className="flex flex-col gap-2">
          {content.testimonials.map((t, i) => (
            <div key={i} className="flex flex-col gap-1 rounded border border-gray-200 p-2">
              <input
                className={input}
                placeholder="Name"
                value={t.name}
                onChange={(e) => updateTestimonial(i, "name", e.target.value)}
              />
              <textarea
                className={`${input} min-h-16`}
                placeholder="Quote"
                value={t.quote}
                onChange={(e) => updateTestimonial(i, "quote", e.target.value)}
              />
              <button className={btnSecondary} onClick={() => removeTestimonial(i)} type="button">
                Remove
              </button>
            </div>
          ))}
          <button className={btnSecondary} onClick={addTestimonial} type="button">
            Add testimonial
          </button>
        </div>
      </div>

      <div>
        <button className={btnPrimary} disabled={busy} onClick={save}>
          {busy ? "Saving…" : saved ? "Saved!" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
