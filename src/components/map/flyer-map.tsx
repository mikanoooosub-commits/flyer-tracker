"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Tooltip, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { RATING_META, type Rating, type MapNote } from "@/lib/types";
import { noteColorVar } from "@/lib/note-color";
import { pinSvg } from "@/components/map/pin-glyph";
import type { LocationWithSchool } from "@/lib/data/queries";
import { formatDate } from "@/lib/format";

export type PinHistoryItem = { date: string; count: number | null; rating: Rating };

function makePinIcon(rating: Rating | null) {
  // 履歴なし（rating が null）は中抜きのピン（WO-007 S-6）
  // 透明な余白（padding）で当たり判定を広げ、カーソルを合わせやすくする
  const html = `<div style="width:50px;height:52px;padding:8px;box-sizing:border-box;display:flex;justify-content:center;">
    ${pinSvg(rating ?? "none", 34, 44)}
  </div>`;
  return L.divIcon({
    html,
    className: "flyer-pin",
    iconSize: [50, 52],
    iconAnchor: [25, 52],
  });
}

function makeNoteIcon(color: string) {
  const html = `<div style="width:24px;height:24px;border-radius:var(--shape-round);background:${color};border:3px solid var(--map-mark-edge);box-shadow:var(--elevation-map-mark);"></div>`;
  return L.divIcon({
    html,
    className: "flyer-note",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

export type SchoolPin = { id: string; name: string; url: string | null; lat: number; lng: number };

// 小学校のピン（全校共通アイコンなので使い回す）
const SCHOOL_ICON = L.divIcon({
  html: `<div style="width:40px;height:44px;padding:6px;box-sizing:border-box;display:flex;justify-content:center;">
    ${pinSvg("school", 28, 36)}
  </div>`,
  className: "flyer-school",
  iconSize: [40, 44],
  iconAnchor: [20, 44],
});

/** 現在地マーカー。heading があれば向きの扇形（コーン）を表示。 */
function makeCurrentIcon(heading: number | null) {
  const fan =
    heading == null
      ? ""
      : `<path d="M32 32 L15 5 L49 5 Z" fill="var(--map-current-heading-fill)" stroke="var(--map-current-heading-line)" stroke-width="1"/>`;
  const rot = heading == null ? 0 : heading;
  const html = `<div style="width:64px;height:64px;transform:rotate(${rot}deg);transform-origin:32px 32px;">
    <svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      ${fan}
      <circle cx="32" cy="32" r="8" fill="var(--map-current)" stroke="var(--map-mark-edge)" stroke-width="3"/>
    </svg>
  </div>`;
  return L.divIcon({
    html,
    className: "flyer-current",
    iconSize: [64, 64],
    iconAnchor: [32, 32],
  });
}

/** panTarget.seq が変わったときだけ一度だけその位置へ移動する */
function PanTo({ target }: { target: { lat: number; lng: number; seq: number } | null }) {
  const map = useMap();
  const lastSeq = useRef(-1);
  useEffect(() => {
    if (target && target.seq !== lastSeq.current) {
      lastSeq.current = target.seq;
      map.setView([target.lat, target.lng]);
    }
  }, [target, map]);
  return null;
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
                    aria-hidden="true"
                  />
                  {/* 色の点だけに頼らず、評価を文字でも出す（WO-007 S-6） */}
                  <span>{RATING_META[h.rating].label}</span>
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
  schoolPins: SchoolPin[];
  center: [number, number];
  currentPosition: { lat: number; lng: number } | null;
  heading: number | null;
  panTarget: { lat: number; lng: number; seq: number } | null;
  onMapClick: (lat: number, lng: number) => void;
  onPinClick: (locationId: string) => void;
  onNoteClick: (noteId: string) => void;
};

export default function FlyerMap({
  placedLocations,
  ratings,
  history,
  notes,
  schoolPins,
  center,
  currentPosition,
  heading,
  panTarget,
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
      <PanTo target={panTarget} />
      {schoolPins.map((s) => (
        <Marker key={`school-${s.id}`} position={[s.lat, s.lng]} icon={SCHOOL_ICON} zIndexOffset={-100}>
          <Tooltip direction="top" offset={[0, -40]} className="flyer-label">
            {s.name}
          </Tooltip>
          <Popup>
            <div className="flyer-school-popup">
              <p className="font-bold">{s.name}</p>
              {s.url ? (
                <a href={s.url} target="_blank" rel="noopener noreferrer">
                  ホームページを開く ↗
                </a>
              ) : (
                <span className="flyer-school-nolink">URL未登録</span>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
      {currentPosition && (
        <Marker
          position={[currentPosition.lat, currentPosition.lng]}
          icon={makeCurrentIcon(heading)}
          interactive={false}
          zIndexOffset={1000}
        />
      )}
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
          icon={makeNoteIcon(noteColorVar(n.color))}
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
