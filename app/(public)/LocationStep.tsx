"use client";

// The Lili chat's location question: one tap shares the browser's location
// (the same navigator.geolocation pattern as NearbyOpportunitiesWidget.tsx),
// which replaces the old paste-a-Google-Maps-link field. Opt-in only — the
// permission prompt appears only after the person taps the button.
//
// In range of a zone → answered straight away with that zone. Outside every
// zone's maxKm, permission denied, or no geolocation support → the person
// picks their area from chips instead (2026-10-14 decisions). The server
// re-checks the same rule (lib/intake/persist.ts), so this is only UX.

import { useState } from "react";
import { nearestZoneWithin, type ZonePoint } from "@/lib/geo/zoneLookup";
import type { LocationAnswer } from "./liliChatFlow";
import { LiliBubble, chipClass, sendClass } from "./ChatBubbles";

export default function LocationStep({ zones, onAnswer }: { zones: ZonePoint[]; onAnswer: (value: LocationAnswer) => void }) {
  const [mode, setMode] = useState<"ask" | "locating" | "pick">("ask");
  const [note, setNote] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  function pickInstead(message: string) {
    setNote(message);
    setMode("pick");
  }

  function share() {
    if (!("geolocation" in navigator)) {
      pickInstead("Your browser can't share location — no problem, which area are you in?");
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
        pickInstead("Looks like you're outside the areas we cover right now. Which area is closest?");
      },
      (err) =>
        pickInstead(
          err.code === err.PERMISSION_DENIED
            ? "No problem — which area are you in?"
            : "I couldn't get your location — which area are you in?",
        ),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 60_000 },
    );
  }

  if (mode === "pick") {
    return (
      <div className="flex flex-col gap-3">
        {note && <LiliBubble>{note}</LiliBubble>}
        <div className="flex flex-wrap justify-end gap-2 pl-10">
          {zones.length === 0 && <p className="text-sm text-gray-500">No areas configured yet.</p>}
          {zones.map((z) => (
            <button
              key={z.name}
              type="button"
              className={chipClass}
              onClick={() =>
                onAnswer({ latitude: coords?.latitude ?? null, longitude: coords?.longitude ?? null, area: z.name, viaGps: coords != null })
              }
            >
              {z.name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap justify-end gap-2 pl-10">
      <button type="button" className={sendClass} onClick={share} disabled={mode === "locating"}>
        {mode === "locating" ? "Finding you…" : "📍 Share my location"}
      </button>
      <button type="button" className={chipClass} onClick={() => pickInstead("Sure — which area are you in?")} disabled={mode === "locating"}>
        Pick my area instead
      </button>
    </div>
  );
}
