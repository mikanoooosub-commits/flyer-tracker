"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, School as SchoolIcon, MapPin, MapPinOff, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LocationPicker } from "@/components/map/location-picker";
import {
  addSchoolAction,
  deleteSchoolAction,
  updateSchoolCoordsAction,
} from "@/lib/data/actions";
import type { School } from "@/lib/types";

const DEFAULT_CENTER = { lat: 35.6812, lng: 139.7671 }; // 東京駅

export function SchoolManager({ schools }: { schools: School[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [coordsTarget, setCoordsTarget] = useState<School | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<School | null>(null);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) return;
    startTransition(async () => {
      const result = await addSchoolAction(name, pos?.lat ?? null, pos?.lng ?? null);
      if (result.ok) {
        setName("");
        setPos(null);
        setShowPicker(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  function handleDelete(id: string) {
    setError("");
    startTransition(async () => {
      const result = await deleteSchoolAction(id);
      if (result.ok) {
        setDeleteTarget(null);
        router.refresh();
      } else {
        setDeleteTarget(null);
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-3">
          <form onSubmit={handleAdd} className="flex flex-col gap-3">
            <div className="flex items-end gap-2">
              <div className="flex flex-1 flex-col gap-1.5">
                <label htmlFor="school-name" className="text-sm font-bold">
                  小学校を追加
                </label>
                <Input
                  id="school-name"
                  placeholder="例: 板橋第一小"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <Button type="submit" size="icon" disabled={pending} aria-label="追加">
                <Plus className="size-5" />
              </Button>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowPicker((v) => !v);
                if (!pos) setPos(DEFAULT_CENTER);
              }}
              className="flex items-center gap-1 self-start text-xs font-bold text-primary"
            >
              <ChevronDown className={`size-3.5 transition-transform ${showPicker ? "rotate-180" : ""}`} />
              地図で位置を指定（任意）
            </button>

            {showPicker && (
              <div className="flex flex-col gap-2">
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
            )}
          </form>
        </CardContent>
      </Card>

      {error && <p className="px-1 text-sm text-destructive">{error}</p>}

      {schools.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            まだ小学校が登録されていません。上のフォームから追加してください。
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-2">
          {schools.map((s) => {
            const hasCoords = s.lat != null && s.lng != null;
            return (
              <li
                key={s.id}
                className="flex items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-3 shadow-sm"
              >
                <SchoolIcon className="size-4 shrink-0 text-primary" />
                <span className="flex-1 font-medium">{s.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`gap-1.5 ${hasCoords ? "text-primary" : "text-muted-foreground"}`}
                  onClick={() => setCoordsTarget(s)}
                >
                  {hasCoords ? <MapPin className="size-4" /> : <MapPinOff className="size-4" />}
                  {hasCoords ? "位置" : "位置未設定"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-destructive"
                  disabled={pending}
                  onClick={() => setDeleteTarget(s)}
                >
                  <Trash2 className="size-4" />
                  削除
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <p className="px-1 text-xs text-muted-foreground">
        ※ 座標を設定しておくと、配布実績の登録時にその小学校付近の地図が開きます。
        <br />
        ※ 配布場所が紐づいている小学校は削除できません。
      </p>

      <SchoolCoordsDialog
        school={coordsTarget}
        onClose={() => setCoordsTarget(null)}
        onSaved={() => {
          setCoordsTarget(null);
          router.refresh();
        }}
      />

      <Dialog open={deleteTarget !== null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>小学校を削除しますか？</DialogTitle>
          </DialogHeader>
          <p className="text-sm">
            「<span className="font-bold">{deleteTarget?.name}</span>」を削除します。この操作は取り消せません。
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setDeleteTarget(null)}
              disabled={pending}
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => deleteTarget && handleDelete(deleteTarget.id)}
              disabled={pending}
            >
              {pending ? "削除中…" : "削除する"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SchoolCoordsDialog({
  school,
  onClose,
  onSaved,
}: {
  school: School | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  return (
    <Dialog open={school !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{school?.name} の位置を設定</DialogTitle>
        </DialogHeader>
        {school && <SchoolCoordsBody school={school} onSaved={onSaved} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function SchoolCoordsBody({
  school,
  onSaved,
  onClose,
}: {
  school: School;
  onSaved: () => void;
  onClose: () => void;
}) {
  const initial =
    school.lat != null && school.lng != null
      ? { lat: school.lat, lng: school.lng }
      : DEFAULT_CENTER;
  const [pos, setPos] = useState(initial);
  const [pending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      await updateSchoolCoordsAction(school.id, pos.lat, pos.lng);
      onSaved();
    });
  }

  return (
    <>
      <LocationPicker value={pos} center={initial} onChange={(lat, lng) => setPos({ lat, lng })} />
      <p className="text-xs text-muted-foreground">
        緯度 {pos.lat.toFixed(5)} / 経度 {pos.lng.toFixed(5)}（タップまたはドラッグで指定）
      </p>
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onClose} disabled={pending}>
          キャンセル
        </Button>
        <Button className="flex-1" onClick={handleSave} disabled={pending}>
          {pending ? "保存中…" : "この位置で保存"}
        </Button>
      </div>
    </>
  );
}
