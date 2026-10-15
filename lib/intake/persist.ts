// DB writes for completed / declined intake (CLAUDE.md 6.1 step 6-7, 10).

import { prisma } from "@/lib/db";
import type { TutorDraft, ParentDraft } from "@/lib/intake/helpers";
import type { DocKind } from "@/lib/intake/documents";
import { findNearestZone } from "@/lib/geo/nearestZone";
import { matchZoneByName } from "@/lib/geo/zoneLookup";
import { newOpportunityCode } from "@/lib/opportunities/requestCode";

/** Case-insensitive lookup of the AreaZone a free-text area string refers to. */
export async function resolveZone(area: string) {
  return matchZoneByName(area, await prisma.areaZone.findMany());
}

const ZONE_UNMATCHED_NOTE = "area not in zone table — add the zone or correct the area";
const OUTSIDE_ZONES_NOTE = "location outside all zones — verify";

type LocatedDraft = { area?: string | null; preciseLatitude?: number | null; preciseLongitude?: number | null };

/** Resolves the zone/area + lat/long for a draft that may include a precise
 * coordinate (a shared Google Maps location link, or the public site's "Share
 * my location" button). When present and within the nearest zone's maxKm,
 * the precise coordinate wins over the free-text `area` — it picks the zone
 * (nearest by Haversine distance, not a guess) and is stored as-is instead of
 * the zone centroid. When it's outside every zone's range (2026-10-14
 * decision), it is NOT snapped to the nearest zone: the area falls back to
 * the person's own `area` answer, the true coordinate is still stored, and
 * the record is flagged. No precise coordinate → the existing name-based
 * resolveZone() behavior, unchanged. */
async function resolveAreaAndCoords(draft: LocatedDraft) {
  if (draft.preciseLatitude != null && draft.preciseLongitude != null) {
    const nearest = await findNearestZone(draft.preciseLatitude, draft.preciseLongitude);
    if (nearest?.inRange) {
      return {
        zone: nearest.zone,
        areaName: nearest.zone.name,
        latitude: draft.preciseLatitude,
        longitude: draft.preciseLongitude,
        outsideZones: false,
      };
    }
    const zone = draft.area ? await resolveZone(draft.area) : null;
    return {
      zone,
      areaName: draft.area ?? "",
      latitude: draft.preciseLatitude,
      longitude: draft.preciseLongitude,
      outsideZones: nearest != null,
    };
  }
  const zone = draft.area ? await resolveZone(draft.area) : null;
  return {
    zone,
    areaName: draft.area ?? "",
    latitude: zone?.latitude ?? null,
    longitude: zone?.longitude ?? null,
    outsideZones: false,
  };
}

/** For web submissions that only shared a location (no area picked): fills
 * draft.area from the nearest zone when it's in range, so the required-field
 * checks don't reject a valid location-only submission. Out of range or no
 * coordinate → leaves `area` untouched. */
export async function fillAreaFromPreciseLocation(draft: LocatedDraft) {
  if (draft.area || draft.preciseLatitude == null || draft.preciseLongitude == null) return;
  const nearest = await findNearestZone(draft.preciseLatitude, draft.preciseLongitude);
  if (nearest?.inRange) draft.area = nearest.zone.name;
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
  const { zone, areaName, latitude, longitude, outsideZones } = await resolveAreaAndCoords(draft);
  const notes = [
    opts.internalNote,
    outsideZones ? OUTSIDE_ZONES_NOTE : null,
    zone ? null : draft.area ? ZONE_UNMATCHED_NOTE : null,
  ]
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
  const { zone, areaName, latitude, longitude, outsideZones } = await resolveAreaAndCoords(draft);
  const notes = [
    opts.internalNote,
    draft.budget == null ? "budget not provided — confirm with parent" : null,
    outsideZones ? OUTSIDE_ZONES_NOTE : null,
    zone ? null : draft.area ? ZONE_UNMATCHED_NOTE : null,
  ]
    .filter(Boolean)
    .join("; ");

  return prisma.parentRequest.create({
    data: {
      // Every open request is a public opportunity right away (2026-10-15) —
      // its OPP code goes on /opportunities and the Facebook Page.
      opportunityCode: status === "closed" ? null : await newOpportunityCode(),
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
    // A new CNIC image needs a fresh admin check (lib/tutors/verified.ts).
    return prisma.tutor.update({ where: { whatsappId }, data: { cnicImageUrl: url, cnicVerifiedAt: null } });
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
