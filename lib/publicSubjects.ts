// "What we teach" — the public subject catalogue shown on the homepage and
// /subjects (2026-10-15 redesign), and since the SEO work the same day each
// entry also has its own landing page, /subjects/<slug>, with a keyword
// title, a direct-answer intro (quotable by AI assistants) and its own FAQs.
// Each is linked to the matching subjectGroup (lib/subjectGroups.ts) so
// "Find a tutor" can preselect it in the Lili form. O & A-levels span several
// groups (pre-medical, pre-engineering, …) and FSc covers two, so those cards
// don't preselect one. Claims stay within what the operator confirmed: free
// demo class, home and online, male and female tutors, ID-checked tutors.

import type { SubjectGroup } from "@/lib/subjectGroups";

export type SubjectIconKey = "book" | "globe" | "flask" | "code" | "spark" | "cap";

export interface PublicSubject {
  key: string;
  /** URL slug — /subjects/<slug>. */
  slug: string;
  title: string;
  /** One line under the title. */
  levels: string;
  description: string;
  subjects: string[];
  group: SubjectGroup | null;
  icon: SubjectIconKey;
  /** Tailwind classes for the icon tile. */
  tint: string;
  /** Landing page H1 and <title>. */
  seoTitle: string;
  metaDescription: string;
  /** Opening paragraph that answers the search directly. */
  intro: string;
  faqs: { q: string; a: string }[];
}

export const PUBLIC_SUBJECTS: PublicSubject[] = [
  {
    key: "school",
    slug: "school-tutors",
    title: "School (Primary–Matric)",
    levels: "Class 1 to 10 · Matric / SSC",
    description: "Strong foundations and exam preparation for school students, from the early classes through Matric board exams.",
    subjects: ["Maths", "English", "Urdu", "Science", "Physics", "Chemistry", "Biology", "Computer", "Islamiat", "Pakistan Studies"],
    group: "school",
    icon: "book",
    tint: "bg-amber-50 text-amber-600",
    seoTitle: "Primary & Matric tutors in Karachi",
    metaDescription:
      "Home and online tutors for primary classes and Matric (SSC) in Karachi — ID-checked, from your own area, with a free demo class.",
    intro:
      "Lili Tutor Academy finds home and online tutors for school students in Karachi, from Class 1 to Matric (Class 9 and 10). Tell us the class, subjects and your area, and we suggest ID-checked tutors who live near you — your first demo class is free.",
    faqs: [
      {
        q: "Do you have tutors for Matric (Class 9 and 10)?",
        a: "Yes. We match Matric students with tutors for every board subject, including Maths, Physics, Chemistry, Biology, Computer, English and Urdu — at home or online.",
      },
      {
        q: "Can a tutor teach all subjects for a primary student?",
        a: "Many of our tutors teach all core primary subjects. Tell us which subjects your child needs help with and we'll suggest tutors who cover them.",
      },
      {
        q: "Can I choose a female tutor for my child?",
        a: "Yes. When you request a tutor, tell us if you'd prefer a female or male tutor and we'll only suggest tutors who match.",
      },
    ],
  },
  {
    key: "olevels",
    slug: "o-level-a-level-tutors",
    title: "O & A-levels",
    levels: "Cambridge / Edexcel · IGCSE · AS & A2",
    description: "Specialist tutors for the British curriculum, matched by the grades they achieved in the very subjects they teach.",
    subjects: ["Maths", "Physics", "Chemistry", "Biology", "Computer Science", "English", "Economics", "Accounting", "Business"],
    group: null,
    icon: "globe",
    tint: "bg-sky-50 text-sky-600",
    seoTitle: "O-level & A-level tutors in Karachi and online",
    metaDescription:
      "O-level, IGCSE and A-level tutors for Cambridge and Edexcel — matched by their own grades in your subjects. Home tuition in Karachi or online across Pakistan.",
    intro:
      "Lili Tutor Academy matches O-level, IGCSE and A-level students with tutors who scored highly in the same subjects. Home tutors come from your own area of Karachi, and online classes are available anywhere in Pakistan and abroad — with a free first demo class.",
    faqs: [
      {
        q: "How do you choose an O-level or A-level tutor?",
        a: "Tutors tell us the grades they achieved in each subject they teach, and our matching ranks them by those grades. Tutors marked “Grades verified” have had their marksheets checked by our team.",
      },
      {
        q: "Do you cover both Cambridge and Edexcel?",
        a: "Yes. Tell us the board and the subjects when you request a tutor, and we'll suggest tutors who know that syllabus.",
      },
      {
        q: "Can O/A-level classes be online?",
        a: "Yes. Choose online when you request a tutor — online classes are open to students anywhere in Pakistan and abroad.",
      },
    ],
  },
  {
    key: "fsc",
    slug: "fsc-tutors",
    title: "FSc / Intermediate",
    levels: "Pre-Medical · Pre-Engineering",
    description: "Board exam preparation for pre-medical and pre-engineering students, from tutors who've been there.",
    subjects: ["Biology", "Chemistry", "Physics", "Maths", "English"],
    group: null,
    icon: "flask",
    tint: "bg-rose-50 text-rose-600",
    seoTitle: "FSc & Intermediate tutors in Karachi",
    metaDescription:
      "FSc pre-medical and pre-engineering tutors for Biology, Chemistry, Physics and Maths — home tuition in Karachi or online, free demo class.",
    intro:
      "Lili Tutor Academy finds FSc and Intermediate tutors for pre-medical and pre-engineering students — Biology, Chemistry, Physics and Maths. Home tutors come from your own area of Karachi, or study online from anywhere, and the first demo class is free.",
    faqs: [
      {
        q: "Do you have tutors for both pre-medical and pre-engineering?",
        a: "Yes. Pick your group when you request a tutor and we'll suggest tutors who teach those subjects.",
      },
      {
        q: "Can one tutor teach Physics, Chemistry and Maths?",
        a: "Some tutors teach several FSc subjects. Tell us every subject you need and we'll look for tutors who cover them.",
      },
    ],
  },
  {
    key: "computer",
    slug: "computer-science-tutors",
    title: "Computer Science",
    levels: "School · O/A-levels · ICS · University",
    description: "Programming and computer science at every level — from first lines of code to university coursework.",
    subjects: ["Python", "Java", "C++", "Web development", "Databases", "Data structures"],
    group: "computer",
    icon: "code",
    tint: "bg-violet-50 text-violet-600",
    seoTitle: "Computer Science & programming tutors",
    metaDescription:
      "Computer Science and programming tutors for school, O/A-levels, ICS and university — Python, Java, C++ and more. Online or home tuition in Karachi.",
    intro:
      "Lili Tutor Academy matches students with Computer Science and programming tutors for school, O/A-levels, ICS and university — including Python, Java, C++, web development and databases. Learn online from anywhere or with a home tutor in Karachi.",
    faqs: [
      {
        q: "Which programming languages do your tutors teach?",
        a: "Commonly Python, Java and C++, plus web development and databases. Tell us exactly what you're studying and we'll look for a tutor who knows it.",
      },
      {
        q: "Is Computer Science tuition better online?",
        a: "Programming works very well online because tutor and student can share screens and code together — but home tuition is available in Karachi too.",
      },
    ],
  },
  {
    key: "skills",
    slug: "skills-tutors",
    title: "Skills",
    levels: "Languages · Arts · Professional skills",
    description: "Practical skills and courses taught one-on-one, at home or online.",
    subjects: ["Spoken English", "Drawing", "MS Office", "Graphic design"],
    group: "skills",
    icon: "spark",
    tint: "bg-teal-50 text-teal-600",
    seoTitle: "Skills tutors — Spoken English, design and more",
    metaDescription:
      "One-on-one skills tutors for Spoken English, drawing, MS Office, graphic design and more — online or at home in Karachi.",
    intro:
      "Lili Tutor Academy also finds one-on-one tutors for practical skills such as Spoken English, drawing, MS Office and graphic design — online from anywhere, or at home in Karachi.",
    faqs: [
      {
        q: "Can adults take skills classes?",
        a: "Yes — skills tutoring isn't only for school students. Tell us what you'd like to learn and when you're free.",
      },
    ],
  },
  {
    key: "university",
    slug: "university-tutors",
    title: "University",
    levels: "BS · BBA · MBBS · Engineering",
    description: "Course help and exam preparation for university students, from tutors with strong results in the same programmes.",
    subjects: ["Calculus", "Statistics", "Accounting", "Economics", "Engineering courses", "Medical sciences"],
    group: "university_level",
    icon: "cap",
    tint: "bg-indigo-50 text-indigo-600",
    seoTitle: "University tutors for BS, BBA, MBBS & engineering",
    metaDescription:
      "University-level tutors for BS, BBA, MBBS and engineering courses — calculus, statistics, accounting and more. Online or home tuition in Karachi.",
    intro:
      "Lili Tutor Academy matches university students with tutors who did well in the same programmes — for BS, BBA, MBBS and engineering courses such as calculus, statistics and accounting. Classes are online or at home in Karachi.",
    faqs: [
      {
        q: "Can you find a tutor for one specific university course?",
        a: "Yes. Tell us the course name and what you're finding difficult, and we'll look for a tutor with strong results in it.",
      },
    ],
  },
];

export const subjectPath = (s: PublicSubject) => `/subjects/${s.slug}`;

/** Link to the Lili parent form, preselecting the category when there is one. */
export function findTutorHref(s: PublicSubject): string {
  return s.group ? `/find-a-tutor?group=${s.group}` : "/find-a-tutor";
}
