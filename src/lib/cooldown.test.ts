import { describe, expect, it } from "vitest";
import {
  NO_SPOT_NAME_LABEL,
  buildSpotList,
  fetchAllRows,
  getSpotStatus,
  summarizeByLocation,
  todayInTokyo,
  type CooldownVisit,
  type PageResult,
  type SpotInput,
  type SpotStatus,
} from "@/lib/cooldown";

// 境界ケースの例はすべて N = 90、今日 = 2026-10-12（WO-003 E-n の前提）
const TODAY = "2026-10-12";
const N = 90;

/** テスト用の実績。指定しない列は「数える実績・良好」になる既定値 */
function v(over: Partial<CooldownVisit> & { id: string }): CooldownVisit {
  return {
    location_id: "loc-1",
    date: "2026-07-01",
    start_time: null,
    created_at: "2026-07-01T00:00:00+00:00",
    count: 10,
    rating: "good",
    ...over,
  };
}

/** まとめ → 状態 を通しで求める（立ち位置1つ分） */
function statusOf(visits: CooldownVisit[], locationId = "loc-1", today = TODAY): SpotStatus {
  const latest = summarizeByLocation(visits).get(locationId);
  return getSpotStatus(latest?.latestVisit ?? null, latest?.latestCounted ?? null, today, N);
}

describe("E-14: 実行環境のタイムゾーン（記録用）", () => {
  it("E-14: getTimezoneOffset を出力する（UTC=0, America/Los_Angeles=420/480）", () => {
    const offset = new Date("2026-10-12T00:00:00Z").getTimezoneOffset();
    console.log(`[E-14] TZ=${process.env.TZ ?? "(未指定)"} getTimezoneOffset()=${offset}`);
    expect(todayInTokyo(new Date("2026-10-11T15:30:00Z"))).toBe("2026-10-12");
  });
});

describe("S-3(a) 今日（日本時間）", () => {
  it("E-6: UTC 2026-10-11 15:30 は日本時間 10/12 0:30 → 2026-10-12", () => {
    expect(todayInTokyo(new Date("2026-10-11T15:30:00Z"))).toBe("2026-10-12");
  });

  it("E-6: UTC 14:59:59 は日本時間 23:59:59 → 前日のまま", () => {
    expect(todayInTokyo(new Date("2026-10-11T14:59:59Z"))).toBe("2026-10-11");
  });

  it("E-6: UTC 15:00:00 ちょうどで日付が変わる", () => {
    expect(todayInTokyo(new Date("2026-10-11T15:00:00Z"))).toBe("2026-10-12");
  });

  it("E-6: 年をまたぐ境目（UTC 12/31 15:00 → 日本時間 1/1）", () => {
    expect(todayInTokyo(new Date("2026-12-31T15:00:00Z"))).toBe("2027-01-01");
  });
});

describe("S-3(b) 立ち位置ごとにまとめる", () => {
  it("E-7: 立ち位置ごとに別々に最新を求める（他の立ち位置の影響を受けない）", () => {
    const map = summarizeByLocation([
      v({ id: "a1", location_id: "A", date: "2026-10-01" }),
      v({ id: "b1", location_id: "B", date: "2026-05-01" }),
      v({ id: "a0", location_id: "A", date: "2026-04-01" }),
    ]);
    expect(map.get("A")?.latestCounted?.id).toBe("a1");
    expect(map.get("B")?.latestCounted?.id).toBe("b1");
    expect(statusOf([v({ id: "a1", location_id: "A", date: "2026-10-01" }), v({ id: "b1", location_id: "B", date: "2026-05-01" })], "B").kind).toBe("available");
  });

  it("E-10: 最新の配布は配布数0を含み、最新の実績は配布数0を除く", () => {
    const map = summarizeByLocation([
      v({ id: "zero", date: "2026-07-15", count: 0, rating: "normal" }),
      v({ id: "prev", date: "2026-07-02", count: 5 }),
    ]);
    expect(map.get("loc-1")?.latestVisit?.id).toBe("zero");
    expect(map.get("loc-1")?.latestCounted?.id).toBe("prev");
  });

  it("E-11: 配布数未記入（null）は数える実績になる", () => {
    const map = summarizeByLocation([
      v({ id: "nullcount", date: "2026-08-01", count: null }),
      v({ id: "older", date: "2026-07-01" }),
    ]);
    expect(map.get("loc-1")?.latestCounted?.id).toBe("nullcount");
  });

  it("E-11: 配布数が負の値は数えない（1以上か未記入のみ）", () => {
    const map = summarizeByLocation([v({ id: "neg", date: "2026-08-01", count: -1 }), v({ id: "ok", date: "2026-07-01" })]);
    expect(map.get("loc-1")?.latestCounted?.id).toBe("ok");
  });

  it("E-12: 同じ日なら start_time の遅い方が先", () => {
    const map = summarizeByLocation([
      v({ id: "early", date: "2026-08-01", start_time: "08:00:00", rating: "good" }),
      v({ id: "late", date: "2026-08-01", start_time: "15:30:00", rating: "bad" }),
    ]);
    expect(map.get("loc-1")?.latestVisit?.id).toBe("late");
  });

  it("E-12: start_time 未記入は後ろ", () => {
    const map = summarizeByLocation([
      v({ id: "notime", date: "2026-08-01", start_time: null }),
      v({ id: "timed", date: "2026-08-01", start_time: "07:00:00" }),
    ]);
    expect(map.get("loc-1")?.latestVisit?.id).toBe("timed");
  });

  it("E-12: start_time も同じなら created_at の新しい方", () => {
    const map = summarizeByLocation([
      v({ id: "z-old", date: "2026-08-01", start_time: "08:00:00", created_at: "2026-08-01T01:00:00+00:00" }),
      v({ id: "a-new", date: "2026-08-01", start_time: "08:00:00", created_at: "2026-08-01T02:00:00+00:00" }),
    ]);
    expect(map.get("loc-1")?.latestVisit?.id).toBe("a-new");
  });

  it("E-12: created_at の小数秒の桁数が違っても新しい方が先（PostgREST は末尾の0を省く）", () => {
    const base = { date: "2026-08-01", start_time: null };
    const a = summarizeByLocation([
      v({ id: "whole", ...base, created_at: "2026-08-01T01:00:00+00:00" }),
      v({ id: "half", ...base, created_at: "2026-08-01T01:00:00.5+00:00" }),
    ]);
    expect(a.get("loc-1")?.latestVisit?.id).toBe("half");
    const b = summarizeByLocation([
      v({ id: "longer", ...base, created_at: "2026-08-01T01:00:00.123456+00:00" }),
      v({ id: "shorter", ...base, created_at: "2026-08-01T01:00:00.12+00:00" }),
    ]);
    expect(b.get("loc-1")?.latestVisit?.id).toBe("longer");
    const c = summarizeByLocation([
      v({ id: "point9", ...base, created_at: "2026-08-01T01:00:00.9+00:00" }),
      v({ id: "next-sec", ...base, created_at: "2026-08-01T01:00:01+00:00" }),
    ]);
    expect(c.get("loc-1")?.latestVisit?.id).toBe("next-sec");
  });

  it("E-12: created_at も同じなら id の降順（大きい方）", () => {
    const same = { date: "2026-08-01", start_time: null, created_at: "2026-08-01T01:00:00+00:00" };
    const map = summarizeByLocation([v({ id: "id-1", ...same, rating: "good" }), v({ id: "id-2", ...same, rating: "bad" })]);
    expect(map.get("loc-1")?.latestVisit?.id).toBe("id-2");
    // 入力の並びを逆にしても同じ結果（入力順に依存しない）
    const rev = summarizeByLocation([v({ id: "id-2", ...same, rating: "bad" }), v({ id: "id-1", ...same, rating: "good" })]);
    expect(rev.get("loc-1")?.latestVisit?.id).toBe("id-2");
  });

  it("E-19: 配布数0の実績しかない立ち位置 → 最新の配布はあり、最新の実績は無し", () => {
    const map = summarizeByLocation([v({ id: "z", count: 0, rating: "normal" })]);
    expect(map.get("loc-1")?.latestVisit?.id).toBe("z");
    expect(map.get("loc-1")?.latestCounted).toBeNull();
  });
});

describe("S-3(c) 状態を求める", () => {
  it("E-1: 数える実績が無い → 配布実績なし", () => {
    const s = getSpotStatus(null, null, TODAY, N);
    expect(s).toEqual({ kind: "none", date: null, elapsedDays: null, releaseDate: null, isFuture: false });
  });

  it("E-2: 最新の実績が今日・良好 → クールダウン中、経過0日、解禁日 2027-01-10", () => {
    const s = statusOf([v({ id: "t", date: "2026-10-12" })]);
    expect(s).toEqual({ kind: "cooldown", date: "2026-10-12", elapsedDays: 0, releaseDate: "2027-01-10", isFuture: false });
  });

  it("E-3: 2026-07-14（経過90日）→ 配布可、解禁日 = 今日", () => {
    const s = statusOf([v({ id: "x", date: "2026-07-14" })]);
    expect(s).toEqual({ kind: "available", date: "2026-07-14", elapsedDays: 90, releaseDate: "2026-10-12", isFuture: false });
  });

  it("E-3: 2026-07-15（経過89日）→ クールダウン中、解禁日 2026-10-13", () => {
    const s = statusOf([v({ id: "x", date: "2026-07-15" })]);
    expect(s).toEqual({ kind: "cooldown", date: "2026-07-15", elapsedDays: 89, releaseDate: "2026-10-13", isFuture: false });
  });

  it("E-5: 最新の実績が未来（2026-10-20）→ クールダウン中・未来日、解禁日 2027-01-18、経過は負", () => {
    const s = statusOf([v({ id: "f", date: "2026-10-20" }), v({ id: "p", date: "2026-09-01" })]);
    expect(s).toEqual({ kind: "cooldown", date: "2026-10-20", elapsedDays: -8, releaseDate: "2027-01-18", isFuture: true });
  });

  it("E-4: 先頭が論理削除されて取り除かれた → 残りで求め直す（残った先頭が配布数0・非推奨なら非推奨）", () => {
    // 取得時点で未削除に絞るため、論理削除された実績は入力に入らない
    const s = statusOf([v({ id: "z", date: "2026-09-01", count: 0, rating: "bad" }), v({ id: "p", date: "2026-08-01" })]);
    expect(s.kind).toBe("excluded");
    expect(s.date).toBe("2026-09-01");
  });

  it("E-4: 未削除の実績が無くなった → 配布実績なし", () => {
    expect(statusOf([]).kind).toBe("none");
  });

  it("E-7: 同じ学校の別の立ち位置で配っても、その立ち位置だけがクールダウン中", () => {
    const visits = [v({ id: "a", location_id: "A", date: "2026-10-10" }), v({ id: "b", location_id: "B", date: "2026-06-01" })];
    expect(statusOf(visits, "A").kind).toBe("cooldown");
    expect(statusOf(visits, "B").kind).toBe("available");
  });

  it("E-8: 最新の実績が非推奨 → 対象外（その前が良好でも）", () => {
    const s = statusOf([v({ id: "bad", date: "2026-10-01", rating: "bad" }), v({ id: "good", date: "2026-09-01", rating: "good" })]);
    expect(s).toEqual({ kind: "excluded", date: "2026-10-01", elapsedDays: null, releaseDate: null, isFuture: false });
  });

  it("E-9: 非推奨の後に配布数1以上で良好 → 対象に戻りクールダウン中", () => {
    const s = statusOf([v({ id: "new", date: "2026-10-05", rating: "good", count: 3 }), v({ id: "bad", date: "2026-06-25", rating: "bad" })]);
    expect(s.kind).toBe("cooldown");
    expect(s.date).toBe("2026-10-05");
  });

  it("E-9: 非推奨の後に配布数0で普通 → 非推奨ではなくなるが、日付は配布数0を除いた最新の実績", () => {
    const s = statusOf([v({ id: "zero", date: "2026-10-05", rating: "normal", count: 0 }), v({ id: "bad", date: "2026-06-25", rating: "bad", count: 10 })]);
    expect(s.kind).toBe("available");
    expect(s.date).toBe("2026-06-25");
  });

  it("E-9: 配布数0で普通、ほかに数える実績が無い → 配布実績なし", () => {
    expect(statusOf([v({ id: "zero", date: "2026-10-05", rating: "normal", count: 0 })]).kind).toBe("none");
  });

  it("E-10: 最新の配布が配布数0・普通 → 非推奨ではない。日付はそれを除いた最新の実績", () => {
    const s = statusOf([v({ id: "zero", date: "2026-10-01", rating: "normal", count: 0 }), v({ id: "p", date: "2026-09-01" })]);
    expect(s.kind).toBe("cooldown");
    expect(s.date).toBe("2026-09-01");
  });

  it("E-10: 最新の配布が配布数0・非推奨 → 非推奨（対象外）", () => {
    const s = statusOf([v({ id: "zero", date: "2026-07-15", rating: "bad", count: 0 }), v({ id: "p", date: "2026-07-02" })]);
    expect(s.kind).toBe("excluded");
    expect(s.date).toBe("2026-07-15");
  });

  it("E-11: 最新の実績が配布数未記入 → 数える実績として判定", () => {
    const s = statusOf([v({ id: "n", date: "2026-10-01", count: null })]);
    expect(s.kind).toBe("cooldown");
    expect(s.date).toBe("2026-10-01");
  });

  it("E-12: 同じ日に2回（評価違い）→ 新しい順の先頭の評価で判定", () => {
    const s = statusOf([
      v({ id: "am", date: "2026-10-01", start_time: "08:00:00", rating: "bad" }),
      v({ id: "pm", date: "2026-10-01", start_time: "15:00:00", rating: "good" }),
    ]);
    expect(s.kind).toBe("cooldown");
  });

  it("E-13: 月末・年末をまたぐ（2026-11-15 → 2027-02-13）", () => {
    expect(getSpotStatus(v({ id: "x", date: "2026-11-15" }), v({ id: "x", date: "2026-11-15" }), "2027-02-12", N)).toEqual({
      kind: "cooldown",
      date: "2026-11-15",
      elapsedDays: 89,
      releaseDate: "2027-02-13",
      isFuture: false,
    });
  });

  it("E-13: うるう年（2027-12-01 → 2028-02-29）", () => {
    expect(getSpotStatus(v({ id: "x", date: "2027-12-01" }), v({ id: "x", date: "2027-12-01" }), "2028-02-29", N)).toEqual({
      kind: "available",
      date: "2027-12-01",
      elapsedDays: 90,
      releaseDate: "2028-02-29",
      isFuture: false,
    });
  });

  it("E-18: 非推奨で最新の配布が今日 → 対象外（クールダウン中にしない）", () => {
    const s = statusOf([v({ id: "t", date: "2026-10-12", rating: "bad" })]);
    expect(s).toEqual({ kind: "excluded", date: "2026-10-12", elapsedDays: null, releaseDate: null, isFuture: false });
  });

  it("E-19: 配布数0の実績しかない（非推奨でない）→ 配布実績なし", () => {
    const s = statusOf([v({ id: "z", date: "2026-10-01", count: 0, rating: "normal" })]);
    expect(s).toEqual({ kind: "none", date: null, elapsedDays: null, releaseDate: null, isFuture: false });
  });

  it("E-21: 非推奨で最新の配布が未来日（2026-10-20）→ 対象外・未来日、経過日数・解禁日なし", () => {
    const s = statusOf([v({ id: "f", date: "2026-10-20", rating: "bad" })]);
    expect(s).toEqual({ kind: "excluded", date: "2026-10-20", elapsedDays: null, releaseDate: null, isFuture: true });
  });
});

describe("S-3(d) 表示の並び", () => {
  const cooldown: SpotStatus = { kind: "cooldown", date: "2026-10-12", elapsedDays: 0, releaseDate: "2027-01-10", isFuture: false };
  const none: SpotStatus = { kind: "none", date: null, elapsedDays: null, releaseDate: null, isFuture: false };
  const excluded: SpotStatus = { kind: "excluded", date: "2026-06-25", elapsedDays: null, releaseDate: null, isFuture: false };
  const spot = (id: string, name: string | null, status: SpotStatus = none): SpotInput => ({ id, spot: name, status });

  it("S-1: 名前の昇順（localeCompare ja）で並ぶ", () => {
    // 期待値は Node の ICU で localeCompare(…, "ja") を実行して確かめた並び（ひらがな → 漢字）
    const view = buildSpotList([spot("1", "裏門"), spot("2", "正門前"), spot("3", "あさひ通り"), spot("4", "正門西側")]);
    expect(view.active.map((r) => r.name)).toEqual(["あさひ通り", "正門西側", "正門前", "裏門"]);
  });

  it("E-20: 非推奨の側でも名前の昇順・名前なしは末尾", () => {
    const view = buildSpotList([spot("1", null, excluded), spot("2", "裏門", excluded), spot("3", "あさひ通り", excluded)]);
    expect(view.excluded.map((r) => r.name)).toEqual(["あさひ通り", "裏門", NO_SPOT_NAME_LABEL]);
    expect(view.active).toEqual([]);
  });

  it("S-1: 対象を先、非推奨を後ろの別の並びに分ける。見出しの数は非推奨を含む全件", () => {
    const view = buildSpotList([spot("1", "B", excluded), spot("2", "A", cooldown), spot("3", "C", none), spot("4", "A2", excluded)]);
    expect(view.total).toBe(4);
    expect(view.active.map((r) => r.id)).toEqual(["2", "3"]);
    expect(view.excluded.map((r) => r.id)).toEqual(["4", "1"]);
  });

  it("S-1: 全部非推奨 → 対象は0、非推奨だけ", () => {
    const view = buildSpotList([spot("1", "A", excluded)]);
    expect(view.total).toBe(1);
    expect(view.active).toEqual([]);
    expect(view.excluded.map((r) => r.id)).toEqual(["1"]);
  });

  it("E-17: 立ち位置が1つも無い → 見出しの数0", () => {
    expect(buildSpotList([])).toEqual({ total: 0, active: [], excluded: [] });
  });

  it("E-20: 空白だけ・空文字・null は「（立ち位置名なし）」で末尾", () => {
    const view = buildSpotList([spot("1", "   "), spot("2", "正門前"), spot("3", null), spot("4", "")]);
    expect(view.active.map((r) => r.name)).toEqual(["正門前", NO_SPOT_NAME_LABEL, NO_SPOT_NAME_LABEL, NO_SPOT_NAME_LABEL]);
    expect(view.active.map((r) => r.id)).toEqual(["2", "1", "3", "4"]);
  });

  it("E-20: 前後の空白は除いて表示・比較する", () => {
    const view = buildSpotList([spot("1", "  正門前 ")]);
    expect(view.active[0].name).toBe("正門前");
  });

  it("E-20: 同じ名前が2つ → id の昇順で両方出す", () => {
    const view = buildSpotList([spot("b", "正門前"), spot("a", "正門前 ")]);
    expect(view.active.map((r) => r.id)).toEqual(["a", "b"]);
  });

  it("S-1: 状態はそのまま行に載る", () => {
    const view = buildSpotList([spot("1", "A", cooldown)]);
    expect(view.active[0].status).toEqual(cooldown);
  });
});

describe("S-7 全件取得ループ", () => {
  /** 要求された開始位置から、上限（maxRows）までしか返さない偽の1ページ取得処理 */
  function fakeSource(rows: number[], maxRows: number) {
    const calls: [number, number][] = [];
    const fetchPage = async (from: number, to: number): Promise<PageResult<number>> => {
      calls.push([from, to]);
      const end = Math.min(to + 1, from + maxRows);
      return { data: rows.slice(from, end), count: rows.length, error: null };
    };
    return { fetchPage, calls };
  }
  const range = (n: number) => Array.from({ length: n }, (_, i) => i);

  it("E-15: 返りがページサイズより少なくても、総件数に達するまで次を取りに行く（行を飛ばさない）", async () => {
    const { fetchPage, calls } = fakeSource(range(25), 4); // Max rows 4 < ページサイズ 10
    const result = await fetchAllRows(fetchPage, 10);
    expect(result).toEqual({ ok: true, rows: range(25) });
    // 次の開始位置は「それまでに受け取った件数」
    expect(calls.map(([from]) => from)).toEqual([0, 4, 8, 12, 16, 20, 24]);
  });

  it("S-7: ページサイズちょうどで割り切れる件数でも全件", async () => {
    const { fetchPage } = fakeSource(range(20), 100);
    expect(await fetchAllRows(fetchPage, 10)).toEqual({ ok: true, rows: range(20) });
  });

  it("E-15: 実績0件 → 成功（空）", async () => {
    const { fetchPage } = fakeSource([], 10);
    expect(await fetchAllRows(fetchPage, 10)).toEqual({ ok: true, rows: [] });
  });

  it("E-15: 途中でエラー → 取得失敗", async () => {
    let n = 0;
    const result = await fetchAllRows<number>(async (from) => {
      n += 1;
      if (n === 2) return { data: null, count: 30, error: new Error("boom") };
      return { data: range(30).slice(from, from + 10), count: 30, error: null };
    }, 10);
    expect(result.ok).toBe(false);
    // 総件数は正しく返る形にして、エラーそのものを理由に失敗していることを確かめる
    expect(result.ok === false && result.reason).toContain("取得エラー");
  });

  it("E-15: 途中で例外が投げられた → 取得失敗", async () => {
    const result = await fetchAllRows<number>(async () => {
      throw new Error("network");
    }, 10);
    expect(result.ok).toBe(false);
  });

  it("E-15: 総件数に達していないのに0件 → 取得失敗", async () => {
    const result = await fetchAllRows<number>(async (from) => ({
      data: from === 0 ? range(10) : [],
      count: 30,
      error: null,
    }), 10);
    expect(result.ok).toBe(false);
  });

  it("E-15: 途中で総件数が変わった → 取得失敗", async () => {
    const result = await fetchAllRows<number>(async (from) => ({
      data: range(40).slice(from, from + 10),
      count: from === 0 ? 30 : 31,
      error: null,
    }), 10);
    expect(result.ok).toBe(false);
  });

  it("E-15: 合計が総件数と一致しない（超えた）→ 取得失敗", async () => {
    const result = await fetchAllRows<number>(async (from) => ({
      data: range(40).slice(from, from + 10),
      count: 25,
      error: null,
    }), 10);
    expect(result.ok).toBe(false);
    // 「総件数前に0件」ではなく「超えた」で失敗していること
    expect(result.ok === false && result.reason).toContain("超えた");
  });

  it("S-7: 総件数が返らない → 取得失敗", async () => {
    const result = await fetchAllRows<number>(async () => ({ data: [1], count: null, error: null }), 10);
    expect(result.ok).toBe(false);
  });
});
