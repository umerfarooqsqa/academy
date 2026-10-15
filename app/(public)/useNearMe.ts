"use client";

// Shared "what's near me" location for the homepage's "Check my area"
// (NearYouSection.tsx) and /opportunities' "Show tuitions near me"
// (2026-10-15 fix — operator reported the button "not working"). Browser
// geolocation is opt-in and can quietly stall: on a computer the permission
// pop-up is easy to miss, and an unanswered pop-up never calls back. So:
//   - a hint while waiting, and our own 20 s watchdog so it never hangs
//   - plain-language errors (blocked / location off / too slow)
//   - pickArea(): choose an area instead, using its zone centroid — works
//     with no location sharing at all
// The position is only ever used in the browser.

import { useRef, useState } from "react";

export interface NearMeArea {
  name: string;
  latitude: number;
  longitude: number;
}

export interface NearMeLocation {
  lat: number;
  lon: number;
  /** Set when the person picked an area rather than sharing their location. */
  pickedArea?: string;
}

const WATCHDOG_MS = 20_000;

export function useNearMe() {
  const [location, setLocation] = useState<NearMeLocation | null>(null);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const attempt = useRef(0);

  function locate() {
    if (!("geolocation" in navigator)) {
      setError("This browser can't share location — pick your area instead.");
      return;
    }
    const id = ++attempt.current;
    setAsking(true);
    setError(null);
    const finish = () => {
      if (attempt.current !== id) return false; // superseded or already handled
      attempt.current++;
      setAsking(false);
      return true;
    };
    const watchdog = setTimeout(() => {
      if (finish()) {
        setError("Still waiting for your location — check for a permission pop-up near the address bar, or pick your area instead.");
      }
    }, WATCHDOG_MS);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(watchdog);
        if (finish()) setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      (err) => {
        clearTimeout(watchdog);
        if (!finish()) return;
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Location is blocked for this site. To allow it, tap the 🔒 icon next to the address bar → Location → Allow. Or just pick your area."
            : err.code === err.POSITION_UNAVAILABLE
              ? "Your device couldn't find your location — make sure Location is turned on in your device settings, or pick your area."
              : "Finding your location took too long — try again, or pick your area.",
        );
      },
      { enableHighAccuracy: false, timeout: 15_000, maximumAge: 300_000 },
    );
  }

  function pickArea(area: NearMeArea) {
    attempt.current++;
    setAsking(false);
    setError(null);
    setLocation({ lat: area.latitude, lon: area.longitude, pickedArea: area.name });
  }

  function reset() {
    attempt.current++;
    setAsking(false);
    setError(null);
    setLocation(null);
  }

  return { location, asking, error, locate, pickArea, reset };
}
