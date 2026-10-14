"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LocationPicker } from "@/components/map/location-picker";
import type { ActionResult } from "@/lib/types";
import { NOTE_COLOR_OPTIONS, noteColorVar, toNoteColor, type NoteColor } from "@/lib/note-color";
import { cn } from "@/lib/utils";

const DEFAULT_CENTER = { lat: 35.6812, lng: 139.7671 }; // 東京駅

export type NoteFormValue = {
  color: string;
  label: string;
  memo: string;
  lat: number;
  lng: number;
};

type Props = {
  initial?: Partial<NoteFormValue>;
  submitLabel: string;
  onSubmit: (value: NoteFormValue) => Promise<ActionResult>;
  onSuccess?: () => void;
  onCancel?: () => void;
  onDelete?: () => Promise<ActionResult>;
};

function ColorPicker({
  value,
  onChange,
}: {
  value: NoteColor;
  onChange: (color: NoteColor) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {NOTE_COLOR_OPTIONS.map((p) => (
        <button
          key={p.value}
          type="button"
          onClick={() => onChange(p.value)}
          className={cn(
            "flex items-center gap-1.5 min-h-11 rounded-control border-2 px-3 py-1 text-xs font-bold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            value === p.value ? "border-foreground" : "border-transparent bg-muted"
          )}
        >
          <span className="inline-block size-3 rounded-full" style={{ background: noteColorVar(p.value) }} />
          {p.label}
        </button>
      ))}
    </div>
  );
}

export function NoteForm({ initial, submitLabel, onSubmit, onSuccess, onCancel, onDelete }: Props) {
  // 以前の赤・緑（red・green）は橙・水色、空・想定外の値は黄が選ばれた状態で開く（WO-007 E-1・E-2）。
  // 色に触らずに保存しても、選ばれている色の値で保存される。
  const [color, setColor] = useState<NoteColor>(toNoteColor(initial?.color));
  const [label, setLabel] = useState(initial?.label ?? "");
  const [memo, setMemo] = useState(initial?.memo ?? "");
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(
    initial?.lat != null && initial?.lng != null ? { lat: initial.lat, lng: initial.lng } : null
  );
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    setError("");
    if (!pos) {
      setError("「現在地」か地図タップ・住所検索で位置を指定してください");
      return;
    }
    startTransition(async () => {
      const result = await onSubmit({ color, label, memo, lat: pos.lat, lng: pos.lng });
      if (result.ok) onSuccess?.();
      else setError(result.error);
    });
  }

  function handleDelete() {
    if (!onDelete) return;
    setError("");
    startTransition(async () => {
      const result = await onDelete();
      if (result.ok) onSuccess?.();
      else setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label>色</Label>
        <ColorPicker value={color} onChange={setColor} />
        <p className="text-xs text-muted-foreground">
          色の使い分けは自由です（チーム内のルールでどうぞ）
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="note-label">見出し</Label>
        <Input
          id="note-label"
          placeholder="任意の見出し"
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
        <Label>位置（現在地・検索・タップ・ドラッグで指定）</Label>
        <LocationPicker
          value={pos}
          center={pos ?? DEFAULT_CENTER}
          onChange={(lat, lng) => setPos({ lat, lng })}
        />
        {pos && (
          <p className="text-xs text-muted-foreground">
            緯度 {pos.lat.toFixed(5)} / 経度 {pos.lng.toFixed(5)}
          </p>
        )}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex gap-2">
        {onDelete && (
          <Button
            type="button"
            variant="outline"
            className="gap-1.5 text-danger"
            onClick={handleDelete}
            disabled={pending}
          >
            <Trash2 className="size-4" />
            削除
          </Button>
        )}
        {onCancel && (
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={pending}>
            キャンセル
          </Button>
        )}
        <Button type="button" className="flex-1" onClick={handleSubmit} disabled={pending}>
          {pending ? "保存中…" : submitLabel}
        </Button>
      </div>
    </div>
  );
}
