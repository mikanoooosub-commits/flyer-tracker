// ── マップメモの色（WO-007 S-7） ─────────────────────────────────────────────
// 色自体に意味は持たせない（用途は見出し・メモで自由に）。
// 評価のピン（緑＝良好・赤＝非推奨）と読み違えないよう、選択肢に赤・緑は置かない。
// 描く色は globals.css のトークン（--map-note-*）から引き、ここに色の値は書かない。

export type NoteColor = "yellow" | "purple" | "orange" | "blue" | "cyan";

/** 色の選択肢（画面に出す順） */
export const NOTE_COLOR_OPTIONS: readonly { value: NoteColor; label: string }[] = [
  { value: "yellow", label: "黄" },
  { value: "purple", label: "紫" },
  { value: "orange", label: "橙" },
  { value: "blue", label: "青" },
  { value: "cyan", label: "水色" },
];

/** 値が分からないときに使う色（新しく作るときの既定も同じ） */
const FALLBACK: NoteColor = "yellow";

function isNoteColor(value: string): value is NoteColor {
  return NOTE_COLOR_OPTIONS.some((o) => o.value === value);
}

/**
 * DB に保存されているメモの色の値 → 選択肢の値。
 * 表示する色と、編集画面で選ばれた状態にする色の両方にこれを使う（表示と編集を一致させる）。
 * - 以前の選択肢の赤・緑（DB の値 "red"・"green"）は、DB を書き換えずに橙・水色として扱う。
 *   編集して保存すると orange・cyan で保存される（WO-007 E-1）。
 * - 空・想定外の値は黄として扱う（WO-007 E-2）。
 */
export function toNoteColor(stored: string | null | undefined): NoteColor {
  if (stored == null) return FALLBACK;
  if (stored === "red") return "orange";
  if (stored === "green") return "cyan";
  return isNoteColor(stored) ? stored : FALLBACK;
}

/** メモの印を描く色（CSS 変数） */
export function noteColorVar(stored: string | null | undefined): string {
  return `var(--map-note-${toNoteColor(stored)})`;
}
