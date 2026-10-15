// "What we teach" — the public subject catalogue shown on the homepage and
// /subjects (2026-10-15 redesign). Marketing categories, each linked to the
// matching subjectGroup (lib/subjectGroups.ts) so "Find a tutor" can preselect
// it in the Lili form. O & A-levels span several groups (pre-medical,
// pre-engineering, …) and FSc covers two, so those cards don't preselect one.

import type { SubjectGroup } from "@/lib/subjectGroups";

export type SubjectIconKey = "book" | "globe" | "flask" | "code" | "spark" | "cap";

export interface PublicSubject {
  key: string;
  title: string;
  /** One line under the title. */
  levels: string;
  description: string;
  subjects: string[];
  group: SubjectGroup | null;
  icon: SubjectIconKey;
  /** Tailwind classes for the icon tile. */
  tint: string;
}

export const PUBLIC_SUBJECTS: PublicSubject[] = [
  {
    key: "school",
    title: "School (Primary–Matric)",
    levels: "Class 1 to 10 · Matric / SSC",
    description: "Strong foundations and exam preparation for school students, from the early classes through Matric board exams.",
    subjects: ["Maths", "English", "Urdu", "Science", "Physics", "Chemistry", "Biology", "Computer", "Islamiat", "Pakistan Studies"],
    group: "school",
    icon: "book",
    tint: "bg-amber-50 text-amber-600",
  },
  {
    key: "olevels",
    title: "O & A-levels",
    levels: "Cambridge / Edexcel · IGCSE · AS & A2",
    description: "Specialist tutors for the British curriculum, matched by the grades they achieved in the very subjects they teach.",
    subjects: ["Maths", "Physics", "Chemistry", "Biology", "Computer Science", "English", "Economics", "Accounting", "Business"],
    group: null,
    icon: "globe",
    tint: "bg-sky-50 text-sky-600",
  },
  {
    key: "fsc",
    title: "FSc / Intermediate",
    levels: "Pre-Medical · Pre-Engineering",
    description: "Board exam preparation for pre-medical and pre-engineering students, from tutors who've been there.",
    subjects: ["Biology", "Chemistry", "Physics", "Maths", "English"],
    group: null,
    icon: "flask",
    tint: "bg-rose-50 text-rose-600",
  },
  {
    key: "computer",
    title: "Computer Science",
    levels: "School · O/A-levels · ICS · University",
    description: "Programming and computer science at every level — from first lines of code to university coursework.",
    subjects: ["Python", "Java", "C++", "Web development", "Databases", "Data structures"],
    group: "computer",
    icon: "code",
    tint: "bg-violet-50 text-violet-600",
  },
  {
    key: "skills",
    title: "Skills",
    levels: "Languages · Arts · Professional skills",
    description: "Practical skills and courses taught one-on-one, at home or online.",
    subjects: ["Spoken English", "Drawing", "MS Office", "Graphic design"],
    group: "skills",
    icon: "spark",
    tint: "bg-teal-50 text-teal-600",
  },
  {
    key: "university",
    title: "University",
    levels: "BS · BBA · MBBS · Engineering",
    description: "Course help and exam preparation for university students, from tutors with strong results in the same programmes.",
    subjects: ["Calculus", "Statistics", "Accounting", "Economics", "Engineering courses", "Medical sciences"],
    group: "university_level",
    icon: "cap",
    tint: "bg-indigo-50 text-indigo-600",
  },
];

/** Link to the Lili parent form, preselecting the category when there is one. */
export function findTutorHref(s: PublicSubject): string {
  return s.group ? `/find-a-tutor?group=${s.group}` : "/find-a-tutor";
}
