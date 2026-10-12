// クールダウン（前回配布からの間隔不足）の判定。WO-003。
// 画面・DB から切り離した純粋な関数だけを置く（自動テストの対象。`cooldown.test.ts`）。
import type { CooldownVisit } from "@/lib/types";

export type { CooldownVisit };

/** しきい値 N（日）。WO-004 で設定画面の値に置き換える予定 */
export const COOLDOWN_DAYS = 90;

export const NO_SPOT_NAME_LABEL = "（立ち位置名なし）";

export type LocationLatest = {
  /** 最新の配布（配布数0を含む）。非推奨かどうかの判定に使う */
  latestVisit: CooldownVisit | null;
  /** 最新の実績（配布数0を除く）。クールダウンの日付に使う */
  latestCounted: CooldownVisit | null;
};

/** cooldown=クールダウン中 / available=配布可 / none=配布実績なし / excluded=非推奨（対象外） */
export type SpotStatusKind = "cooldown" | "available" | "none" | "excluded";

export type SpotStatus = {
  kind: SpotStatusKind;
  /** 表示する日付。非推奨なら最新の配布の日付、それ以外は最新の実績の日付。実績なしなら null */
  date: string | null;
  /** 今日 − date（暦日）。未来日なら負。非推奨・実績なしでは null */
  elapsedDays: number | null;
  /** date + N 日。非推奨・実績なしでは null */
  releaseDate: string | null;
  /** date が今日より後か */
  isFuture: boolean;
};

export type SpotInput = { id: string; spot: string | null; status: SpotStatus };
export type SpotRow = { id: string; name: string; status: SpotStatus };
/** 学校1校分の表示データ（サーバーで組み立てて画面に渡す） */
export type SchoolSpotsView = { total: number; active: SpotRow[]; excluded: SpotRow[] };

// ── 日付（YYYY-MM-DD）────────────────────────────────────────────────────────
// 実行環境のタイムゾーンに左右されないよう、日付はすべて UTC の 0 時として扱う。

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

function toUtcMs(isoDate: string): number {
  const [y, m, d] = isoDate.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function addDays(isoDate: string, days: number): string {
  return new Date(toUtcMs(isoDate) + days * MS_PER_DAY).toISOString().slice(0, 10);
}

/** to − from（暦日） */
function diffDays(from: string, to: string): number {
  return Math.round((toUtcMs(to) - toUtcMs(from)) / MS_PER_DAY);
}

/** 日本時間（Asia/Tokyo）の今日。日本は夏時間が無いので UTC+9 固定で求める */
export function todayInTokyo(now: Date): string {
  return new Date(now.getTime() + JST_OFFSET_MS).toISOString().slice(0, 10);
}

// ── 立ち位置ごとにまとめる ───────────────────────────────────────────────────

/**
 * 新しい順の比較（負なら a が先）。
 * date 降順 → start_time 降順（未記入は後ろ）→ created_at 降順 → id 降順。
 * 文字列のまま比べる: date は YYYY-MM-DD、start_time は HH:MM:SS、
 * created_at は PostgREST が UTC（+00:00）の同じ形式で返すため、文字列の大小が時刻の前後と一致する。
 */
function compareNewestFirst(a: CooldownVisit, b: CooldownVisit): number {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1;
  if (a.start_time !== b.start_time) {
    if (a.start_time === null) return 1;
    if (b.start_time === null) return -1;
    return a.start_time < b.start_time ? 1 : -1;
  }
  if (a.created_at !== b.created_at) return a.created_at < b.created_at ? 1 : -1;
  if (a.id !== b.id) return a.id < b.id ? 1 : -1;
  return 0;
}

/** 数える実績か（配布数が1以上、または未記入） */
function isCounted(visit: CooldownVisit): boolean {
  return visit.count === null || visit.count >= 1;
}

/** 未削除の実績を立ち位置ごとにまとめ、最新の配布・最新の実績を求める */
export function summarizeByLocation(visits: CooldownVisit[]): Map<string, LocationLatest> {
  const result = new Map<string, LocationLatest>();
  for (const visit of visits) {
    const current = result.get(visit.location_id) ?? { latestVisit: null, latestCounted: null };
    if (current.latestVisit === null || compareNewestFirst(visit, current.latestVisit) < 0) {
      current.latestVisit = visit;
    }
    if (isCounted(visit)) {
      if (current.latestCounted === null || compareNewestFirst(visit, current.latestCounted) < 0) {
        current.latestCounted = visit;
      }
    }
    result.set(visit.location_id, current);
  }
  return result;
}

// ── 状態を求める ─────────────────────────────────────────────────────────────

export function getSpotStatus(
  latestVisit: CooldownVisit | null,
  latestCounted: CooldownVisit | null,
  today: string,
  days: number
): SpotStatus {
  // 非推奨の判定が先（最新の配布の評価が非推奨なら、日付に関係なく対象外）
  if (latestVisit && latestVisit.rating === "bad") {
    return {
      kind: "excluded",
      date: latestVisit.date,
      elapsedDays: null,
      releaseDate: null,
      isFuture: latestVisit.date > today,
    };
  }

  if (!latestCounted) {
    return { kind: "none", date: null, elapsedDays: null, releaseDate: null, isFuture: false };
  }

  const date = latestCounted.date;
  const releaseDate = addDays(date, days);
  return {
    kind: today < releaseDate ? "cooldown" : "available",
    date,
    elapsedDays: diffDays(date, today),
    releaseDate,
    isFuture: date > today,
  };
}

// ── 表示の並び ───────────────────────────────────────────────────────────────

/**
 * 学校1校分の立ち位置を、対象（非推奨以外）と非推奨に分けて並べる。
 * 並び順: 立ち位置名の昇順（localeCompare "ja"）。名前なしは末尾。同じ名前は id の昇順。
 * total は非推奨を含むすべての立ち位置の数（見出しに出す）。
 */
export function buildSpotList(spots: SpotInput[]): SchoolSpotsView {
  const rows = spots.map((s) => ({ id: s.id, trimmed: (s.spot ?? "").trim(), status: s.status }));

  rows.sort((a, b) => {
    const aHasName = a.trimmed !== "";
    const bHasName = b.trimmed !== "";
    if (aHasName !== bHasName) return aHasName ? -1 : 1;
    const byName = a.trimmed.localeCompare(b.trimmed, "ja");
    if (byName !== 0) return byName;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });

  const toRow = (r: (typeof rows)[number]): SpotRow => ({
    id: r.id,
    name: r.trimmed === "" ? NO_SPOT_NAME_LABEL : r.trimmed,
    status: r.status,
  });

  return {
    total: rows.length,
    active: rows.filter((r) => r.status.kind !== "excluded").map(toRow),
    excluded: rows.filter((r) => r.status.kind === "excluded").map(toRow),
  };
}

// ── 全件取得ループ ───────────────────────────────────────────────────────────

/** 1ページ分の取得結果（Supabase の select(..., { count: "exact" }).range() の返りと同じ形） */
export type PageResult<T> = { data: T[] | null; count: number | null; error: unknown };
export type FetchAllResult<T> = { ok: true; rows: T[] } | { ok: false; reason: string };

/**
 * 1ページ分を取る処理（from〜to の行と総件数を返す）を繰り返して全件を取る。
 * - 次の開始位置は「それまでに受け取った件数」（Max rows がページサイズより小さくても行を飛ばさない）
 * - 合計が総件数に達したら終わり（1ページの件数とページサイズの比較では終わりにしない）
 * - エラー・例外／総件数が返らない／途中で総件数が変わった／総件数前に0件／合計が総件数を超えた → 取得失敗
 */
export async function fetchAllRows<T>(
  fetchPage: (from: number, to: number) => Promise<PageResult<T>>,
  pageSize: number
): Promise<FetchAllResult<T>> {
  const rows: T[] = [];
  let total: number | null = null;

  while (true) {
    let page: PageResult<T>;
    try {
      page = await fetchPage(rows.length, rows.length + pageSize - 1);
    } catch (e) {
      return { ok: false, reason: `取得中に例外: ${String(e)}` };
    }
    if (page.error) return { ok: false, reason: `取得エラー: ${String(page.error)}` };
    if (page.count === null) return { ok: false, reason: "総件数が返らなかった" };
    if (total === null) total = page.count;
    else if (page.count !== total) {
      return { ok: false, reason: `取得中に総件数が変わった（${total} → ${page.count}）` };
    }

    const data = page.data ?? [];
    rows.push(...data);

    if (rows.length > total) {
      return { ok: false, reason: `取得件数 ${rows.length} が総件数 ${total} を超えた` };
    }
    if (rows.length === total) return { ok: true, rows };
    if (data.length === 0) {
      return { ok: false, reason: `総件数 ${total} に達する前に0件が返った（${rows.length} 件まで）` };
    }
  }
}
