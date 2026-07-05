"use client";

import { useMemo, useState, useTransition } from "react";

import { LocationPicker } from "@/components/map/location-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RATING_ORDER,
  RATING_META,
  type Rating,
  type School,
  type VisitInput,
  type ActionResult,
} from "@/lib/types";
import { todayISO } from "@/lib/format";

const DEFAULT_CENTER = { lat: 35.6812, lng: 139.7671 }; // 東京駅

type Props = {
  schools: School[];
  initial?: Partial<VisitInput>;
  submitLabel: string;
  onSubmit: (input: VisitInput) => Promise<ActionResult>;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function VisitForm({
  schools,
  initial,
  submitLabel,
  onSubmit,
  onSuccess,
  onCancel,
}: Props) {
  const [schoolId, setSchoolId] = useState(initial?.schoolId ?? "");
  const [spot, setSpot] = useState(initial?.spot ?? "");
  const [date, setDate] = useState(initial?.date ?? todayISO());
  const [startTime, setStartTime] = useState(initial?.startTime ?? "");
  const [endTime, setEndTime] = useState(initial?.endTime ?? "");
  const [count, setCount] = useState(
    initial?.count != null ? String(initial.count) : ""
  );
  const [rating, setRating] = useState<Rating>(initial?.rating ?? "normal");
  const [memo, setMemo] = useState(initial?.memo ?? "");
  const [latLng, setLatLng] = useState<{ lat: number; lng: number } | null>(
    initial?.lat != null && initial?.lng != null
      ? { lat: initial.lat, lng: initial.lng }
      : null
  );
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  // 選択中の小学校に座標があれば、その位置を地図の中心にする
  const mapCenter = useMemo(() => {
    const s = schools.find((x) => x.id === schoolId);
    if (s?.lat != null && s?.lng != null) return { lat: s.lat, lng: s.lng };
    if (initial?.lat != null && initial?.lng != null) {
      return { lat: initial.lat, lng: initial.lng };
    }
    return DEFAULT_CENTER;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId, schools]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!schoolId) {
      setError("小学校を選択してください");
      return;
    }
    if (!date) {
      setError("配布日を入力してください");
      return;
    }

    const input: VisitInput = {
      schoolId,
      spot,
      date,
      startTime: startTime || null,
      endTime: endTime || null,
      count: count.trim() === "" ? null : Number(count),
      rating,
      memo: memo.trim() || null,
      lat: latLng?.lat ?? null,
      lng: latLng?.lng ?? null,
    };

    startTransition(async () => {
      const result = await onSubmit(input);
      if (result.ok) {
        onSuccess?.();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="vf-school">対象小学校</Label>
        <Select value={schoolId} onValueChange={setSchoolId}>
          <SelectTrigger id="vf-school">
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
        <Label htmlFor="vf-spot">立ち位置</Label>
        <Input
          id="vf-spot"
          placeholder="例: 正門西側、丁字路右側"
          value={spot}
          onChange={(e) => setSpot(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>地図上の位置</Label>
        <LocationPicker
          value={latLng}
          center={mapCenter}
          onChange={(lat, lng) => setLatLng({ lat, lng })}
        />
        <p className="text-xs text-muted-foreground">
          {latLng
            ? `緯度 ${latLng.lat.toFixed(5)} / 経度 ${latLng.lng.toFixed(5)}（タップまたはピンをドラッグで調整）`
            : "地図をタップして配布場所の位置を指定（小学校を選ぶとその付近が表示されます）"}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="vf-date">配布日</Label>
        <Input
          id="vf-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="vf-start">開始時刻</Label>
          <Input
            id="vf-start"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="vf-end">終了時刻</Label>
          <Input
            id="vf-end"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="vf-count">配布枚数</Label>
          <Input
            id="vf-count"
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="枚数"
            value={count}
            onChange={(e) => setCount(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="vf-rating">評価</Label>
          <Select value={rating} onValueChange={(v) => setRating(v as Rating)}>
            <SelectTrigger id="vf-rating">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RATING_ORDER.map((r) => (
                <SelectItem key={r} value={r}>
                  {RATING_META[r].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="vf-memo">メモ・所感</Label>
        <Textarea
          id="vf-memo"
          placeholder="気づいたことなど"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            キャンセル
          </Button>
        )}
        <Button type="submit" disabled={pending} className="flex-1">
          {pending ? "保存中…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
