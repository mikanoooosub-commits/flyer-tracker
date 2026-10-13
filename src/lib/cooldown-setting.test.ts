import { describe, expect, it } from "vitest";
import { parseCooldownDays } from "@/lib/cooldown-setting";

// 期待値は実装の定数を使わず、仕様（WO-004 S-5）の文言・値をそのまま書く
const INPUT_ERROR = { ok: false, error: "1〜365 の整数で入力してください" };

describe("S-5 / E-1: 範囲（1〜365）", () => {
  it("E-1: 1 → 保存できる（下限）", () => {
    expect(parseCooldownDays("1")).toEqual({ ok: true, days: 1 });
  });

  it("E-1: 365 → 保存できる（上限）", () => {
    expect(parseCooldownDays("365")).toEqual({ ok: true, days: 365 });
  });

  it("E-1: 90 → 保存できる", () => {
    expect(parseCooldownDays("90")).toEqual({ ok: true, days: 90 });
  });

  it("E-1: 0 → エラー", () => {
    expect(parseCooldownDays("0")).toEqual(INPUT_ERROR);
  });

  it("E-1: 366 → エラー", () => {
    expect(parseCooldownDays("366")).toEqual(INPUT_ERROR);
  });

  it("E-1: 負の数 -1 → エラー", () => {
    expect(parseCooldownDays("-1")).toEqual(INPUT_ERROR);
  });
});

describe("S-5 / E-2: 受け付ける入力（90 になる）", () => {
  it.each([
    ["９０", "全角"],
    ["9０", "半角と全角の混在"],
    [" 90 ", "前後の半角空白"],
    ["　90　", "前後の全角空白"],
    ["090", "先頭ゼロ"],
  ])("E-2: 「%s」（%s）→ 90", (input) => {
    expect(parseCooldownDays(input)).toEqual({ ok: true, days: 90 });
  });
});

describe("S-5 / E-2: 弾く入力（エラー文まで確かめる）", () => {
  it.each([
    ["90.5", "小数点"],
    ["+90", "符号 +"],
    ["-0", "符号 -"],
    ["1e2", "指数"],
    ["9,0", "カンマ"],
    ["9 0", "数字の間の空白"],
    ["⑨⓪", "丸数字"],
    ["90日", "単位"],
    ["九十", "漢数字"],
    ["", "空"],
    ["   ", "半角空白だけ"],
    ["　", "全角空白だけ"],
  ])("E-2: 「%s」（%s）→ エラー", (input) => {
    expect(parseCooldownDays(input)).toEqual(INPUT_ERROR);
  });

  it.each<[unknown, string]>([
    [90, "数値の 90"],
    [null, "null"],
    [undefined, "未定義"],
    [["90"], "配列"],
  ])("E-2: 文字列でない値 %j（%s）→ エラー", (input) => {
    expect(parseCooldownDays(input)).toEqual(INPUT_ERROR);
  });
});
