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

export const PUBLIC_TUTOR_WHERE = { ...VERIFIED_TUTOR_WHERE, featured: true };

export async function getFeaturedTutors(): Promise<PublicTutorProfile[]> {
  const rows = await prisma.tutor.findMany({
    where: PUBLIC_TUTOR_WHERE,
    select: SELECT,
    orderBy: [{ ratingCount: "desc" }, { createdAt: "asc" }],
  });
  return rows.map(toPublicProfile);
}

/** A single featured, verified tutor — null for anyone else (the page 404s). */
export async function getPublicTutorProfile(id: string): Promise<PublicTutorProfile | null> {
  const row = await prisma.tutor.findFirst({ where: { ...PUBLIC_TUTOR_WHERE, id }, select: SELECT });
  return row ? toPublicProfile(row) : null;
}

export async function countFeaturedTutors(): Promise<number> {
  return prisma.tutor.count({ where: PUBLIC_TUTOR_WHERE });
}

/** Body fields the admin "Public profile" card sends to PATCH /api/tutors/[id]. */
const LIMITS = { headline: 120, bio: 2000, field: 120, description: 500, items: 10 } as const;

const cap = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

/**
 * Validates and tidies the public-profile part of a tutor PATCH (2026-10-15).
 * Only keys present in the body are returned; strings are trimmed and
 * length-capped, empty strings become null, lists are capped at 10 entries.
 */
export function parsePublicProfilePatch(body: Record<string, unknown>): { data: Record<string, unknown> } | { error: string } {
  const data: Record<string, unknown> = {};
  if ("featured" in body) {
    if (typeof body.featured !== "boolean") return { error: "featured must be true or false" };
    data.featured = body.featured;
  }
  if ("gradesVerified" in body) {
    if (typeof body.gradesVerified !== "boolean") return { error: "gradesVerified must be true or false" };
    data.gradesVerifiedAt = body.gradesVerified ? new Date() : null;
  }
  if ("profileHeadline" in body) data.profileHeadline = cap(body.profileHeadline, LIMITS.headline) || null;
  if ("profileBio" in body) data.profileBio = cap(body.profileBio, LIMITS.bio) || null;
  if ("yearsExperience" in body) {
    const v = body.yearsExperience;
    if (v === null || v === "") data.yearsExperience = null;
    else {
      const n = Number(v);
      if (!Number.isInteger(n) || n < 0 || n > 60) return { error: "Years of experience must be a whole number from 0 to 60" };
      data.yearsExperience = n;
    }
  }
  if ("profileExperience" in body) {
    data.profileExperience = parseExperience(body.profileExperience)
      .slice(0, LIMITS.items)
      .map((e) => ({
        title: cap(e.title, LIMITS.field),
        place: cap(e.place, LIMITS.field),
        period: cap(e.period, LIMITS.field),
        description: cap(e.description, LIMITS.description),
      }));
  }
  if ("profileEducation" in body) {
    data.profileEducation = parseEducation(body.profileEducation)
      .slice(0, LIMITS.items)
      .map((e) => ({ degree: cap(e.degree, LIMITS.field), institution: cap(e.institution, LIMITS.field), year: cap(e.year, 20) }));
  }
  return { data };
}
