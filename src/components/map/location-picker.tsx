"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Search, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const LocationPickerMap = dynamic(() => import("@/components/map/location-picker-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
      地図を読み込み中…
    </div>
  ),
});

type LatLng = { lat: number; lng: number };

type NominatimResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
};

type Props = {
  value: LatLng | null;
  center: LatLng;
  onChange: (lat: number, lng: number) => void;
  className?: string;
  /** 住所検索ボックスを表示するか（既定: true） */
  searchable?: boolean;
};

/** タップ／ドラッグ／住所検索で座標を1点指定するミニ地図。value=null なら未指定。 */
export function LocationPicker({
  value,
  center,
  onChange,
  className,
  searchable = true,
}: Props) {
  // 親から渡る center と、住所検索の結果の両方で地図中心を動かす
  const [mapCenter, setMapCenter] = useState<LatLng>(center);

  useEffect(() => {
    setMapCenter(center);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center.lat, center.lng]);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch() {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setSearched(true);
    try {
      const url =
        "https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=jp&accept-language=ja&q=" +
        encodeURIComponent(q);
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      const data = (await res.json()) as NominatimResult[];
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  function pick(r: NominatimResult) {
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    setMapCenter({ lat, lng });
    onChange(lat, lng);
    setResults([]);
    setQuery(r.display_name.split(",")[0] ?? query);
  }

  return (
    <div className="flex flex-col gap-2">
      {searchable && (
        <div className="flex flex-col gap-1.5">
          <div className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  // 外側フォームの送信を防ぎ、検索だけ実行する
                  e.preventDefault();
                  handleSearch();
                }
              }}
              placeholder="住所・学校名・施設名で検索"
              className="h-9"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={searching}
              className="gap-1.5"
              onClick={handleSearch}
            >
              {searching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
              検索
            </Button>
          </div>

          {results.length > 0 && (
            <ul className="max-h-40 overflow-y-auto rounded-lg border border-border/60 bg-card text-sm">
              {results.map((r) => (
                <li key={r.place_id}>
                  <button
                    type="button"
                    onClick={() => pick(r)}
                    className="block w-full px-3 py-2 text-left hover:bg-accent"
                  >
                    {r.display_name}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {searched && !searching && results.length === 0 && (
            <p className="text-xs text-muted-foreground">
              該当なし。表記を変えて再検索するか、地図を直接タップしてください。
            </p>
          )}
        </div>
      )}

      <div className={cn("h-56 w-full overflow-hidden rounded-xl border-2 border-input", className)}>
        <LocationPickerMap
          value={value ? [value.lat, value.lng] : null}
          center={[mapCenter.lat, mapCenter.lng]}
          onChange={onChange}
        />
      </div>
    </div>
  );
}
