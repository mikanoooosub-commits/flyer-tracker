"use client";

import { FlaskConical } from "lucide-react";

import { disableDemoMode } from "@/lib/demo";

/**
 * デモ表示中であることを常時知らせるバナー。
 * 「デモを見ているのか本番を見ているのか分からない」状態が一番危ないので、
 * デモ中は必ず画面上に出し、その場で解除できるようにしている。
 */
export function DemoBanner() {
  function handleExit() {
    disableDemoMode();
    // cookie の変更をサーバー側の参照スキーマに反映するため、リロードして本番表示に戻す
    window.location.href = "/";
  }

  return (
    <div className="flex items-center justify-between gap-3 bg-amber-500 px-4 py-2 text-white">
      <span className="flex items-center gap-2 text-sm font-bold">
        <FlaskConical className="size-4 shrink-0" />
        デモデータを表示中
      </span>
      <button
        type="button"
        onClick={handleExit}
        className="shrink-0 rounded-md bg-white/20 px-3 py-1 text-xs font-bold hover:bg-white/30"
      >
        本番に戻る
      </button>
    </div>
  );
}
