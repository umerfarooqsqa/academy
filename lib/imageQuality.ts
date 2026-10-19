// "Is this marksheet/CNIC photo good enough to read?" (2026-10-19, operator
// chose a browser-only check: free, instant, nothing leaves the tutor's
// phone). Pure — the browser side (app/(public)/photoQuality.ts) scales the
// photo to fit PHOTO_ANALYSIS_SIZE, turns it grey and calls assessPhoto.
//
// Sharpness is the variance of the Laplacian (an edge filter): crisp text
// gives a high value, blur a low one. Calibrated on a marksheet-like page
// scaled to 768×1024: sharp ≈ 6,000–8,500, a 1px blur (still readable)
// ≈ 100–400, a 2px blur (text unreadable) ≈ 7–17. BLUR_THRESHOLD sits between
// the last two so only genuinely unreadable photos are flagged. Warnings
// only — the tutor can still use the photo.

/** Longest side, in pixels, the photo is scaled to before analysis (the calibration size). */
export const PHOTO_ANALYSIS_SIZE = 1024;

const BLUR_THRESHOLD = 40;
const MIN_SHORT_SIDE = 700; // original pixels; phone photos are ≥ 1080
const DARK_MEAN = 70;
const BRIGHT_MEAN = 248;

export type PhotoIssue = "blurry" | "too_dark" | "too_bright" | "low_resolution";

export const PHOTO_ISSUE_TEXT: Record<PhotoIssue, string> = {
  blurry: "looks blurry",
  too_dark: "is too dark",
  too_bright: "is too bright or washed out",
  low_resolution: "is very small (low resolution)",
};

export interface PhotoReport {
  issues: PhotoIssue[];
  sharpness: number;
  brightness: number;
}

/** Luminance (0–255) of RGBA pixel data. */
export function toGray(rgba: ArrayLike<number>): Float32Array {
  const gray = new Float32Array(rgba.length / 4);
  for (let i = 0; i < gray.length; i++) gray[i] = 0.299 * rgba[i * 4] + 0.587 * rgba[i * 4 + 1] + 0.114 * rgba[i * 4 + 2];
  return gray;
}

/** `gray` is the scaled-down photo (width × height); original* are its real pixel dimensions. */
export function assessPhoto(
  gray: ArrayLike<number>,
  width: number,
  height: number,
  originalWidth: number,
  originalHeight: number,
): PhotoReport {
  let total = 0;
  for (let i = 0; i < width * height; i++) total += gray[i];
  const brightness = total / (width * height);

  let sum = 0;
  let sumSq = 0;
  let n = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const lap = gray[i - 1] + gray[i + 1] + gray[i - width] + gray[i + width] - 4 * gray[i];
      sum += lap;
      sumSq += lap * lap;
      n++;
    }
  }
  const sharpness = n > 0 ? sumSq / n - (sum / n) ** 2 : 0;

  const issues: PhotoIssue[] = [];
  if (Math.min(originalWidth, originalHeight) < MIN_SHORT_SIDE) issues.push("low_resolution");
  if (brightness < DARK_MEAN) issues.push("too_dark");
  else if (brightness > BRIGHT_MEAN) issues.push("too_bright");
  if (sharpness < BLUR_THRESHOLD) issues.push("blurry");
  return { issues, sharpness: Math.round(sharpness), brightness: Math.round(brightness) };
}

/** "looks blurry and is too dark" */
export function describeIssues(issues: PhotoIssue[]): string {
  const parts = issues.map((i) => PHOTO_ISSUE_TEXT[i]);
  return parts.length <= 1 ? (parts[0] ?? "") : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}
