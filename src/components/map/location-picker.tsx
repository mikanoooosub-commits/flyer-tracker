"use client";

import dynamic from "next/dynamic";

import { cn } from "@/lib/utils";

const LocationPickerMap = dynamic(() => import("@/components/map/location-picker-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
      地図を読み込み中…
    </div>
  ),
});

type Props = {
  value: { lat: number; lng: number } | null;
  center: { lat: number; lng: number };
  onChange: (lat: number, lng: number) => void;
  className?: string;
};

/** タップ／ドラッグで座標を1点指定するミニ地図。value=null なら未指定。 */
export function LocationPicker({ value, center, onChange, className }: Props) {
  return (
    <div className={cn("h-56 w-full overflow-hidden rounded-xl border-2 border-input", className)}>
      <LocationPickerMap
        value={value ? [value.lat, value.lng] : null}
        center={[center.lat, center.lng]}
        onChange={onChange}
      />
    </div>
  );
}
