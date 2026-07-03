"use client";

import { MapContainer, TileLayer, Marker, Tooltip, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import type { Rating } from "@/lib/types";
import type { LocationWithSchool } from "@/lib/data/queries";

const RATING_COLOR: Record<Rating | "none", string> = {
  good: "var(--rating-good)",
  normal: "var(--rating-normal)",
  bad: "var(--rating-bad)",
  none: "#9ca3af",
};

function makePinIcon(rating: Rating | null) {
  const color = RATING_COLOR[rating ?? "none"];
  const html = `<svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 0C6.7 0 0 6.7 0 15c0 10 15 25 15 25s15-15 15-25C30 6.7 23.3 0 15 0z" fill="${color}" stroke="white" stroke-width="2"/>
    <circle cx="15" cy="15" r="5.5" fill="white"/>
  </svg>`;
  return L.divIcon({
    html,
    className: "flyer-pin",
    iconSize: [30, 40],
    iconAnchor: [15, 40],
  });
}

function ClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

type Props = {
  placedLocations: LocationWithSchool[];
  ratings: Record<string, Rating | null>;
  center: [number, number];
  onMapClick: (lat: number, lng: number) => void;
  onPinClick: (locationId: string) => void;
};

export default function FlyerMap({
  placedLocations,
  ratings,
  center,
  onMapClick,
  onPinClick,
}: Props) {
  return (
    <MapContainer center={center} zoom={14} className="h-full w-full" scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onMapClick={onMapClick} />
      {placedLocations.map((loc) => (
        <Marker
          key={loc.id}
          position={[loc.lat as number, loc.lng as number]}
          icon={makePinIcon(ratings[loc.id] ?? null)}
          eventHandlers={{ click: () => onPinClick(loc.id) }}
        >
          <Tooltip permanent direction="top" offset={[0, -38]} className="flyer-label">
            {loc.school?.name ?? "小学校未設定"}
          </Tooltip>
        </Marker>
      ))}
    </MapContainer>
  );
}
