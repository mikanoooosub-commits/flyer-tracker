import type { Rating } from "@/lib/types";

// 地図のピンの形と色（WO-007 S-6・E-7）。地図のピンと凡例で同じ形・同じ色を使うため、ここ1か所にまとめる。
// 色は globals.css のトークン（CSS 変数）だけを使う。

/** ピンの形（viewBox は 0 0 30 40） */
export const PIN_PATH = "M15 0C6.7 0 0 6.7 0 15c0 10 15 25 15 25s15-15 15-25C30 6.7 23.3 0 15 0z";

/** 評価のピン・履歴なしのピン（中抜き）・小学校のピン・位置を指定中のピン */
export type PinKind = Rating | "none" | "school" | "picked";

type PinStyle = {
  fill: string;
  edge: string;
  /** 縁の太さ（viewBox の単位） */
  edgeWidth: number;
  /** 中の白い丸。中抜きのピンには付けない */
  inner: string | null;
};

const MARK_EDGE = "var(--map-mark-edge)";
const MARK_INNER = "var(--map-mark-inner)";

export const PIN_STYLE: Record<PinKind, PinStyle> = {
  good: { fill: "var(--rating-good)", edge: MARK_EDGE, edgeWidth: 2, inner: MARK_INNER },
  normal: { fill: "var(--rating-normal)", edge: MARK_EDGE, edgeWidth: 2, inner: MARK_INNER },
  bad: { fill: "var(--rating-bad)", edge: MARK_EDGE, edgeWidth: 2, inner: MARK_INNER },
  // 「普通」の灰色の塗りと見分けるため、白い地に灰色の枠の中抜きにする。
  // 地図では 34px 幅で描くので、縁は 2.5 × 34/30 ≒ 2.8px（S-6 の 2.5px 以上）
  none: {
    fill: "var(--map-no-history-fill)",
    edge: "var(--map-no-history-line)",
    edgeWidth: 2.5,
    inner: null,
  },
  school: { fill: "var(--map-school)", edge: MARK_EDGE, edgeWidth: 2, inner: MARK_INNER },
  picked: { fill: "var(--brand)", edge: MARK_EDGE, edgeWidth: 2, inner: MARK_INNER },
};

/**
 * Leaflet の divIcon に入れるピンの SVG（文字列）。
 * overflow: visible で、縁が SVG の外側にはみ出しても切らない（中抜きの枠の太さを保つ）。
 */
export function pinSvg(kind: PinKind, width: number, height: number): string {
  const s = PIN_STYLE[kind];
  const inner = s.inner ? `<circle cx="15" cy="15" r="5.5" fill="${s.inner}"/>` : "";
  return `<svg width="${width}" height="${height}" viewBox="0 0 30 40" style="overflow:visible" xmlns="http://www.w3.org/2000/svg">
      <path d="${PIN_PATH}" fill="${s.fill}" stroke="${s.edge}" stroke-width="${s.edgeWidth}"/>
      ${inner}
    </svg>`;
}
