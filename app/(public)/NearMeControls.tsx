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
      <p className="mt-5 text-base font-semibold text-gray-800">
        📍 {locatedLabel}{" "}
        <button type="button" onClick={reset} className="ml-1 text-sm font-bold text-rose-600 underline underline-offset-2">
          Change
        </button>
      </p>
    );
  }

  return (
    <div className="mt-5 flex flex-col items-center gap-3">
      <button type="button" className={primaryClass} onClick={locate} disabled={asking}>
        {asking ? "Finding you…" : error ? "📍 Try again" : buttonLabel}
      </button>
      {asking && (
        <p className="max-w-md text-sm text-gray-600">
          Your browser will ask to use your location — tap <strong>Allow</strong>. On a computer the pop-up appears
          near the address bar.
        </p>
      )}
      {error && <p className="max-w-md text-sm font-semibold text-amber-700">{error}</p>}
      {areas.length > 0 && (
        <label className="flex items-center gap-2 text-sm text-gray-600">
          or pick your area:
          <select
            className="rounded-full border-2 border-gray-900 bg-white px-3 py-1.5 text-sm font-semibold text-gray-900"
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
