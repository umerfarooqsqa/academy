// Public "Featured tutors" profiles (2026-10-15 operator decision). The admin
// fills in each profile on /tutors/[id] and ticks "Featured"; the website
// shows a tutor only when featured AND verified (lib/tutors/verified.ts —
// active, CNIC on file and checked). Only public fields ever leave here:
// first name + last initial, photo, headline, about, area, subjects, grades,
// experience, education, rating and verification badges — never the
// WhatsApp number, CNIC/marksheet images, fee or exact location.

import { prisma } from "@/lib/db";
import { VERIFIED_TUTOR_WHERE } from "@/lib/tutors/verified";

export interface ExperienceItem {
  title: string;
  place: string;
  period: string;
  description: string;
}

export interface EducationItem {
  degree: string;
  institution: string;
  year: string;
}

export interface PublicTutorProfile {
  id: string;
  displayName: string;
  photoUrl: string | null;
  headline: string | null;
  bio: string | null;
  qualification: string;
  area: string;
  deliveryMode: string;
  subjects: string[];
  subjectGroup: string;
  curriculum: string;
  grades: { subject: string; grade: string }[];
  gradesVerified: boolean;
  idVerified: true;
  yearsExperience: number | null;
  experience: ExperienceItem[];
  education: EducationItem[];
  rating: number | null; // null until rated
  ratingCount: number;
}

/** "Ayesha Khan" → "Ayesha K."; a single name stays as is. */
export function displayName(full: string): string {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Tutor";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
}

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

export function parseExperience(json: unknown): ExperienceItem[] {
  if (!Array.isArray(json)) return [];
  return json
    .map((e) => ({ title: str(e?.title), place: str(e?.place), period: str(e?.period), description: str(e?.description) }))
    .filter((e) => e.title || e.place);
}

export function parseEducation(json: unknown): EducationItem[] {
  if (!Array.isArray(json)) return [];
  return json
    .map((e) => ({ degree: str(e?.degree), institution: str(e?.institution), year: str(e?.year) }))
    .filter((e) => e.degree || e.institution);
}

type TutorRow = {
  id: string;
  name: string;
  profilePhotoUrl: string | null;
  profileHeadline: string | null;
  profileBio: string | null;
  qualification: string;
  area: string;
  deliveryMode: string;
  subjects: string[];
  subjectGroup: string;
  curriculum: string;
  gradesBySubject: unknown;
  gradesVerifiedAt: Date | null;
  yearsExperience: number | null;
  profileExperience: unknown;
  profileEducation: unknown;
  rating: number;
  ratingCount: number;
};

export function toPublicProfile(t: TutorRow): PublicTutorProfile {
  const grades =
    t.gradesBySubject && typeof t.gradesBySubject === "object"
      ? Object.entries(t.gradesBySubject as Record<string, unknown>)
          .filter(([, g]) => typeof g === "string" && g.trim())
          .map(([subject, grade]) => ({ subject, grade: String(grade).trim() }))
      : [];
  return {
    id: t.id,
    displayName: displayName(t.name),
    photoUrl: t.profilePhotoUrl,
    headline: t.profileHeadline?.trim() || null,
    bio: t.profileBio?.trim() || null,
    qualification: t.qualification,
    area: t.area,
    deliveryMode: t.deliveryMode,
    subjects: t.subjects,
    subjectGroup: t.subjectGroup,
    curriculum: t.curriculum,
    grades,
    gradesVerified: t.gradesVerifiedAt != null,
    idVerified: true,
    yearsExperience: t.yearsExperience,
    experience: parseExperience(t.profileExperience),
    education: parseEducation(t.profileEducation),
    rating: t.ratingCount > 0 ? t.rating : null,
    ratingCount: t.ratingCount,
  };
}

const SELECT = {
  id: true,
  name: true,
  profilePhotoUrl: true,
  profileHeadline: true,
  profileBio: true,
  qualification: true,
  area: true,
  deliveryMode: true,
  subjects: true,
  subjectGroup: true,
  curriculum: true,
  gradesBySubject: true,
  gradesVerifiedAt: true,
  yearsExperience: true,
  profileExperience: true,
  profileEducation: true,
  rating: true,
  ratingCount: true,
} as const;

const PUBLIC_WHERE = { ...VERIFIED_TUTOR_WHERE, featured: true };

export async function getFeaturedTutors(): Promise<PublicTutorProfile[]> {
  const rows = await prisma.tutor.findMany({
    where: PUBLIC_WHERE,
    select: SELECT,
    orderBy: [{ ratingCount: "desc" }, { createdAt: "asc" }],
  });
  return rows.map(toPublicProfile);
}

/** A single featured, verified tutor — null for anyone else (the page 404s). */
export async function getPublicTutorProfile(id: string): Promise<PublicTutorProfile | null> {
  const row = await prisma.tutor.findFirst({ where: { ...PUBLIC_WHERE, id }, select: SELECT });
  return row ? toPublicProfile(row) : null;
}
