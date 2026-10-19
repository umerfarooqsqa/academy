// Browser side of the photo quality check (lib/imageQuality.ts, 2026-10-19):
// decodes the chosen photo on the tutor's own device, scales it down and
// grades it. Nothing is uploaded or sent anywhere for this. Results are kept
// per File so the form can tell the operator which uploaded photos may be
// hard to read (buildTutorFormData → "photoQualityNote").

import { PHOTO_ANALYSIS_SIZE, assessPhoto, toGray, type PhotoReport } from "@/lib/imageQuality";

const reports = new WeakMap<File, PhotoReport>();

/** The photo's quality report, or null when this browser can't decode it (e.g. some HEIC photos). */
export async function checkPhoto(file: File): Promise<PhotoReport | null> {
  const known = reports.get(file);
  if (known) return known;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, PHOTO_ANALYSIS_SIZE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(3, Math.round(bitmap.width * scale));
    const height = Math.max(3, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0, width, height);
    const report = assessPhoto(toGray(ctx.getImageData(0, 0, width, height).data), width, height, bitmap.width, bitmap.height);
    bitmap.close();
    reports.set(file, report);
    return report;
  } catch {
    return null;
  }
}

/** A report already worked out for this file (after checkPhoto), if any. */
export function photoReport(file: File): PhotoReport | undefined {
  return reports.get(file);
}
