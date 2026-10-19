// Numbered sections of an admin-edited legal page — /terms, /tutor-agreement
// and the agreement box on /become-a-tutor (2026-10-19). Plain text only
// (lib/legalText.ts), never HTML. No hooks, so it renders on the server and
// inside client components alike.

import { parseLegalText } from "@/lib/legalText";
import type { TermsSection } from "@/lib/defaultTerms";

/** "2026-10-19" → "19 October 2026". */
export function formatLegalDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

export default function LegalSections({ sections, compact = false }: { sections: TermsSection[]; compact?: boolean }) {
  return (
    <>
      {sections.map((s, i) => (
        <section key={i} id={`section-${i + 1}`} className={compact ? "mt-6 first:mt-0" : "mt-10 scroll-mt-24"}>
          {s.heading && (
            <h2 className={`font-heading font-bold text-slate-900 ${compact ? "text-lg" : "text-2xl"}`}>
              {i + 1}. {s.heading}
            </h2>
          )}
          <div className={`mt-3 space-y-3 leading-relaxed text-slate-700 ${compact ? "text-[15px]" : "text-base"}`}>
            {parseLegalText(s.body).map((b, j) =>
              b.kind === "p" ? (
                <p key={j}>{b.text}</p>
              ) : (
                <ul key={j} className="list-disc space-y-1.5 pl-6">
                  {b.items.map((item, k) => (
                    <li key={k}>{item}</li>
                  ))}
                </ul>
              ),
            )}
          </div>
        </section>
      ))}
    </>
  );
}
