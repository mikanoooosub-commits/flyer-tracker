// ── 評価 ───────────────────────────────────────────────────────────────────
export type Rating = "good" | "normal" | "bad";

export const RATING_META: Record<
  Rating,
  { label: string; colorVar: string; badgeClass: string }
> = {
  good: { label: "良好", colorVar: "var(--rating-good)", badgeClass: "bg-rating-good text-white" },
  normal: { label: "普通", colorVar: "var(--rating-normal)", badgeClass: "bg-rating-normal text-white" },
  bad: { label: "非推奨", colorVar: "var(--rating-bad)", badgeClass: "bg-rating-bad text-white" },
};

export const RATING_ORDER: Rating[] = ["good", "normal", "bad"];

// ── DB テーブルに対応する型 ─────────────────────────────────────────────────
export type School = {
  id: string;
  name: string;
  lat: number | null;
  lng: number | null;
  created_at: string;
};

export type Location = {
  id: string;
  school_id: string | null;
  spot: string | null;
  label: string | null;
  lat: number | null;
  lng: number | null;
  created_at: string;
};

export type Visit = {
  id: string;
  location_id: string;
  user_id: string | null;
  date: string; // YYYY-MM-DD
  start_time: string | null; // HH:MM[:SS]
  end_time: string | null;
  count: number | null;
  rating: Rating;
  memo: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
};

export type VisitAction = "create" | "update" | "delete";

export type VisitLog = {
  id: string;
  visit_id: string;
  user_id: string | null;
  action: VisitAction;
  before_data: Visit | null;
  after_data: Visit | null;
  created_at: string;
};

export type VisitLogWithUser = VisitLog & { userName: string | null };

export type LocationPinStatus = {
  location_id: string;
  latest_visit_id: string | null;
  latest_rating: Rating | null;
  latest_date: string | null;
  latest_start_time: string | null;
};

// ── 画面表示用に join した型 ─────────────────────────────────────────────────
export type VisitWithRelations = Visit & {
  location: (Location & { school: School | null }) | null;
};

// ── マップメモ ───────────────────────────────────────────────────────────────
export type MapNote = {
  id: string;
  lat: number;
  lng: number;
  color: string;
  label: string | null;
  memo: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
};

/** メモの色プリセット（色自体に意味は持たせない。用途は見出し・メモで自由に） */
export const NOTE_PRESETS: { value: string; label: string; color: string }[] = [
  { value: "yellow", label: "黄", color: "#eab308" },
  { value: "purple", label: "紫", color: "#8b5cf6" },
  { value: "red", label: "赤", color: "#ef4444" },
  { value: "blue", label: "青", color: "#3b82f6" },
  { value: "green", label: "緑", color: "#22c55e" },
];

export const NOTE_COLOR_MAP: Record<string, string> = Object.fromEntries(
  NOTE_PRESETS.map((p) => [p.value, p.color])
);

export function noteColor(token: string): string {
  return NOTE_COLOR_MAP[token] ?? "#eab308";
}

// ── フォーム入力・アクション結果 ─────────────────────────────────────────────
export type VisitInput = {
  schoolId: string;
  spot: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  count: number | null;
  rating: Rating;
  memo: string | null;
  lat: number | null;
  lng: number | null;
};

export type ActionResult = { ok: true } | { ok: false; error: string };
