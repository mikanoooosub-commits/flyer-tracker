import { describe, expect, it } from "vitest";
import { detectLoginError, urlWithoutLoginError } from "@/lib/auth-error";

// 期待値は実装の定数を使わず、仕様（WO-006 用語・S-4・E-5）の判定をそのまま固定値で書く

describe("E-10: WO-005 で実際に観測した拒否の URL", () => {
  it("E-10: ?error=auth と #…error_code=signup_disabled の両方 → 拒否（未登録）", () => {
    expect(
      detectLoginError(
        "#error=access_denied&error_code=signup_disabled&error_description=Signups+not+allowed+for+this+instance",
        "?error=auth"
      )
    ).toBe("not_registered");
  });

  it("S-5: #error_code=signup_disabled だけ（? なし）→ 拒否（未登録）", () => {
    expect(detectLoginError("#error_code=signup_disabled", "")).toBe("not_registered");
  });
});

describe("E-5: # 以降の境目（キーの有無で決める）", () => {
  it.each([
    ["#error", "キーだけ（= なし）"],
    ["#error=", "error の値が空"],
    ["#error_code=", "error_code の値が空"],
    ["#error_code=foo", "error_code だけで signup_disabled 以外"],
    ["#error=x&error_code=other", "error と signup_disabled 以外の error_code"],
  ])("E-5: 「%s」（%s）→ その他の失敗", (hash) => {
    expect(detectLoginError(hash, "")).toBe("failed");
  });

  it.each([
    ["#=&", "キーが空"],
    ["#foo=bar", "未知のパラメータ"],
    ["#", "空"],
    ["", "# なし"],
  ])("E-5: 「%s」（%s）→ エラーなし", (hash) => {
    expect(detectLoginError(hash, "")).toBe("none");
  });

  it("E-5: 壊れた % を含んでも例外を出さない（#error=%E0%A4%A → その他の失敗）", () => {
    expect(detectLoginError("#error=%E0%A4%A", "")).toBe("failed");
  });
});

describe("E-5 / E-6 / E-14: ? 以降の error", () => {
  it("E-6 / E-14: ?error=auth だけ（# なし）→ その他の失敗", () => {
    expect(detectLoginError("", "?error=auth")).toBe("failed");
  });

  it.each([
    ["?error=xyz", "auth 以外の値"],
    ["?error=", "値が空"],
  ])("E-5: 「%s」（%s）→ その他の失敗", (search) => {
    expect(detectLoginError("", search)).toBe("failed");
  });

  it("E-5: 「?error」（= なし）→ その他の失敗", () => {
    expect(detectLoginError("", "?error")).toBe("failed");
  });

  it("E-5: ?next=/x だけ → エラーなし", () => {
    expect(detectLoginError("", "?next=/x")).toBe("none");
  });

  it("E-5: #foo=bar と ?error=auth → その他の失敗（? の error で判定）", () => {
    expect(detectLoginError("#foo=bar", "?error=auth")).toBe("failed");
  });
});

describe("S-4: URL から # 以降全部とクエリの error だけを消す", () => {
  it("S-4: /login?error=auth → /login", () => {
    expect(urlWithoutLoginError("/login", "?error=auth")).toBe("/login");
  });

  it("S-4: ほかのクエリは残す（?next=/x&error=auth → /login?next=/x）", () => {
    expect(urlWithoutLoginError("/login", "?next=/x&error=auth")).toBe("/login?next=/x");
  });

  it("S-4: error が無ければクエリはそのまま（?next=/x → /login?next=/x）", () => {
    expect(urlWithoutLoginError("/login", "?next=/x")).toBe("/login?next=/x");
  });

  it("S-4: キーが error のものだけを消す（?errorx=1&error=auth → /login?errorx=1）", () => {
    expect(urlWithoutLoginError("/login", "?errorx=1&error=auth")).toBe("/login?errorx=1");
  });

  it("S-4: = の無い error も消す（?error → /login）", () => {
    expect(urlWithoutLoginError("/login", "?error")).toBe("/login");
  });

  it("S-4: error が先頭（?error=auth&next=/x → /login?next=/x）", () => {
    expect(urlWithoutLoginError("/login", "?error=auth&next=/x")).toBe("/login?next=/x");
  });

  it("S-4: error が2つ（?error=a&next=/x&error=b → /login?next=/x）", () => {
    expect(urlWithoutLoginError("/login", "?error=a&next=/x&error=b")).toBe("/login?next=/x");
  });

  it("S-4: クエリなし → /login", () => {
    expect(urlWithoutLoginError("/login", "")).toBe("/login");
  });
});
