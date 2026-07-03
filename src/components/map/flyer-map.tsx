"use client";

import { useRef } from "react";
import { MapContainer, TileLayer, Marker, Tooltip, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { RATING_META, noteColor, type Rating, type MapNote } from "@/lib/types";
import type { LocationWithSchool } from "@/lib/data/queries";
import { formatDate } from "@/lib/format";

export type PinHistoryItem = { date: string; count: number | null; rating: Rating };

const RATING_COLOR: Record<Rating | "none", string> = {
  good: "var(--rating-good)",
  normal: "var(--rating-normal)",
  bad: "var(--rating-bad)",
  none: "#9ca3af",
};

function makePinIcon(rating: Rating | null) {
  const color = RATING_COLOR[rating ?? "none"];
  // 透明な余白（padding）で当たり判定を広げ、カーソルを合わせやすくする
  const html = `<div style="width:50px;height:52px;padding:8px;box-sizing:border-box;display:flex;justify-content:center;">
    <svg width="34" height="44" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 0C6.7 0 0 6.7 0 15c0 10 15 25 15 25s15-15 15-25C30 6.7 23.3 0 15 0z" fill="${color}" stroke="white" stroke-width="2"/>
      <circle cx="15" cy="15" r="5.5" fill="white"/>
    </svg>
  </div>`;
  return L.divIcon({
    html,
    className: "flyer-pin",
    iconSize: [50, 52],
    iconAnchor: [25, 52],
  });
}

function makeNoteIcon(color: string) {
  const html = `<div style="width:24px;height:24px;border-radius:9999px;background:${color};border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.45);"></div>`;
  return L.divIcon({
    html,
    className: "flyer-note",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
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

/** ホバーで履歴を表示。ピン⇔吹き出し間を移動しても閉じないよう猶予を持たせる。 */
function HoverMarker({
  loc,
  rating,
  items,
  onPinClick,
}: {
  loc: LocationWithSchool;
  rating: Rating | null;
  items: PinHistoryItem[];
  onPinClick: (id: string) => void;
}) {
  const markerRef = useRef<L.Marker | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };
  const open = () => {
    cancelClose();
    markerRef.current?.openPopup();
  };
  const scheduleClose = () => {
    cancelClose();
    timer.current = setTimeout(() => markerRef.current?.closePopup(), 300);
  };

  const schoolName = loc.school?.name ?? "小学校未設定";
  const spot = loc.spot?.trim();

  return (
    <Marker
      ref={markerRef}
      position={[loc.lat as number, loc.lng as number]}
      icon={makePinIcon(rating)}
      riseOnHover
      eventHandlers={{
        mouseover: open,
        mouseout: scheduleClose,
        click: () => onPinClick(loc.id),
        popupopen: (e) => {
          const el = e.popup.getElement();
          if (el) {
            el.addEventListener("mouseenter", cancelClose);
            el.addEventListener("mouseleave", scheduleClose);
          }
        },
      }}
    >
      <Tooltip permanent direction="top" offset={[0, -46]} className="flyer-label">
        {schoolName}
      </Tooltip>
      <Popup autoPan={false} closeButton={false} className="flyer-history-popup">
        <div
          className="flyer-history"
          role="button"
          tabIndex={0}
          onClick={() => onPinClick(loc.id)}
        >
          <p className="flyer-history-title">
            {schoolName}
            {spot ? `／${spot}` : ""}
          </p>
          {items.length === 0 ? (
            <p className="flyer-history-empty">配布履歴なし</p>
          ) : (
            <ul className="flyer-history-list">
              {items.slice(0, 6).map((h, i) => (
                <li key={i}>
                  <span>{formatDate(h.date)}</span>
                  <span className="flyer-history-count">
                    {h.count != null ? `${h.count}枚` : "—"}
                  </span>
                  <span
                    className="flyer-history-dot"
                    style={{ background: RATING_META[h.rating].colorVar }}
                    title={RATING_META[h.rating].label}
                  />
                </li>
              ))}
            </ul>
          )}
          {items.length > 6 && <p className="flyer-history-more">ほか {items.length - 6} 件</p>}
          <p className="flyer-history-hint">▶ ここをクリックで一覧を表示</p>
        </div>
      </Popup>
    </Marker>
  );
}

type Props = {
  placedLocations: LocationWithSchool[];
  ratings: Record<string, Rating | null>;
  history: Record<string, PinHistoryItem[]>;
  notes: MapNote[];
  center: [number, number];
  onMapClick: (lat: number, lng: number) => void;
  onPinClick: (locationId: string) => void;
  onNoteClick: (noteId: string) => void;
};

export default function FlyerMap({
  placedLocations,
  ratings,
  history,
  notes,
  center,
  onMapClick,
  onPinClick,
  onNoteClick,
}: Props) {
  return (
    <MapContainer center={center} zoom={14} className="h-full w-full" scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onMapClick={onMapClick} />
      {placedLocations.map((loc) => (
        <HoverMarker
          key={loc.id}
          loc={loc}
          rating={ratings[loc.id] ?? null}
          items={history[loc.id] ?? []}
          onPinClick={onPinClick}
        />
      ))}
      {notes.map((n) => (
        <Marker
          key={n.id}
          position={[n.lat, n.lng]}
          icon={makeNoteIcon(noteColor(n.color))}
          eventHandlers={{ click: () => onNoteClick(n.id) }}
        >
          <Tooltip direction="top" offset={[0, -8]} className="flyer-note-tip">
            <div>
              {n.label && <p className="font-bold">{n.label}</p>}
              {n.memo && <p className="whitespace-pre-wrap">{n.memo}</p>}
              {!n.label && !n.memo && <p>メモ</p>}
            </div>
          </Tooltip>
        </Marker>
      ))}
    </MapContainer>
  );
}
