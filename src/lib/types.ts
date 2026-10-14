// ── 評価 ───────────────────────────────────────────────────────────────────
export type Rating = "good" | "normal" | "bad";

export const RATING_META: Record<
  Rating,
  { label: string; colorVar: string; badgeClass: string }
> = {
  // colorVar はピン・凡例・吹き出しの点の色、badgeClass は評価のバッジ（淡い地＋濃い文字。WO-007 S-2）
  good: {
    label: "良好",
    colorVar: "var(--rating-good)",
    badgeClass: "bg-rating-good-badge text-rating-good-badge-foreground",
  },
  normal: {
    label: "普通",
    colorVar: "var(--rating-normal)",
    badgeClass: "bg-rating-normal-badge text-rating-normal-badge-foreground",
  },
  bad: {
    label: "非推奨",
    colorVar: "var(--rating-bad)",
    badgeClass: "bg-rating-bad-badge text-rating-bad-badge-foreground",
  },
};

export const RATING_ORDER: Rating[] = ["good", "normal", "bad"];

// ── DB テーブルに対応する型 ─────────────────────────────────────────────────
export type School = {
  id: string;
  name: string;
  url: string | null;
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

/** アプリ全体の設定（常に1行。id は true だけ）。WO-004 */
export type AppSettings = {
  id: boolean;
  /** クールダウン日数（1〜365。DB の CHECK で守る） */
  cooldown_days: number;
};

// ── クールダウン（WO-003）で取得する列だけの型 ───────────────────────────────
/** クールダウンの判定に使う実績の列（取得もこの列だけ） */
export type CooldownVisit = Pick<
  Visit,
  "id" | "location_id" | "date" | "start_time" | "created_at" | "count" | "rating"
>;

/** 小学校が設定されている配布場所（立ち位置）の列 */
export type SchoolSpot = Pick<Location, "id" | "school_id" | "spot">;

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

// メモの色の選択肢と読み替えは src/lib/note-color.ts（WO-007 S-7）

// ── フォーム入力・アクション結果 ─────────────────────────────────────────────
export type VisitInput = {
  /** 既存の配布場所を選んだ場合はその id。新規作成なら null（schoolId+spot から解決） */
  locationId: string | null;
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
