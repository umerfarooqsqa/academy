// Opportunity reference codes (CLAUDE.md 6.5 step 2/4, Section 13). Short
// reference like "OPP-1234" shown on the public /opportunities page — no parent
// contact info. A tutor referencing the code in an inbound WhatsApp message is
// parsed with this same regex (6.5 step 4) — no LLM call needed.

const OPP_CODE_REGEX = /OPP-(\d{4,6})/i;

/** Generates a candidate code. The caller retries on a unique-constraint clash
 * against Match.opportunityCode (astronomically rare with a 6-digit space, but
 * not impossible). */
export function generateOpportunityCode(): string {
  const n = Math.floor(1000 + Math.random() * 9000); // 4 digits, e.g. OPP-1234
  return `OPP-${n}`;
}

/** Extracts the first OPP-XXXX code from a free-text inbound message, if any. */
export function parseOpportunityCode(text: string): string | null {
  const match = text.match(OPP_CODE_REGEX);
  return match ? `OPP-${match[1]}` : null;
}
