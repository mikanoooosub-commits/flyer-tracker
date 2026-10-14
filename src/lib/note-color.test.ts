import { describe, expect, it } from "vitest";
import { NOTE_COLOR_OPTIONS, noteColorVar, toNoteColor } from "@/lib/note-color";

// 期待値は実装の定数を使わず、仕様（WO-007 S-7・E-1・E-2）の値をそのまま書く

describe("S-7: メモの色の選択肢", () => {
  it("S-7: 選択肢は 黄・紫・橙・青・水色 の5色（この順）", () => {
    expect(NOTE_COLOR_OPTIONS).toEqual([
      { value: "yellow", label: "黄" },
      { value: "purple", label: "紫" },
      { value: "orange", label: "橙" },
      { value: "blue", label: "青" },
      { value: "cyan", label: "水色" },
    ]);
  });

  it("S-7: 選択肢に赤・緑は出さない", () => {
    const values = NOTE_COLOR_OPTIONS.map((o) => o.value as string);
    expect(values).not.toContain("red");
    expect(values).not.toContain("green");
  });

  it.each([
    ["yellow", "yellow"],
    ["purple", "purple"],
    ["orange", "orange"],
    ["blue", "blue"],
    ["cyan", "cyan"],
  ])("S-7: 「%s」はそのまま「%s」が選ばれる", (stored, expected) => {
    expect(toNoteColor(stored)).toBe(expected);
  });
});

describe("E-1: すでに赤・緑で作られたメモ（DB は書き換えない）", () => {
  it("E-1: red → 橙（orange）が選ばれる（編集画面の初期値＝保存される値）", () => {
    expect(toNoteColor("red")).toBe("orange");
  });

  it("E-1: green → 水色（cyan）が選ばれる（編集画面の初期値＝保存される値）", () => {
    expect(toNoteColor("green")).toBe("cyan");
  });

  it("E-1: red は橙の色で描く", () => {
    expect(noteColorVar("red")).toBe("var(--map-note-orange)");
  });

  it("E-1: green は水色の色で描く", () => {
    expect(noteColorVar("green")).toBe("var(--map-note-cyan)");
  });
});

describe("E-2: 未知の値・空", () => {
  it.each([
    ["", "空文字"],
    ["pink", "想定外の文字列"],
    ["RED", "大文字（DB の値は小文字だけ）"],
    [" red", "前に空白"],
  ])("E-2: 「%s」（%s）→ 黄（yellow）が選ばれる（編集画面の初期値＝保存される値）", (stored) => {
    expect(toNoteColor(stored)).toBe("yellow");
  });

  it("E-2: null → yellow", () => {
    expect(toNoteColor(null)).toBe("yellow");
  });

  it("E-2: undefined（新しく作るとき）→ yellow", () => {
    expect(toNoteColor(undefined)).toBe("yellow");
  });

  it("E-2: 未知の値は黄の色で描く", () => {
    expect(noteColorVar("pink")).toBe("var(--map-note-yellow)");
    expect(noteColorVar("")).toBe("var(--map-note-yellow)");
  });
});

describe("S-6・S-7: 描く色はトークン（値を直接書かない）", () => {
  it.each([
    ["yellow", "var(--map-note-yellow)"],
    ["purple", "var(--map-note-purple)"],
    ["orange", "var(--map-note-orange)"],
    ["blue", "var(--map-note-blue)"],
    ["cyan", "var(--map-note-cyan)"],
  ])("「%s」→ %s", (stored, expected) => {
    expect(noteColorVar(stored)).toBe(expected);
  });
});
