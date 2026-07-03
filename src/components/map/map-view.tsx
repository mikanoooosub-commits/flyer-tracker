"use client";

import { useMemo, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { X, Crosshair, MapPin, StickyNote, Trash2 } from "lucide-react";

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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LocationPicker } from "@/components/map/location-picker";
import type { PinHistoryItem } from "@/components/map/flyer-map";
import {
  createLocationAtAction,
  setLocationCoordsAction,
  createMapNoteAction,
  updateMapNoteAction,
  deleteMapNoteAction,
} from "@/lib/data/actions";
import {
  NOTE_PRESETS,
  noteColor,
  type Rating,
  type School,
  type VisitWithRelations,
  type MapNote,
} from "@/lib/types";
import type { LocationWithSchool } from "@/lib/data/queries";
import { cn } from "@/lib/utils";

const FlyerMap = dynamic(() => import("@/components/map/flyer-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      地図を読み込み中…
    </div>
  ),
});

const DEFAULT_CENTER: [number, number] = [35.6812, 139.7671]; // 東京駅

type Mode = "location" | "note";

type Props = {
  schools: School[];
  locations: LocationWithSchool[];
  ratings: Record<string, Rating | null>;
  visits: VisitWithRelations[];
  notes: MapNote[];
};

export function MapView({ schools, locations, ratings, visits, notes }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const placeId = searchParams.get("place");

  const [mode, setMode] = useState<Mode>("location");
  const [newLoc, setNewLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [placeDraft, setPlaceDraft] = useState<{ lat: number; lng: number } | null>(null);
  const [noteDraft, setNoteDraft] = useState<{ lat: number; lng: number } | null>(null);
  const [editingNote, setEditingNote] = useState<MapNote | null>(null);

  const placedLocations = useMemo(
    () => locations.filter((l) => l.lat != null && l.lng != null),
    [locations]
  );

  const history = useMemo(() => {
    const map: Record<string, PinHistoryItem[]> = {};
    for (const v of visits) {
      (map[v.location_id] ??= []).push({ date: v.date, count: v.count, rating: v.rating });
    }
    for (const id of Object.keys(map)) {
      map[id].sort((a, b) => (a.date < b.date ? 1 : -1));
    }
    return map;
  }, [visits]);

  const center = useMemo<[number, number]>(() => {
    const pts = [...placedLocations.map((l) => [l.lat as number, l.lng as number] as const)];
    if (pts.length === 0) return DEFAULT_CENTER;
    const lat = pts.reduce((s, p) => s + p[0], 0) / pts.length;
    const lng = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    return [lat, lng];
  }, [placedLocations]);

  function handleMapClick(lat: number, lng: number) {
    if (placeId) setPlaceDraft({ lat, lng });
    else if (mode === "note") setNoteDraft({ lat, lng });
    else setNewLoc({ lat, lng });
  }

  return (
    <div className="flex flex-col">
      {/* 追加モードの切り替え */}
      {!placeId && (
        <div className="flex gap-1 px-4 pb-2">
          <ModeButton active={mode === "location"} onClick={() => setMode("location")}>
            <MapPin className="size-4" />
            配布場所
          </ModeButton>
          <ModeButton active={mode === "note"} onClick={() => setMode("note")}>
            <StickyNote className="size-4" />
            メモ
          </ModeButton>
        </div>
      )}

      {/* 凡例 */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 pb-2 text-xs">
        <span className="font-bold text-muted-foreground">評価:</span>
        <LegendDot color="var(--rating-good)" label="良好" />
        <LegendDot color="var(--rating-normal)" label="普通" />
        <LegendDot color="var(--rating-bad)" label="非推奨" />
        <LegendDot color="#9ca3af" label="履歴なし" />
      </div>

      {/* 配置モードのバナー */}
      {placeId && (
        <div className="mx-4 mb-2 flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-3 py-2 text-sm">
          <Crosshair className="size-4 shrink-0 text-primary" />
          <span className="flex-1">地図をタップして、この配布場所の位置を指定してください</span>
          <Button variant="ghost" size="sm" onClick={() => router.replace("/map")}>
            <X className="size-4" />
          </Button>
        </div>
      )}

      {/* 地図本体 */}
      <div className="h-[calc(100dvh-12.5rem)] w-full overflow-hidden">
        <FlyerMap
          placedLocations={placedLocations}
          ratings={ratings}
          history={history}
          notes={notes}
          center={center}
          onMapClick={handleMapClick}
          onPinClick={(id) => router.push(`/?location=${id}`)}
          onNoteClick={(id) => {
            const n = notes.find((x) => x.id === id);
            if (n) setEditingNote(n);
          }}
        />
      </div>

      <p className="px-4 pt-2 text-center text-xs text-muted-foreground">
        {placeId
          ? "地図をタップして位置を指定してください。"
          : mode === "note"
            ? "「メモ」モード: 地図をタップで色付きメモを追加。ピンにカーソルでメモ表示。"
            : "「配布場所」モード: 地図をタップで配布場所を登録。ピンのクリックで一覧、カーソルで履歴。"}
      </p>

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

      {/* 配置モード: 位置を調整して決定 */}
      <PlaceConfirmDialog
        coords={placeDraft}
        onClose={() => setPlaceDraft(null)}
        onConfirm={(lat, lng) => {
          if (!placeId) return;
          setPlaceDraft(null);
          setLocationCoordsAction(placeId, lat, lng).then(() => {
            router.replace("/map");
            router.refresh();
          });
        }}
      />

      {/* マップメモ 新規 */}
      <NoteCreateDialog
        coords={noteDraft}
        onClose={() => setNoteDraft(null)}
        onCreated={() => {
          setNoteDraft(null);
          router.refresh();
        }}
      />

      {/* マップメモ 編集・削除 */}
      <NoteEditDialog
        note={editingNote}
        onClose={() => setEditingNote(null)}
        onDone={() => {
          setEditingNote(null);
          router.refresh();
        }}
      />
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 rounded-lg border-2 py-1.5 text-sm font-bold transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-card text-muted-foreground"
      )}
    >
      {children}
    </button>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className="inline-block size-3 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function PlaceConfirmDialog({
  coords,
  onClose,
  onConfirm,
}: {
  coords: { lat: number; lng: number } | null;
  onClose: () => void;
  onConfirm: (lat: number, lng: number) => void;
}) {
  return (
    <Dialog open={coords !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>この位置で決定しますか？</DialogTitle>
        </DialogHeader>
        {coords && <PlaceConfirmBody initial={coords} onConfirm={onConfirm} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function PlaceConfirmBody({
  initial,
  onConfirm,
  onClose,
}: {
  initial: { lat: number; lng: number };
  onConfirm: (lat: number, lng: number) => void;
  onClose: () => void;
}) {
  const [pos, setPos] = useState(initial);
  return (
    <>
      <LocationPicker value={pos} center={initial} onChange={(lat, lng) => setPos({ lat, lng })} />
      <p className="text-xs text-muted-foreground">
        緯度 {pos.lat.toFixed(5)} / 経度 {pos.lng.toFixed(5)}（タップまたはドラッグで微調整）
      </p>
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onClose}>
          キャンセル
        </Button>
        <Button className="flex-1" onClick={() => onConfirm(pos.lat, pos.lng)}>
          この位置で決定
        </Button>
      </div>
    </>
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
  return (
    <Dialog open={coords !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>この地点に配布場所を登録</DialogTitle>
        </DialogHeader>
        {coords && <NewLocationBody schools={schools} initial={coords} onCreated={onCreated} />}
      </DialogContent>
    </Dialog>
  );
}

function NewLocationBody({
  schools,
  initial,
  onCreated,
}: {
  schools: School[];
  initial: { lat: number; lng: number };
  onCreated: () => void;
}) {
  const [schoolId, setSchoolId] = useState("");
  const [spot, setSpot] = useState("");
  const [pos, setPos] = useState(initial);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function handleCreate() {
    setError("");
    if (!schoolId) {
      setError("小学校を選択してください");
      return;
    }
    startTransition(async () => {
      const result = await createLocationAtAction(schoolId, spot, pos.lat, pos.lng);
      if (result.ok) onCreated();
      else setError(result.error);
    });
  }

  return (
    <>
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
      <div className="flex flex-col gap-2">
        <Label>位置（検索／タップ／ドラッグで調整）</Label>
        <LocationPicker value={pos} center={initial} onChange={(lat, lng) => setPos({ lat, lng })} />
        <p className="text-xs text-muted-foreground">
          緯度 {pos.lat.toFixed(5)} / 経度 {pos.lng.toFixed(5)}
        </p>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button onClick={handleCreate} disabled={pending}>
        {pending ? "登録中…" : "この位置で配布場所を登録"}
      </Button>
    </>
  );
}

// ── マップメモ ───────────────────────────────────────────────────────────────

function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string, presetLabel: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {NOTE_PRESETS.map((p) => (
        <button
          key={p.value}
          type="button"
          onClick={() => onChange(p.value, p.label)}
          className={cn(
            "flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-xs font-bold transition-colors",
            value === p.value ? "border-foreground" : "border-transparent bg-muted"
          )}
        >
          <span className="inline-block size-3 rounded-full" style={{ background: p.color }} />
          {p.label}
        </button>
      ))}
    </div>
  );
}

function NoteCreateDialog({
  coords,
  onClose,
  onCreated,
}: {
  coords: { lat: number; lng: number } | null;
  onClose: () => void;
  onCreated: () => void;
}) {
  return (
    <Dialog open={coords !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>マップメモを追加</DialogTitle>
        </DialogHeader>
        {coords && <NoteCreateBody initial={coords} onCreated={onCreated} />}
      </DialogContent>
    </Dialog>
  );
}

function NoteCreateBody({
  initial,
  onCreated,
}: {
  initial: { lat: number; lng: number };
  onCreated: () => void;
}) {
  const [color, setColor] = useState(NOTE_PRESETS[0].value);
  const [label, setLabel] = useState(NOTE_PRESETS[0].label);
  const [memo, setMemo] = useState("");
  const [pos, setPos] = useState(initial);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function handleCreate() {
    setError("");
    startTransition(async () => {
      const result = await createMapNoteAction(pos.lat, pos.lng, color, label, memo);
      if (result.ok) onCreated();
      else setError(result.error);
    });
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <Label>色・種類</Label>
        <ColorPicker
          value={color}
          onChange={(c, presetLabel) => {
            setColor(c);
            if (!label.trim()) setLabel(presetLabel);
          }}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="note-label">見出し</Label>
        <Input
          id="note-label"
          placeholder="例: 交通誘導員"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="note-memo">メモ</Label>
        <Textarea
          id="note-memo"
          placeholder="詳細メモ（任意）"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label>位置（検索／タップ／ドラッグで調整）</Label>
        <LocationPicker value={pos} center={initial} onChange={(lat, lng) => setPos({ lat, lng })} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button onClick={handleCreate} disabled={pending}>
        {pending ? "登録中…" : "メモを追加"}
      </Button>
    </>
  );
}

function NoteEditDialog({
  note,
  onClose,
  onDone,
}: {
  note: MapNote | null;
  onClose: () => void;
  onDone: () => void;
}) {
  return (
    <Dialog open={note !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-1.5">
            <span
              className="inline-block size-3.5 rounded-full"
              style={{ background: note ? noteColor(note.color) : undefined }}
            />
            マップメモ
          </DialogTitle>
        </DialogHeader>
        {note && <NoteEditBody note={note} onDone={onDone} />}
      </DialogContent>
    </Dialog>
  );
}

function NoteEditBody({ note, onDone }: { note: MapNote; onDone: () => void }) {
  const [color, setColor] = useState(note.color);
  const [label, setLabel] = useState(note.label ?? "");
  const [memo, setMemo] = useState(note.memo ?? "");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSave() {
    setError("");
    startTransition(async () => {
      const result = await updateMapNoteAction(note.id, color, label, memo);
      if (result.ok) onDone();
      else setError(result.error);
    });
  }

  function handleDelete() {
    setError("");
    startTransition(async () => {
      const result = await deleteMapNoteAction(note.id);
      if (result.ok) onDone();
      else setError(result.error);
    });
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <Label>色・種類</Label>
        <ColorPicker value={color} onChange={(c) => setColor(c)} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="note-edit-label">見出し</Label>
        <Input
          id="note-edit-label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="note-edit-memo">メモ</Label>
        <Textarea id="note-edit-memo" value={memo} onChange={(e) => setMemo(e.target.value)} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="gap-1.5 text-destructive"
          onClick={handleDelete}
          disabled={pending}
        >
          <Trash2 className="size-4" />
          削除
        </Button>
        <Button className="flex-1" onClick={handleSave} disabled={pending}>
          {pending ? "保存中…" : "保存する"}
        </Button>
      </div>
    </>
  );
}
