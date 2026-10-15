// Tailwind class strings shared by the Lili form (LiliForm.tsx,
// LocationStep.tsx, NearMeControls.tsx) — aliases of the public site's
// design tokens in ui.ts (2026-10-15 professional redesign), kept under
// their old names so the form code didn't need to change.

import { btnPrimary, btnSecondary, chip, chipActive, input } from "./ui";

export const inputClass = input;
export const chipClass = chip;
export const chipActiveClass = chipActive;
export const primaryClass = btnPrimary;
export const secondaryClass = btnSecondary;
export const linkClass = "text-sm font-semibold text-slate-500 underline-offset-2 hover:text-slate-900 hover:underline";
