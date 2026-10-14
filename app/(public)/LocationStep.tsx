"use client";

// The Lili form's location field. One tap shares the browser's location (the
// same navigator.geolocation pattern as the /opportunities page) —
// opt-in only, the permission prompt appears only after the tap. Or the
// person types their area / a nearby landmark (with matching zones suggested
// as they type) or taps one of the known areas.
//
// Shared location in range of a zone → answered straight away with that
// zone. Outside every zone's maxKm, permission denied, or no geolocation
// support → Lili says so (via onSay) and the person types or picks an area
// instead (2026-10-14 decisions). The server re-checks the same rules
// (lib/intake/persist.ts), so this is only UX.

import { useState } from "react";
import { matchZoneByName, nearestZoneWithin, type ZonePoint } from "@/lib/geo/zoneLookup";
import type { LocationAnswer } from "./liliFormFlow";
import { chipClass, inputClass, primaryClass, secondaryClass } from "./liliStyles";

export default function LocationStep({
  zones,
  onAnswer,
  onSay,
}: {
  zones: ZonePoint[];
  onAnswer: (value: LocationAnswer) => void;
  /** Replaces Lili's current line, e.g. "Looks like you're outside…". */
  onSay: (text: string) => void;
}) {
  const [mode, setMode] = useState<"ask" | "locating" | "type">("ask");
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);

  function typeInstead(line: string) {
    onSay(line);
    setMode("type");
  }

  function share() {
    if (!("geolocation" in navigator)) {
      typeInstead("Your browser can't share location — no problem! Type your area or pick it below.");
      return;
    }
    setMode("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const nearest = nearestZoneWithin(latitude, longitude, zones);
        if (nearest?.inRange) {
          onAnswer({ latitude, longitude, area: nearest.zone.name, viaGps: true });
          return;
        }
        setCoords({ latitude, longitude });
        typeInstead("Looks like you're outside the areas we cover right now. Which area is closest to you?");
      },
      (err) =>
        typeInstead(
          err.code === err.PERMISSION_DENIED
            ? "No problem! Just type your area or a nearby landmark."
            : "I couldn't get your location — type your area or a nearby landmark instead.",
        ),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 60_000 },
    );
  }

  function answerWith(area: string) {
    onAnswer({ latitude: coords?.latitude ?? null, longitude: coords?.longitude ?? null, area, viaGps: coords != null });
  }

  function submitTyped(e: React.FormEvent) {
    e.preventDefault();
    const text = typed.trim();
    if (!text) {
      setError("Type your area, or tap one below.");
      return;
    }
    answerWith(matchZoneByName(text, zones)?.name ?? text);
  }

  if (mode !== "type") {
    return (
      <div className="flex flex-wrap gap-3">
        <button type="button" className={primaryClass} onClick={share} disabled={mode === "locating"}>
          {mode === "locating" ? "Finding you…" : "📍 Share my location"}
        </button>
        <button
          type="button"
          className={secondaryClass}
          disabled={mode === "locating"}
          onClick={() => typeInstead("Sure! Type your area or a nearby landmark, or pick it below.")}
        >
          ✏️ Type my area instead
        </button>
      </div>
    );
  }

  const q = typed.toLowerCase().trim();
  const suggestions = q ? zones.filter((z) => z.name.toLowerCase().includes(q) || q.includes(z.name.toLowerCase())) : zones;

  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={submitTyped} className="flex gap-2">
        <input
          className={inputClass}
          autoFocus
          placeholder="e.g. Gulshan Block 13, near Hassan Square"
          value={typed}
          onChange={(e) => {
            setTyped(e.target.value);
            setError(null);
          }}
        />
        <button type="submit" className={primaryClass}>
          Next
        </button>
      </form>
      {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
      {suggestions.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">{q ? "Did you mean" : "Or pick an area"}</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((z) => (
              <button key={z.name} type="button" className={chipClass} onClick={() => answerWith(z.name)}>
                {z.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
