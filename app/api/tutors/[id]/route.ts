import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeLiveTier } from "@/lib/tutors/tier";
import { parsePublicProfilePatch } from "@/lib/tutors/publicProfile";
import { normalizeGender } from "@/lib/tutors/gender";
import { VERIFIED_TUTOR_WHERE } from "@/lib/tutors/verified";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tutor = await prisma.tutor.findUnique({
    where: { id },
    include: { subscriptions: true, campaign: true, ratings: true },
  });
  if (!tutor) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ tutor: { ...tutor, tier: computeLiveTier(tutor.subscriptions) } });
}

// Edit profile fields, activate/deactivate (status), or set internalNote — the
// /tutors dashboard's edit + activate/deactivate actions (Section 7).
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const editable = [
    "name",
    "email",
    "phone",
    "qualification",
    "schoolName",
    "subjects",
    "subjectGroup",
    "curriculum",
    "gradesBySubject",
    "area",
    "availability",
    "expectedFee",
    "deliveryMode",
    "radiusOverrideKm",
    "status",
    "internalNote",
    "cnicImageUrl",
    "marksheetImageUrls",
    "campaignId",
  ] as const;

  const data: Record<string, unknown> = {};
  for (const f of editable) {
    if (f in body) data[f] = body[f];
  }
  // Admin CNIC check (2026-10-14) — part of the public "verified tutor"
  // definition (lib/tutors/verified.ts). Replacing the CNIC image clears it,
  // so a new document always needs a fresh check.
  if (typeof body.cnicVerified === "boolean") data.cnicVerifiedAt = body.cnicVerified ? new Date() : null;
  if ("cnicImageUrl" in body) data.cnicVerifiedAt = null;
  if ("gender" in body) data.gender = normalizeGender(body.gender);

  // Public "Featured tutors" profile (2026-10-15) — validated and length-capped.
  const profile = parsePublicProfilePatch(body);
  if ("error" in profile) return NextResponse.json({ error: profile.error }, { status: 400 });
  Object.assign(data, profile.data);
  // New marksheets need a fresh grades check, like a new CNIC.
  if ("marksheetImageUrls" in body) data.gradesVerifiedAt = null;
  // Only a verified tutor (active + CNIC checked) can be featured.
  if (profile.data.featured === true) {
    const ok = await prisma.tutor.count({ where: { id, ...VERIFIED_TUTOR_WHERE } });
    if (!ok) {
      return NextResponse.json(
        { error: "Only an active tutor with a checked CNIC can be featured — mark the CNIC verified first." },
        { status: 400 },
      );
    }
  }

  const tutor = await prisma.tutor.update({ where: { id }, data, include: { subscriptions: true } });
  return NextResponse.json({ tutor: { ...tutor, tier: computeLiveTier(tutor.subscriptions) } });
}
