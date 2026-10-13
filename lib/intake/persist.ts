// DB writes for completed / declined intake (CLAUDE.md 6.1 step 6-7, 10).

import { prisma } from "@/lib/db";
import type { TutorDraft, ParentDraft } from "@/lib/intake/helpers";
import type { DocKind } from "@/lib/intake/documents";
import { findNearestZone } from "@/lib/geo/nearestZone";

/** Case-insensitive lookup of the AreaZone a free-text area string refers to. */
export async function resolveZone(area: string) {
  const zones = await prisma.areaZone.findMany();
  const a = area.toLowerCase().trim();
  return (
    zones.find((z) => z.name.toLowerCase() === a) ??
    zones.find((z) => a.includes(z.name.toLowerCase()) || z.name.toLowerCase().includes(a)) ??
    null
  );
}

const ZONE_UNMATCHED_NOTE = "area not in zone table — add the zone or correct the area";

/** Resolves the zone/area + lat/long for a draft that may include a precise
 * coordinate from a shared Google Maps location link (lib/geo/googleMapsLink.ts).
 * When present, the precise coordinate wins over the free-text `area` guess —
 * it overrides both the matched zone (nearest by Haversine distance, not LLM
 * guess) and the stored latitude/longitude (the true coordinate, not the
 * zone's centroid). Falls back to the existing name-based resolveZone()
 * behavior when no precise coordinate is present — completely unchanged for
 * the common case. */
async function resolveAreaAndCoords(draft: { area?: string | null; preciseLatitude?: number | null; preciseLongitude?: number | null }) {
  if (draft.preciseLatitude != null && draft.preciseLongitude != null) {
    const zone = await findNearestZone(draft.preciseLatitude, draft.preciseLongitude);
    return {
      zone,
      areaName: zone?.name ?? draft.area ?? "",
      latitude: draft.preciseLatitude,
      longitude: draft.preciseLongitude,
    };
  }
  const zone = draft.area ? await resolveZone(draft.area) : null;
  return {
    zone,
    areaName: draft.area ?? "",
    latitude: zone?.latitude ?? null,
    longitude: zone?.longitude ?? null,
  };
}

export async function upsertTutor(opts: {
  whatsappId: string;
  draft: TutorDraft;
  rawMessage: string;
  campaignId?: string | null;
  status: "active" | "inactive" | "pending";
  internalNote?: string | null;
}) {
  const { whatsappId, draft, rawMessage, campaignId, status } = opts;
  const { zone, areaName, latitude, longitude } = await resolveAreaAndCoords(draft);
  const notes = [opts.internalNote, zone ? null : draft.area ? ZONE_UNMATCHED_NOTE : null]
    .filter(Boolean)
    .join("; ");

  const data = {
    name: draft.name ?? "",
    email: draft.email ?? null,
    phone: draft.phone ?? null,
    qualification: draft.qualification ?? "",
    subjects: draft.subjects ?? [],
    subjectGroup: draft.subjectGroup ?? "other",
    curriculum: draft.curriculum ?? "",
    gradesBySubject: draft.gradesBySubject ?? undefined,
    area: areaName,
    latitude,
    longitude,
    availability: draft.availability ?? [],
    expectedFee: draft.expectedFee ?? null,
    status,
    internalNote: notes || null,
    rawMessage,
    campaignId: campaignId ?? null,
  };

  return prisma.tutor.upsert({
    where: { whatsappId },
    create: { whatsappId, ...data },
    update: data,
  });
}

export async function createParentRequest(opts: {
  whatsappId: string;
  draft: ParentDraft;
  rawMessage: string;
  campaignId?: string | null;
  status: "pending" | "closed";
  internalNote?: string | null;
}) {
  const { whatsappId, draft, rawMessage, campaignId, status } = opts;
  const { zone, areaName, latitude, longitude } = await resolveAreaAndCoords(draft);
  const notes = [
    opts.internalNote,
    draft.budget == null ? "budget not provided — confirm with parent" : null,
    zone ? null : draft.area ? ZONE_UNMATCHED_NOTE : null,
  ]
    .filter(Boolean)
    .join("; ");

  return prisma.parentRequest.create({
    data: {
      whatsappId,
      studentInfo: draft.studentInfo ?? null,
      subjects: draft.subjects ?? [],
      subjectGroup: draft.subjectGroup ?? "other",
      curriculum: draft.curriculum ?? "",
      area: areaName,
      latitude,
      longitude,
      budget: draft.budget ?? null,
      deliveryMode: draft.deliveryMode ?? "in_person",
      availability: draft.availability ?? [],
      status,
      internalNote: notes || null,
      rawMessage,
      campaignId: campaignId ?? null,
    },
  });
}

/** Records one uploaded CNIC/marksheet image against a tutor (6.1 step 10).
 * `kind: "cnic"` sets cnicImageUrl; `kind: "marksheet"` appends to
 * marksheetImageUrls. Returns the updated tutor so the caller can check
 * counts (e.g. for the auto-finalize threshold) without a second query. */
export async function recordTutorDocument(whatsappId: string, kind: DocKind, url: string) {
  if (kind === "cnic") {
    return prisma.tutor.update({ where: { whatsappId }, data: { cnicImageUrl: url } });
  }
  // Prisma's `push` compiles to Postgres array_append — atomic at the DB
  // level, so two images arriving as separate concurrent webhook deliveries
  // can never race and silently drop one (a plain read-then-write here would).
  return prisma.tutor.update({
    where: { whatsappId },
    data: { marksheetImageUrls: { push: url } },
  });
}

/** Finalizes a tutor's profile once CNIC has been provided (6.1 step 10 —
 * CNIC required, marksheet optional, per operator decision). */
export async function activateTutorAfterDocuments(whatsappId: string) {
  return prisma.tutor.update({ where: { whatsappId }, data: { status: "active" } });
}
