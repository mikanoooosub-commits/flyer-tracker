"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { updateCooldownDaysAction } from "@/lib/data/actions";

/**
 * 小学校マスタの先頭に出す「クールダウン: N日」と「変更」ダイアログ（WO-004 S-1・S-2）。
 * 入力の検証はサーバー（updateCooldownDaysAction）だけで行う。画面側では事前の検証をしない（S-5）。
 */
export function CooldownSetting({ days }: { days: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  // 開くたびに、入力欄を今表示している日数に戻し、前回のエラー文を消す（S-2）
  function handleOpen() {
    setValue(String(days));
    setError("");
    setOpen(true);
  }

  function handleSave() {
    setError("");
    // 初期値と同じ値でも送る（後勝ちと矛盾させないため。E-3）
    startTransition(async () => {
      const result = await updateCooldownDaysAction(value);
      if (result.ok) {
        // 再表示が終わるまで pending のままにする（その間「変更」を押せなくし、古い日数で開き直すのを防ぐ。S-2）。
        // await の後の更新は元の transition に含まれないため、もう一度 startTransition で包む
        startTransition(() => {
          setOpen(false);
          router.refresh();
        });
      } else {
        // 閉じずにダイアログの中にエラー文を出し、入力した値は残す（S-10）
        setError(result.error);
      }
    });
  }

  return (
    <>
      <div className="flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-card px-4 py-2 shadow-sm">
        <span className="font-bold">クールダウン: {days}日</span>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={handleOpen}
          disabled={pending}
        >
          <Pencil className="size-4" />
          変更
        </Button>
      </div>

      <Dialog open={open} onOpenChange={(o) => !o && !pending && setOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>クールダウンの日数を変更</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="cooldown-days">日数（1〜365）</Label>
            {/* type="number" は全角数字などを空にしてしまうブラウザがあるため text ＋ numeric にする（S-9） */}
            <Input
              id="cooldown-days"
              type="text"
              inputMode="numeric"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              キャンセル
            </Button>
            <Button className="flex-1" onClick={handleSave} disabled={pending}>
              {pending ? "保存中…" : "保存する"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
