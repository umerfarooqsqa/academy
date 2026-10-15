"use client";

// The controls under "Check my area" / "Show tuitions near me": the button,
// a waiting hint, errors, an "or pick your area" dropdown, and — once located
// — a clear "Showing what's near X · Change" line. State lives in useNearMe.

import type { NearMeArea, useNearMe } from "./useNearMe";
import { primaryClass } from "./liliStyles";

export default function NearMeControls({
  nearMe,
  areas,
  buttonLabel,
  locatedLabel,
}: {
  nearMe: ReturnType<typeof useNearMe>;
  areas: NearMeArea[];
  buttonLabel: string;
  /** e.g. "Showing what's near PECHS" — shown once a location is set. */
  locatedLabel: string;
}) {
  const { location, asking, error, locate, pickArea, reset } = nearMe;

  if (location) {
    return (
      <p className="mt-6 text-base font-medium text-slate-700">
        📍 {locatedLabel}{" "}
        <button type="button" onClick={reset} className="ml-1 text-sm font-semibold text-rose-600 underline underline-offset-2">
          Change
        </button>
      </p>
    );
  }

  return (
    <div className="mt-6 flex flex-col items-center gap-3">
      <button type="button" className={primaryClass} onClick={locate} disabled={asking}>
        {asking ? "Finding you…" : error ? "📍 Try again" : buttonLabel}
      </button>
      {asking && (
        <p className="max-w-md text-sm text-slate-600">
          Your browser will ask to use your location — tap <strong>Allow</strong>. On a computer the pop-up appears
          near the address bar.
        </p>
      )}
      {error && <p className="max-w-md text-sm font-medium text-amber-700">{error}</p>}
      {areas.length > 0 && (
        <label className="flex items-center gap-2 text-sm text-slate-600">
          or pick your area:
          <select
            className="rounded-full bg-white px-3 py-1.5 text-sm font-medium text-slate-900 ring-1 ring-inset ring-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
            defaultValue=""
            onChange={(e) => {
              const area = areas.find((a) => a.name === e.target.value);
              if (area) pickArea(area);
            }}
          >
            <option value="" disabled>
              Choose…
            </option>
            {[...areas].sort((a, b) => a.name.localeCompare(b.name)).map((a) => (
              <option key={a.name} value={a.name}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
