// Evidence of what a tutor agreed to (2026-10-19). When a tutor registers on
// /become-a-tutor, the exact text of the Tutor Agreement and the Terms &
// Conditions shown to them is stored as plain text in TermsAcceptance, with a
// short version code so two acceptances of the same wording can be matched
// up. Pure — works the same in Node and on Cloudflare Workers (Web Crypto).

import { parseLegalText } from "@/lib/legalText";
import type { TermsSection } from "@/lib/defaultTerms";

export type AgreementDocument = "tutor_agreement" | "terms";

export const DOCUMENT_TITLES: Record<AgreementDocument, string> = {
  tutor_agreement: "Tutor Agreement",
  terms: "Terms & Conditions",
};

/** Sections with any text, as shown on the public page. */
export function visibleSections(sections: TermsSection[]): TermsSection[] {
  return sections.filter((s) => s.heading.trim() || s.body.trim());
}

/** The document as one plain-text copy, numbered the way the public page shows it. */
export function agreementPlainText(title: string, updatedOn: string, sections: TermsSection[]): string {
  const parts = [title, `Last updated ${updatedOn}`];
  visibleSections(sections).forEach((s, i) => {
    const blocks = parseLegalText(s.body).map((b) => (b.kind === "p" ? b.text : b.items.map((item) => `- ${item}`).join("\n")));
    parts.push([s.heading ? `${i + 1}. ${s.heading}` : `${i + 1}.`, ...blocks].join("\n\n"));
  });
  return parts.join("\n\n");
}

/** 12-hex-character SHA-256 of the visible wording — changes whenever the text does. */
export async function agreementVersion(sections: TermsSection[]): Promise<string> {
  const data = new TextEncoder().encode(JSON.stringify(visibleSections(sections).map((s) => [s.heading, s.body])));
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest).slice(0, 6), (b) => b.toString(16).padStart(2, "0")).join("");
}
