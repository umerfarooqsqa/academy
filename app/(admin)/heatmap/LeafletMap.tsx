"use client";

// Leaflet must never render on the server (it touches `window`), so this
// component is only ever loaded via next/dynamic with ssr:false from HeatmapClient.tsx.
//
// Two layers on the same zone centroids (2026-10-14): tutors as filled blue
// circles, students as rose rings drawn on top, so both stay readable when a
// zone has both. Sizes scale within each layer. Optional `points` are the
// admin-only exact-location dots (small solid dots, same colours) — the page
// only passes them for admin logins.

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import type { ExactPoint } from "@/lib/analytics/exactLocations";

export interface DensityZone {
  zone: string;
  latitude: number;
  longitude: number;
  tutorCount?: number;
  studentCount?: number;
}

function radiusFor(count: number, max: number): number {
  if (max === 0) return 8;
  return 8 + (count / max) * 32; // 8-40px
}

function tutorColor(count: number, max: number): string {
  if (count === 0) return "#d1d5db"; // gray-300, zero-supply zones still visible
  const intensity = max === 0 ? 0 : count / max;
  // Light-to-dark blue (single-hue sequential scale).
  const l = 70 - intensity * 45; // 70% -> 25% lightness
  return `hsl(213, 70%, ${l}%)`;
}

const STUDENT_COLOR = "#e11d48"; // rose-600

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

export default function LeafletMap({
  zones,
  points = [],
  studentLabel = "student",
}: {
  zones: DensityZone[];
  points?: ExactPoint[];
  studentLabel?: string;
}) {
  const showTutors = zones.some((z) => z.tutorCount != null);
  const showStudents = zones.some((z) => z.studentCount != null);
  const maxTutors = Math.max(1, ...zones.map((z) => z.tutorCount ?? 0));
  const maxStudents = Math.max(1, ...zones.map((z) => z.studentCount ?? 0));
  const center: [number, number] =
    zones.length > 0
      ? [zones.reduce((s, z) => s + z.latitude, 0) / zones.length, zones.reduce((s, z) => s + z.longitude, 0) / zones.length]
      : [24.86, 67.05];

  const tooltip = (z: DensityZone) =>
    [
      z.zone,
      showTutors ? plural(z.tutorCount ?? 0, "tutor") : null,
      showStudents ? plural(z.studentCount ?? 0, studentLabel) : null,
    ]
      .filter(Boolean)
      .join(" · ");

  return (
    <MapContainer center={center} zoom={11} style={{ height: "500px", width: "100%", borderRadius: "0.5rem" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {showTutors &&
        zones.map((z) => (
          <CircleMarker
            key={`t-${z.zone}`}
            center={[z.latitude, z.longitude]}
            radius={radiusFor(z.tutorCount ?? 0, maxTutors)}
            pathOptions={{ color: tutorColor(z.tutorCount ?? 0, maxTutors), fillColor: tutorColor(z.tutorCount ?? 0, maxTutors), fillOpacity: 0.6 }}
          >
            <Tooltip>{tooltip(z)}</Tooltip>
          </CircleMarker>
        ))}
      {showStudents &&
        zones
          .filter((z) => (z.studentCount ?? 0) > 0 || !showTutors)
          .map((z) => (
            <CircleMarker
              key={`s-${z.zone}`}
              center={[z.latitude, z.longitude]}
              radius={radiusFor(z.studentCount ?? 0, maxStudents)}
              pathOptions={
                (z.studentCount ?? 0) === 0
                  ? { color: "#d1d5db", fillColor: "#d1d5db", fillOpacity: 0.4, weight: 2 }
                  : { color: STUDENT_COLOR, weight: 4, fillColor: STUDENT_COLOR, fillOpacity: showTutors ? 0.08 : 0.45, dashArray: showTutors ? "6 4" : undefined }
              }
            >
              <Tooltip>{tooltip(z)}</Tooltip>
            </CircleMarker>
          ))}
      {points.map((p, i) => (
        <CircleMarker
          key={`p-${i}`}
          center={[p.latitude, p.longitude]}
          radius={5}
          pathOptions={{ color: "#ffffff", weight: 1.5, fillColor: p.kind === "tutor" ? "#1d4ed8" : STUDENT_COLOR, fillOpacity: 1 }}
        >
          <Tooltip>{p.label}</Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
