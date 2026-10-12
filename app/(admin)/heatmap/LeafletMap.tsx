"use client";

// Leaflet must never render on the server (it touches `window`), so this
// component is only ever loaded via next/dynamic with ssr:false from page.tsx.

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";

export interface DensityZone {
  zone: string;
  latitude: number;
  longitude: number;
  tutorCount: number;
}

function radiusFor(count: number, max: number): number {
  if (max === 0) return 8;
  return 8 + (count / max) * 32; // 8-40px
}

function colorFor(count: number, max: number): string {
  if (count === 0) return "#d1d5db"; // gray-300, zero-supply zones still visible
  const intensity = max === 0 ? 0 : count / max;
  // Interpolate a light-to-dark blue scale (brand-neutral, colorblind-safe enough
  // for a single-hue sequential scale).
  const l = 70 - intensity * 45; // 70% -> 25% lightness
  return `hsl(213, 70%, ${l}%)`;
}

export default function LeafletMap({ zones }: { zones: DensityZone[] }) {
  const max = Math.max(1, ...zones.map((z) => z.tutorCount));
  const center: [number, number] =
    zones.length > 0
      ? [zones.reduce((s, z) => s + z.latitude, 0) / zones.length, zones.reduce((s, z) => s + z.longitude, 0) / zones.length]
      : [24.86, 67.05];

  return (
    <MapContainer center={center} zoom={11} style={{ height: "500px", width: "100%", borderRadius: "0.5rem" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {zones.map((z) => (
        <CircleMarker
          key={z.zone}
          center={[z.latitude, z.longitude]}
          radius={radiusFor(z.tutorCount, max)}
          pathOptions={{ color: colorFor(z.tutorCount, max), fillColor: colorFor(z.tutorCount, max), fillOpacity: 0.6 }}
        >
          <Tooltip>
            {z.zone}: {z.tutorCount} tutor{z.tutorCount === 1 ? "" : "s"}
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
