// クールダウン日数の設定（WO-004）。
// 画面・DB から切り離した純粋な関数と定数だけを置く（自動テストの対象。`cooldown-setting.test.ts`）。
// 日数そのもの（運用で変える値）は DB の app_settings にだけ持ち、ここには書かない（WO-004 S-4）。

/** 入力として受け付ける範囲。入力ミスを防ぐルールなので定数にしてよい（WO-004 Q-3）。DB の CHECK と揃える */
export const COOLDOWN_DAYS_MIN = 1;
export const COOLDOWN_DAYS_MAX = 365;

/** 検証で弾いたときのエラー文（S-5。1つにそろえる） */
export const COOLDOWN_DAYS_INPUT_ERROR = "1〜365 の整数で入力してください";
/** 保存できなかったときのエラー文（S-8。DB の生のエラー文は画面に出さない） */
export const COOLDOWN_DAYS_SAVE_ERROR = "保存できませんでした。時間をおいてやり直してください";
/** 設定の行が読めないときのエラー文（前提・不変条件） */
export const COOLDOWN_DAYS_LOAD_ERROR =
  "クールダウンの日数を読み込めなかったため、クールダウンを表示できません";

export type ParseCooldownDaysResult = { ok: true; days: number } | { ok: false; error: string };

/** 全角数字（０〜９）だけを半角に直す。丸数字などは変えない（文字全体の正規化は使わない。S-5 手順2） */
function toHalfWidthDigits(text: string): string {
  return text.replace(/[０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0));
}

/**
 * 画面から送られた日数の入力を検証する（S-5）。
 * Server Action にはブラウザから任意の値が届きうるので、引数は unknown で受ける。
 * 判定の順: 文字列か → 前後の空白（全角を含む）を除く → 全角数字を半角に → 半角数字だけか → 範囲
 */
export function parseCooldownDays(input: unknown): ParseCooldownDaysResult {
  const fail: ParseCooldownDaysResult = { ok: false, error: COOLDOWN_DAYS_INPUT_ERROR };

  if (typeof input !== "string") return fail;

  // String.prototype.trim は全角空白（U+3000）も取り除く
  const digits = toHalfWidthDigits(input.trim());
  if (!/^[0-9]+$/.test(digits)) return fail;

  const days = Number(digits); // 先頭のゼロは受け付ける（"090" → 90）
  if (days < COOLDOWN_DAYS_MIN || days > COOLDOWN_DAYS_MAX) return fail;

  return { ok: true, days };
}
