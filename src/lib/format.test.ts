import { describe, expect, it } from "vitest";
import { formatDate, formatTime, formatTimeRange } from "@/lib/format";

describe("formatTime", () => {
  it("DB の時刻 \"09:30:00\" を \"09:30\" にする", () => {
    expect(formatTime("09:30:00")).toBe("09:30");
  });

  it("E-1: null / undefined / 空文字は空文字を返す", () => {
    expect(formatTime(null)).toBe("");
    expect(formatTime(undefined)).toBe("");
    expect(formatTime("")).toBe("");
  });
});

describe("formatTimeRange", () => {
  it("E-2: 開始のみ → \"09:30〜\"", () => {
    expect(formatTimeRange("09:30:00", null)).toBe("09:30〜");
  });

  it("E-2: 終了のみ → \"〜10:15\"", () => {
    expect(formatTimeRange(null, "10:15:00")).toBe("〜10:15");
  });

  it("E-2: 両方 → \"09:30〜10:15\"", () => {
    expect(formatTimeRange("09:30:00", "10:15:00")).toBe("09:30〜10:15");
  });

  it("E-2: 両方なし → 空文字", () => {
    expect(formatTimeRange(null, undefined)).toBe("");
  });
});

describe("formatDate", () => {
  it("E-3: \"2026-07-03\" → \"2026/7/3(金)\"", () => {
    expect(formatDate("2026-07-03")).toBe("2026/7/3(金)");
  });

  it("E-3: 月初でも曜日が正しい（2026-08-01 は土曜）", () => {
    expect(formatDate("2026-08-01")).toBe("2026/8/1(土)");
  });

  it("E-3: 年末でも曜日が正しい（2026-12-31 は木曜）", () => {
    expect(formatDate("2026-12-31")).toBe("2026/12/31(木)");
  });

  it("E-4: 形式外の文字列はそのまま返す", () => {
    expect(formatDate("abc")).toBe("abc");
  });
});
