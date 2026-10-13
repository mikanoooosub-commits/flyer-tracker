// ログイン画面の URL に付いて戻ってきたエラーを判定する（WO-006 S-4・S-5）。
// Google ログインで拒否されたときのエラーは URL の「#」以降で届くため、ブラウザ側で読む。
// 画面から切り離した純粋な関数にして、自動テストで確かめる。

/** none: エラーなし / not_registered: 拒否（未登録） / failed: ログインの失敗（その他） */
export type LoginError = "none" | "not_registered" | "failed";

/**
 * location.hash と location.search の文字列からエラーを判定する。
 * 判定はキーの有無で決める（値が空でもキーがあれば「ある」とする）。
 * 優先順位: ①拒否（未登録）→ ②ログインの失敗（その他）→ ③エラーなし。
 */
export function detectLoginError(hash: string, search: string): LoginError {
  // URLSearchParams は先頭の「?」は外すが「#」は外さないため、どちらも自分で外す。
  // 壊れた形（% の後が不正など）でも例外を出さずに読める。
  const hashParams = new URLSearchParams(hash.replace(/^#/, ""));
  const searchParams = new URLSearchParams(search.replace(/^\?/, ""));

  // 実際の拒否は ?error=auth と #…error_code=signup_disabled の両方を持つので、先に見る（WO-005 T-1）
  if (hashParams.get("error_code") === "signup_disabled") return "not_registered";
  if (hashParams.has("error") || hashParams.has("error_code")) return "failed";
  if (searchParams.has("error")) return "failed";
  return "none";
}

/**
 * エラーを読んだ後の URL を返す（history.replaceState に渡す）。
 * 「#」以降は全部消し、クエリは error だけを消してほかは残す。
 * 再読み込みで同じエラーが出続けないようにするため。
 */
export function urlWithoutLoginError(pathname: string, search: string): string {
  // URLSearchParams で組み立て直すと残すクエリの書き方まで変わる（「/」が「%2F」になる等）ため、
  // 「&」で区切った元の文字列のまま、キーが error の部分だけを除く。
  // キーの読み方は判定（detectLoginError）と同じ URLSearchParams に任せる。
  const kept = search
    .replace(/^\?/, "")
    .split("&")
    .filter((part) => part !== "" && !new URLSearchParams(part).has("error"));
  return kept.length > 0 ? `${pathname}?${kept.join("&")}` : pathname;
}
