// Shared Tailwind class strings — NOT a component library (Section 7 explicitly
// rejects one for this internal tool). Just DRY class constants so every page's
// markup stays plain and consistent.

export const card = "rounded-lg border border-gray-200 bg-white p-4 shadow-sm";
export const table = "w-full border-collapse text-sm";
export const th = "border-b border-gray-200 px-3 py-2 text-left font-medium text-gray-500";
export const td = "border-b border-gray-100 px-3 py-2 text-gray-800";
export const btnPrimary =
  "rounded bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50";
export const btnSecondary =
  "rounded border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50";
export const btnDanger =
  "rounded border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50";
export const input =
  "w-full rounded border border-gray-300 px-2.5 py-1.5 text-sm focus:border-gray-500 focus:outline-none";
export const label = "block text-xs font-medium text-gray-500 mb-1";
export const pageTitle = "text-xl font-semibold text-gray-900";
export const pageWrap = "mx-auto max-w-6xl px-4 py-6";

export function badge(tone: "gray" | "green" | "amber" | "red" | "blue" = "gray"): string {
  const tones: Record<string, string> = {
    gray: "bg-gray-100 text-gray-700",
    green: "bg-green-100 text-green-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-700",
    blue: "bg-blue-100 text-blue-700",
  };
  return `inline-block rounded-full px-2 py-0.5 text-xs font-medium ${tones[tone]}`;
}

export function statusTone(status: string): "gray" | "green" | "amber" | "red" | "blue" {
  const map: Record<string, "gray" | "green" | "amber" | "red" | "blue"> = {
    active: "green",
    approved: "green",
    collected: "green",
    paid_out: "green",
    completed: "green",
    paid: "green",
    demo_scheduled: "blue",
    sent_to_parent: "blue",
    selected: "blue",
    matched: "blue",
    pending: "amber",
    awaiting_approval: "amber",
    inactive: "gray",
    closed: "gray",
    cancelled: "gray",
    lapsed: "amber",
    rejected: "red",
  };
  return map[status] ?? "gray";
}
