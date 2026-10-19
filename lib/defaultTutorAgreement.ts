// Starting draft of the Tutor Agreement (/tutor-agreement, 2026-10-19) — used
// until the operator edits it in /website-content. Tutors must read it (the
// /become-a-tutor form shows it in full) and tick to agree before they can
// register; an exact copy of what each tutor agreed to is kept as evidence
// (TermsAcceptance, lib/tutorAgreement.ts).
//
// Operator decisions (2026-10-19): no direct dealing with an introduced
// family for 12 months from the introduction; breaking that costs the tutor
// one full month of that tuition's fee per student. Written in short, plain
// sentences so a tutor can't credibly say they didn't understand it. It is a
// draft, not legal advice — the operator should have a lawyer review it.
// Body format: lib/legalText.ts.

import type { TermsSection } from "@/lib/defaultTerms";

export const DEFAULT_TUTOR_AGREEMENT: TermsSection[] = [
  {
    heading: "In short",
    body: `- When we introduce you to a family, you must not teach that family privately without us, or help them avoid paying us, for 12 months from the introduction.
- The first month's fee for every tuition we introduce is paid through us. From the second month on, you can carry on with the family as agreed.
- If a family we introduced contacts you directly, tell us within 2 days.
- If you break this rule, you must pay us one full month of that tuition's fee for each student, and we may remove you from our academy.
- We keep records of every introduction and of this agreement, and we can use them as evidence.`,
  },
  {
    heading: "About this agreement",
    body: `This agreement is between you (the tutor) and Lili Tutor Academy, part of Suntex Services ("we", "us"). It applies from the moment you register and to every family we introduce you to.

It is in addition to our Terms & Conditions and Privacy Policy. If anything here is different from the Terms & Conditions, this agreement is what applies between you and us.

By ticking the box when you register, you confirm that you have read this agreement, understood it and agree to it.`,
  },
  {
    heading: "What counts as an introduction",
    body: `An "introduction" happens whenever we connect you with a family in any way, for example:
- we tell you about a student, a tuition or a family's area, subject or needs (on WhatsApp, by phone, on our website or on our Facebook page);
- you say you are interested in a tuition listed on our website ("Tuition jobs");
- we arrange a demo class, a call or a meeting between you and the family;
- we share your profile or details with the family, or theirs with you.

An "introduced family" means the parent or guardian, the student, and every other child or person in the same household. The "introduction date" is the first time any of the above happens.`,
  },
  {
    heading: "Our fee",
    body: `Registering with us is free. When you are placed with a student, the family pays the first month's fee through us. We keep our matching fee from it and pay you the rest. We will tell you the exact amount before you accept the tuition.

From the second month on, the fee is paid as agreed between you and the family.`,
  },
  {
    heading: "No direct dealing with introduced families",
    body: `For 12 months from the introduction date, you must not — yourself, or through a friend, relative, another academy or anyone else:
- teach, or agree to teach, any student of an introduced family unless that tuition was arranged through us and its first month's fee was paid through us;
- do this after a demo class, after the family says they are not interested, or after they stop using our service — the rule still applies;
- share your phone number, WhatsApp, social media or any other contact details with the family in order to arrange lessons or payment outside our academy;
- ask or allow the family to pay you directly for the first month, or offer them a lower fee for leaving us out;
- tell the family not to use our service, or accept their offer to do any of the above.

If an introduced family asks you to teach another child or another subject within these 12 months, tell us first so it can be arranged through us.`,
  },
  {
    heading: "If a family contacts you directly",
    body: `If an introduced family (or anyone on their behalf) contacts you directly about lessons, tell us within 2 days on our WhatsApp and ask them to arrange it through us. Telling us costs you nothing — it protects you, and you will not lose the tuition.`,
  },
  {
    heading: "If you break this agreement",
    body: `If you break the rules in "No direct dealing with introduced families":
- you must pay us an amount equal to one full month of the fee for that tuition, for each student you teach in breach. The fee is the monthly fee you agreed with the family; if we can't confirm it, it is the fee the family or you told us when you were introduced;
- you must pay this within 14 days of us asking you to in writing (a WhatsApp message counts);
- we may remove your profile, stop introducing you to families and remove any public profile of you from our website.

This amount is a fair estimate of what we lose when a tuition we found is taken outside our academy — our matching fee, plus the advertising, checking and arranging it took. If you do not pay, we may take legal action to recover it, together with any costs the law allows.`,
  },
  {
    heading: "Our records and evidence",
    body: `We keep records of every introduction: messages, dates, the family's details, demo arrangements and payments.

When you agree to this agreement, we keep an exact copy of the version you agreed to, with the date and time, the WhatsApp number you registered with, your internet (IP) address and your device details.

You agree that these records can be used as evidence of your introductions and of this agreement — including in any dispute or court case.`,
  },
  {
    heading: "Your conduct",
    body: `- The information and documents you give us (including your CNIC, marksheets and grades) must be true and your own.
- Be punctual, prepared and professional, and treat students and families with respect.
- Keep each family's details private. Do not share them with anyone, or use them for anything other than the tuition.
- We may decline, pause or remove your profile — for example, if information turns out to be untrue, we receive serious complaints or you break this agreement.`,
  },
  {
    heading: "If you leave us",
    body: `You can stop using our service at any time by telling us. Even after you leave, or if we remove your profile, the rules on no direct dealing, reporting contact and payment for a breach still apply for 12 months after each introduction we made.`,
  },
  {
    heading: "General",
    body: `- This agreement is governed by the laws of Pakistan, and the courts of Karachi can decide any dispute about it.
- If any part of it is found to be unenforceable, the rest still applies.
- We may update this agreement. The date at the top shows when it last changed. The version you agreed to applies to introductions made before a change; a new version applies to introductions made after we tell you about it.`,
  },
];
