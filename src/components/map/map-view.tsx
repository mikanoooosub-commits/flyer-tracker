"use client";

import { useMemo, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { MapPin, Plus, X, Crosshair } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisitForm } from "@/components/visits/visit-form";
import {
  createVisitAction,
  createLocationAtAction,
  setLocationCoordsAction,
} from "@/lib/data/actions";
import { RATING_META, type Rating, type School, type VisitWithRelations } from "@/lib/types";
import type { LocationWithSchool } from "@/lib/data/queries";
import { formatDate, formatTimeRange } from "@/lib/format";

const FlyerMap = dynamic(() => import("@/components/map/flyer-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      地図を読み込み中…
    </div>
  ),
});

const DEFAULT_CENTER: [number, number] = [35.6812, 139.7671]; // 東京駅

type Props = {
  schools: School[];
  locations: LocationWithSchool[];
  ratings: Record<string, Rating | null>;
  visits: VisitWithRelations[];
};

export function MapView({ schools, locations, ratings, visits }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const placeId = searchParams.get("place");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addingVisit, setAddingVisit] = useState(false);
  const [newLoc, setNewLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [pending, startTransition] = useTransition();

  const placedLocations = useMemo(
    () => locations.filter((l) => l.lat != null && l.lng != null),
    [locations]
  );

  const center = useMemo<[number, number]>(() => {
    if (placedLocations.length === 0) return DEFAULT_CENTER;
    const lat =
      placedLocations.reduce((s, l) => s + (l.lat as number), 0) / placedLocations.length;
    const lng =
      placedLocations.reduce((s, l) => s + (l.lng as number), 0) / placedLocations.length;
    return [lat, lng];
  }, [placedLocations]);

  const selected = selectedId ? locations.find((l) => l.id === selectedId) ?? null : null;
  const selectedVisits = useMemo(
    () =>
      selectedId
        ? visits
            .filter((v) => v.location_id === selectedId)
            .sort((a, b) => (a.date < b.date ? 1 : -1))
        : [],
    [visits, selectedId]
  );

  function handleMapClick(lat: number, lng: number) {
    if (placeId) {
      startTransition(async () => {
        await setLocationCoordsAction(placeId, lat, lng);
        router.replace("/map");
        router.refresh();
      });
    } else {
      setNewLoc({ lat, lng });
    }
  }

  return (
    <div className="flex flex-col">
      {/* 凡例 */}
      <div className="flex items-center gap-3 px-4 pb-2 text-xs">
        <span className="font-bold text-muted-foreground">評価:</span>
        <LegendDot rating="good" />
        <LegendDot rating="normal" />
        <LegendDot rating="bad" />
        <span className="flex items-center gap-1">
          <span className="inline-block size-3 rounded-full" style={{ background: "#9ca3af" }} />
          履歴なし
        </span>
      </div>

      {/* 配置モードのバナー */}
      {placeId && (
        <div className="mx-4 mb-2 flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-3 py-2 text-sm">
          <Crosshair className="size-4 shrink-0 text-primary" />
          <span className="flex-1">地図をタップして、この配布場所の位置を指定してください</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.replace("/map")}
            disabled={pending}
          >
            <X className="size-4" />
          </Button>
        </div>
      )}

      {/* 地図本体 */}
      <div className="h-[calc(100dvh-11rem)] w-full overflow-hidden">
        <FlyerMap
          placedLocations={placedLocations}
          ratings={ratings}
          center={center}
          onMapClick={handleMapClick}
          onPinClick={(id) => {
            setSelectedId(id);
            setAddingVisit(false);
          }}
        />
      </div>

      {placedLocations.length === 0 && !placeId && (
        <p className="px-4 pt-3 text-center text-xs text-muted-foreground">
          地図をタップして最初の配布場所を登録できます。
        </p>
      )}

      {/* ピンの詳細パネル */}
      <Dialog open={selected !== null} onOpenChange={(o) => !o && setSelectedId(null)}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-1.5">
                  <MapPin className="size-4 text-primary" />
                  {selected.school?.name ?? "小学校未設定"}
                </DialogTitle>
              </DialogHeader>

              {selected.spot?.trim() && (
                <p className="text-sm text-muted-foreground">{selected.spot}</p>
              )}

              {addingVisit ? (
                <VisitForm
                  schools={schools}
                  initial={{ schoolId: selected.school_id ?? "", spot: selected.spot ?? "" }}
                  submitLabel="追加する"
                  onSubmit={createVisitAction}
                  onSuccess={() => {
                    setAddingVisit(false);
                    setSelectedId(null);
                    router.refresh();
                  }}
                  onCancel={() => setAddingVisit(false)}
                />
              ) : (
                <>
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-bold text-muted-foreground">
                      配布履歴（{selectedVisits.length}件）
                    </p>
                    {selectedVisits.length === 0 ? (
                      <p className="py-2 text-sm text-muted-foreground">まだ履歴はありません</p>
                    ) : (
                      <ul className="flex flex-col gap-2">
                        {selectedVisits.map((v) => {
                          const r = RATING_META[v.rating];
                          const tr = formatTimeRange(v.start_time, v.end_time);
                          return (
                            <li
                              key={v.id}
                              className="flex items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm"
                            >
                              <div>
                                <p className="font-medium">{formatDate(v.date)}</p>
                                <p className="text-xs text-muted-foreground">
                                  {tr && `${tr}・`}
                                  {v.count != null ? `${v.count}枚` : "枚数未記入"}
                                </p>
                              </div>
                              <Badge className={r.badgeClass}>{r.label}</Badge>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                  <Button className="gap-2" onClick={() => setAddingVisit(true)}>
                    <Plus className="size-4" />
                    この場所に配布実績を追加
                  </Button>
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* 新規配布場所の登録ダイアログ */}
      <NewLocationDialog
        schools={schools}
        coords={newLoc}
        onClose={() => setNewLoc(null)}
        onCreated={() => {
          setNewLoc(null);
          router.refresh();
        }}
      />
    </div>
  );
}

function LegendDot({ rating }: { rating: Rating }) {
  const meta = RATING_META[rating];
  return (
    <span className="flex items-center gap-1">
      <span className="inline-block size-3 rounded-full" style={{ background: meta.colorVar }} />
      {meta.label}
    </span>
  );
}

function NewLocationDialog({
  schools,
  coords,
  onClose,
  onCreated,
}: {
  schools: School[];
  coords: { lat: number; lng: number } | null;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [schoolId, setSchoolId] = useState("");
  const [spot, setSpot] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function handleCreate() {
    setError("");
    if (!coords) return;
    if (!schoolId) {
      setError("小学校を選択してください");
      return;
    }
    startTransition(async () => {
      const result = await createLocationAtAction(schoolId, spot, coords.lat, coords.lng);
      if (result.ok) {
        setSchoolId("");
        setSpot("");
        onCreated();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <Dialog open={coords !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>この地点に配布場所を登録</DialogTitle>
        </DialogHeader>
        {coords && (
          <p className="text-xs text-muted-foreground">
            緯度 {coords.lat.toFixed(5)} / 経度 {coords.lng.toFixed(5)}
          </p>
        )}
        <div className="flex flex-col gap-2">
          <Label htmlFor="nl-school">対象小学校</Label>
          <Select value={schoolId} onValueChange={setSchoolId}>
            <SelectTrigger id="nl-school">
              <SelectValue placeholder="小学校を選択" />
            </SelectTrigger>
            <SelectContent>
              {schools.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  「小学校」タブで先に登録してください
                </div>
              ) : (
                schools.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="nl-spot">立ち位置</Label>
          <Input
            id="nl-spot"
            placeholder="例: 正門西側"
            value={spot}
            onChange={(e) => setSpot(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button onClick={handleCreate} disabled={pending}>
          {pending ? "登録中…" : "配布場所を登録"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
