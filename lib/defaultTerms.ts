// Starting draft of the public Terms & Conditions (/terms, 2026-10-15) —
// used until the operator edits it in /website-content. Written from how the
// service actually works (matching, free demo, first month paid through us,
// admin-checked tutors). It is a plain-language draft, not legal advice:
// the operator should review it, especially "Payments", "Arranging lessons
// directly" and "Our responsibility". Body format: lib/legalText.ts.

export interface TermsSection {
  heading: string;
  body: string;
}

export const DEFAULT_TERMS: TermsSection[] = [
  {
    heading: "About these terms",
    body: `These terms apply when you use our website, our WhatsApp service or our forms — whether you're a parent or guardian looking for a tutor, or a tutor looking for students. By using our service, you agree to them.

We are a tutor-matching service, part of Suntex Services, based in Pakistan.`,
  },
  {
    heading: "What we do",
    body: `We introduce families to independent tutors who teach the subjects and level they need, close to where they live or online. Our team reviews every match before a family sees it.

Tutors are independent — they are not our employees. We check each tutor's identity (CNIC) and may check their marksheets, but we can't guarantee any particular exam result or grade.`,
  },
  {
    heading: "For parents and guardians",
    body: `- Please give us accurate information about the student, the subjects and level needed, and your area.
- Your first demo class with the tutor you choose is free.
- Lessons start once you're happy with the demo and have confirmed the first month.
- For home tuition with a young student, we recommend that a parent or another adult is at home during lessons.
- If a tutor isn't the right fit, tell us and we'll offer you another tutor.`,
  },
  {
    heading: "For tutors",
    body: `- Tutors also agree to our Tutor Agreement (see the "Tutor Agreement" page), which includes the rules on dealing with families we introduce.
- The information and documents you give us (including your CNIC, marksheets and grades) must be true and your own.
- Registering is free. When you're placed with a student, a matching fee is taken from the first month's fee — we'll explain the details before you accept a tuition.
- Be punctual, prepared and professional, and treat students and families with respect.
- We may decline, pause or remove a tutor profile, for example if information turns out to be untrue or we receive serious complaints.
- With your agreement, we may show a public profile of you on our website ("Our tutors"). You can ask us to remove it at any time.`,
  },
  {
    heading: "Payments",
    body: `Nothing is due before the free demo class. After the demo, the first month's fee is paid through us; we'll send you the amount and payment details on WhatsApp before lessons begin. From the second month on, the fee is paid as agreed between the family and the tutor.`,
  },
  {
    heading: "Arranging lessons directly",
    body: `Families and tutors who are introduced through us agree not to arrange lessons privately with each other to avoid the first-month matching fee for that introduction.`,
  },
  {
    heading: "Cancellations and changes",
    body: `Please give the other side reasonable notice if you need to cancel or move a lesson, and let us know if a tuition stops or isn't working out, so we can help.`,
  },
  {
    heading: "Our responsibility",
    body: `We take care in checking tutors and suggesting good matches, but lessons are arranged between the family and the tutor. As far as the law allows, we are not responsible for what happens during lessons, or for any loss arising from an arrangement between a family and a tutor.`,
  },
  {
    heading: "Your privacy",
    body: `How we collect and use your information is explained in our Privacy Policy.`,
  },
  {
    heading: "Changes to these terms",
    body: `We may update these terms from time to time. The date at the top of this page shows when they last changed. These terms are governed by the laws of Pakistan.`,
  },
];
