# WO-006 報告: ログイン画面に「Google でログイン」を追加
- 状態: **受入待ち**（オーナーの手動確認が残っている。「PM に判断を求める点」1）
- コードレビュー: 1回で収束（高・中なし。低2件は対応済み）
- 実施日: 2026-10-13 / 実施: WO スレ
- 環境: ローカル `npm run dev`（**ポート 3000**）→ 本番 Supabase。ブラウザは内蔵ブラウザ。

## やったこと
1. Red Gate: `src/lib/auth-error.test.ts`（21本）を先に書き、スタブ（誤った値を返すだけ）の状態で `npx vitest run` → **21本すべて失敗**を確認（下表）。
   手動の行を `docs/テスト仕様書.md` に A-09〜A-20 として先に追加（期待結果まで）。
2. `src/lib/auth-error.ts` に判定の純粋な関数 `detectLoginError(hash, search)` と、URL の掃除 `urlWithoutLoginError(pathname, search)` を実装 → 21本とも通過。
3. Google のブランドの決まりを確認し、`src/components/google-logo.tsx`（公式の G）を作り、`src/app/login/page.tsx` にボタン（S-1・S-2）とエラー表示（S-4）を追加。
4. ローカル（ポート 3000）で手動確認とスクショ。その中で **URL の掃除が後で元に戻る不具合**を見つけて直した（下の「動作確認」4）。

## Red Gate の記録（実装前・スタブで実行）
`Tests 21 failed (21)`。失敗したテスト:
- E-10: ?error=auth と #…error_code=signup_disabled の両方 → 拒否（未登録）
- S-5: #error_code=signup_disabled だけ → 拒否（未登録）
- E-5（# 側・その他の失敗）: `#error`・`#error=`・`#error_code=`・`#error_code=foo`・`#error=x&error_code=other`
- E-5（# 側・エラーなし）: `#=&`・`#foo=bar`・`#`・`""`
- E-5: 壊れた % を含む `#error=%E0%A4%A` → その他の失敗（例外を出さない）
- E-6 / E-14: `?error=auth` だけ → その他の失敗
- E-5（? 側）: `?error=xyz`・`?error=` → その他の失敗／`?next=/x` → エラーなし／`#foo=bar` と `?error=auth` → その他の失敗
- S-4（URL の掃除）: `?error=auth` → `/login`／`?next=/x&error=auth` → `/login?next=/x`／`?next=/x` → そのまま／クエリなし → `/login`
失敗の理由は判定が `expected 'invalid' to be ...`、掃除が `expected '' to be ...`（スタブの値）で、確かめたい比較そのもので落ちている。
実装後に一度 S-4 の2本が `/login?next=%2Fx` で失敗した（URLSearchParams で組み立て直すと残すクエリの書き方が変わる）。仕様「ほかのクエリは残す」に合わせ、元の文字列のまま `error` の部分だけ除く形に直して通過。

## S-n / E-n の達成状況
| ID | 状況 | 確かめ方・結果 |
|---|---|---|
| S-1 | ✅ | 375px で実測: カードの下・デモのチェックの上。高さ 52px（「ログイン」と同じ `size="lg"`）、幅 327px（カードと同じ）、横スクロールなし。パスワード・メールリンク入力の表示で実測。送信済みの表示はメール送信が要るため実測せず、ボタンをカードの外に条件なしで置いているコードで確認。SS-1 |
| S-2 | ✅（一部オーナー確認待ち） | 押すと「Google に移動中…」で押せなくなり、Google のアカウント選択に移った（`redirect_to=http://localhost:3000/auth/confirm`）。エラー時に戻す処理・`pageshow` の `persisted` で戻す処理はコード（E-11・E-12） |
| S-3 | 未（オーナー確認待ち） | A-10。`route.ts` は変えていない（差分なし） |
| S-4 | ✅ | 自動テスト＋実測: 拒否の URL を開くと文が出て、URL は `/login`（`?next=/x` は残る）。URL の値は画面に出さず決まった2文だけ。消す契機: メールリンクの送信（Enter 送信と同じ onSubmit）で消え、モード切替では消えないことを実測 |
| S-5 | ✅ | `src/lib/auth-error.ts` の純粋な関数。自動テスト26本（Red Gate 時21本＋レビュー R-1 で5本） |
| S-6 | 未（オーナー確認待ち） | A-18。デモの仕組みは変えていない（`demo.ts` 差分なし） |
| S-7 | ✅ | 既存のフォームのコード・文言は変えていない（追加はエラー文を消す1行ずつだけ）。`?error=auth` で文が出るのは仕様どおり（A-14 OK） |
| S-8 | 対象外（本番反映時） | — |
| E-1 | 未（オーナー確認待ち） | A-11。表示は WO-005 の実際の URL を直接開いて確認済み（SS-2）。サブの Gmail での実地とユーザー件数はオーナーの操作が要る |
| E-2 | 未（オーナー確認待ち） | A-10 |
| E-3 | 未（オーナー確認待ち） | A-13 |
| E-4 | ✅ | A-12 OK |
| E-5 / E-6 / E-10 / E-14 | ✅ | 自動テスト。E-10・E-14 は画面でも実測 |
| E-7 | ✅（コード）／オーナー確認待ち | ボタンを JS で続けて2回 click → Google の画面へ移った。2回目は `useRef` のフラグで止まる（state の反映前でも効く）。「1回だけ移動」の数え上げは内蔵ブラウザではできないので A-15 で |
| E-8 / E-9 | 未（オーナー確認待ち） | A-18・A-19 |
| E-11 | ✅（コード） | `signInWithOAuth` が error を返すか例外のとき、フラグを戻し「ログインに失敗しました。…」を Google ボタンの下に出す。通信エラーは作れないのでコードで確認（検証方針どおり） |
| E-12 | 一部 ✅ | Google の画面から「戻る」→ ボタンは押せる状態。ただし内蔵ブラウザではページの保存からの復元ではなく読み直しだった（`performance` の navigation type が `navigate`）ため、`persisted` の分岐自体は通っていない。スマホで A-16 を要確認 |
| E-13 | 一部 ✅ | 消す契機（S-4）の実測のとおり。誤ったパスワードでの確認は、パスワードを本番の Supabase に送ることになるので行っていない（A-17 をオーナーに） |
| SS-1 / SS-2 | ✅ | 下の「スクショ」 |

## 変更したファイル
- 新規: `src/lib/auth-error.ts`、`src/lib/auth-error.test.ts`、`src/components/google-logo.tsx`、`docs/screenshots/WO-006/*.png`（2枚）、`work-orders/WO-006-report.md`
- 変更: `src/app/login/page.tsx`、`docs/テスト仕様書.md`（A-09〜A-20 を追加、確かめた行の結果を記入）
- 変えていない: `route.ts`、`supabase/*`、`demo.ts`、`.env*`（`git status` で確認）

## 動作確認
1. `npx tsc --noEmit` 通過、`npm run lint` 通過、`npm test` 119 passed（既存 93＋新規 26。レビュー R-1 で5本追加）。
2. dev サーバーはポート 3000 で起動（launch.json の `dev`）。ローカルのブラウザは前回のデモ表示のログインが残っていたので、ログアウトしてから確認。
3. 拒否・その他の失敗の URL は、WO-005 で観測した URL を内蔵ブラウザで直接開いて確かめた（Google の画面での操作は行っていない）。
4. **見つけて直した不具合（実装中・未コミット）**: 最初の実装は effect の中で直接 `history.replaceState` を呼んでいた。
   この方法だと、表示直後は URL が消えるが、**その後 Next.js のルーターが動くと（例: `router.refresh()`）エラー付きの URL に戻る**ことを実測した（戻った状態で再読み込みすると E-4 が破れる）。
   原因: Next.js 15.5 は `history.replaceState` をルーターと同期させる差し替えを AppRouter（親）の `useEffect` で入れる（`node_modules/next/dist/client/components/app-router.js`）。
   初回の描画では子（ログイン画面）の effect の方が先に走るため、差し替え前の replaceState が呼ばれ、ルーターは元の URL を覚えたままになる。
   直し方: URL を消す処理だけを `setTimeout(…, 0)` で、その描画の effect が全部終わった後に回した（エラー文の判定・表示はそのまま）。
   直した後: 拒否の URL → `/login?next=/x`、`history.state` に Next.js の情報が残り、`router.refresh()` の後も `/login?next=/x` のまま・エラー文も残る。再読み込みでエラー文なし。

## Google のブランドの決まり（S-1）
- 出典: Google「Sign in with Google branding guidelines」https://developers.google.com/identity/branding-guidelines （2026-10-13 に確認）
- 守ったこと: 標準の4色の G を白地の上に置く／G の色・形は変えない（縦横比を保って 20px に）／文言は「Sign in with Google」の日本語化（ガイドラインはアプリの言語への翻訳を認めている）／ライトのテーマの色（地 #FFFFFF・枠 #747775 の 1px・文字 #1F1F1F）。
- G の SVG: Google Identity Services が描画するボタンの SVG と同じ4つのパス（`#EA4335`・`#4285F4`・`#FBBC05`・`#34A853`）を写した。配布の zip（signin-assets.zip）はダウンロードしていないので、zip の中のファイルとの一字一句の照合はしていない（判断してほしい点 2）。
- ガイドラインと合わない点（S-1 の決まりどおり既存に合わせた）:
  - 書体: ガイドラインは Google Sans Medium 14/20。アプリの既存の書体・太字・16px（`size="lg"`）のまま（新しいフォントは足さない）。
  - 高さ・角丸: 52px・角丸 16px（既存の「ログイン」と同じ）。ガイドラインの既定の高さ（40px 程度）・形とは違う（拡大は「縦横比を保てば可」）。
  - 余白: ガイドラインは G の左 12px・G と文字の間 10px・文字の右 12px。カードと同じ幅にしたため、G と文字を中央に寄せて置いている（G と文字の間は 8px）。
  - ホバー時の色: ガイドラインに指定がないため #F2F2F2（ガイドラインのニュートラルの地の色）にした。

## スクショ（375px）と S-n との見比べ
| ファイル | 写っているもの |
|---|---|
| `docs/screenshots/WO-006/login-google-mobile.png` | パスワードの画面。カード → 「Google でログイン」→ デモのチェックの順 |
| `docs/screenshots/WO-006/login-google-error-mobile.png` | 拒否の URL を開いたとき。Google ボタンのすぐ下に「このメールアドレスは登録されていません。管理者に招待を依頼してください。」 |
- S-1: 位置（カードの下・デモの上）、幅（カードと同じ）、高さ（「ログイン」と同じ）、G のロゴ＋文言 → **一致**
- S-4: 表示位置（Google ボタンのすぐ下）、文言（メールリンクと同じ文）、2行で折り返して省略なし → **一致**
- メールアドレス・ユーザー ID は写っていない（入力欄は空、ログイン前の画面）。
- 撮影は内蔵ブラウザの画面撮影を PNG にし、下端（開発用のアイコン）を切った。1回、撮影が拡大されて右端が切れたので撮り直した（レイアウトは実測で 375px に収まっていた）。

## オーナーにお願いしたい手動確認（テスト仕様書の結果欄が空の行）
ポート 3000 の `npm run dev` で、次をお願いしたい（Google の画面での選択はオーナーの操作が要るため）。
- A-10（E-2 メインの Gmail で入れる）・A-11（E-1 サブの Gmail で拒否の文）・A-13（E-3 キャンセル。戻った URL に何が付いたかを記録）・A-15（E-7）・A-16（E-12 スマホで「戻る」）・A-17（E-13 誤ったパスワード）・A-18（E-8 デモの有無）・A-19（E-9）・A-20（設定2つがオフ。日付）
- A-10・A-11 の後に、読むだけの SQL でユーザー件数（WO-005 と同じ件数だけ）。値・メールは report に書かない。

## 見つかった不具合
- 実装中に自分で見つけて直したもの（上の「動作確認」4）。未リリースのコードなのでバグ管理表には載せていない。

## 仕様の穴
- なし。

## PM に判断を求める点
1. オーナーの手動確認（上の一覧）が終わっていない。受入の前にお願いする形でよいか。
2. G のロゴの SVG は、GIS が描くボタンの SVG のパスを写したもので、配布の zip とは照合していない。照合が要るなら zip のダウンロードの許可をもらって行う。
3. URL を消す処理を `setTimeout(…, 0)` で遅らせている（理由は「動作確認」4）。Next.js の内部の順序に頼る直し方なので、Next.js の更新で変わる可能性がある（その場合も表示は正しく、URL が残るだけ）。

## レビュー指摘（第1回・2026-10-13）
批判役（サブエージェント）。読んだもの: `WO-006-google-login.md`、本 report、`git diff`（`src/app/login/page.tsx`・`docs/テスト仕様書.md`）、新規 `src/lib/auth-error.ts`・`auth-error.test.ts`・`src/components/google-logo.tsx`、スクショ2枚、関連する `route.ts`・`middleware.ts`・`button.tsx`。`npx vitest run src/lib/auth-error.test.ts` は 21 passed を確認。

仕様との一致（コードで見た範囲）:
- S-1 ✅（カードの外・デモの上に条件なしで配置。`size="lg"`＝h-13 で「ログイン」と同じ。`border`/`border-2` は tailwind-merge で 1px に解決）
- S-2 ✅（ref＋state で二重押し防止、error/例外で戻す、`pageshow` の `persisted` で戻す）／S-3 ✅（`route.ts` 差分なし）
- S-4 ✅（決まった2文のみ表示・URL の値は出さない。消す契機はパスワード／メールリンクの onSubmit と Google ボタン。モード切替では消さない）
- S-5 ✅／S-6 ✅（`demo.ts` 差分なし）／S-7 ✅（既存の文言・表示に変更なし）
- E-5・E-6・E-10・E-14 ✅（自動テスト）。E-7・E-11・E-12 はコード上は仕様どおり
- DB・RLS・監査ログ・デモのスキーマ分離: 影響なし（`supabase/*` 差分なし）。秘密情報: クライアントに出ていない（`redirectTo` は origin から組み立て）
- スクショ: ログイン前の画面で入力欄は空。本番データ・メールアドレス・実在地名は写っていない

- R-1【低】【テストの穴】対象: `src/lib/auth-error.test.ts`（S-4 の URL の掃除）
  何が起きるか: `urlWithoutLoginError` のテストは4本で、「キーが error のものだけを消す」境目を突いていない。
  例えば filter を `!part.startsWith("error")` のような文字列の前方一致に書き換えても4本とも通る（その場合 `?errorx=1` のような別のクエリまで消える）。
  今の実装（`URLSearchParams(part).has("error")`）は正しく動くが、テストがそれを固定していない。`detectLoginError` 側も `?error`（`=` なし）は未テスト。
  直し方の案: 固定値の期待で次を足す。`?errorx=1` → `/login?errorx=1`（残す）／`?error` → `/login`／`?error=auth&next=/x` → `/login?next=/x`（error が先頭）／`?error=a&error=b&next=/x` → `/login?next=/x`。`detectLoginError("", "?error")` → その他の失敗。
- R-2【低】【実装の不備】対象: `src/app/login/page.tsx` の URL を消す effect（`setTimeout(…, 0)`）
  何が起きるか: report「PM に判断を求める点」3 のとおり、Next.js が `history.replaceState` を差し替える順序に頼っている。Next.js の更新で順序が変わると、ルーターが動いた後に URL がエラー付きに戻り、再読み込みでエラー文が出る（E-4 が破れる）。
  一方、テスト仕様書 A-12 は「拒否の URL を開く → すぐ再読み込み」なので、この戻りが起きても**通ってしまう**（実装中に見つかった不具合も、最初の掃除は効いていて `router.refresh()` の後で初めて戻った）。回帰を見つける手段が今は無い。
  なお、ログイン画面ではパスワードのログインが `window.location.href`、デモのチェックが cookie だけなので、実運用でルーターが動く場面は少なく、影響は小さい。
  直し方の案: (a) A-12 の手順に「エラー文が出た後、開発者ツールで `history.state` に Next.js の情報が残り、URL が戻らないこと」等の確かめ方を足すか、Next.js を上げるときの確認項目として report／README に残す。(b) 今の作りを受け入れ、PM 判断点3 の記録で足りるとする。どちらにするかは PM が決める。

仕様の穴: なし。

### 第1回への対応（WO スレ・2026-10-13）
- R-1【低・テストの穴】→ **対応**。指摘の案どおり固定値のテストを5本追加: `urlWithoutLoginError` に `?errorx=1&error=auth` → `/login?errorx=1`／`?error` → `/login`／`?error=auth&next=/x` → `/login?next=/x`／`?error=a&next=/x&error=b` → `/login?next=/x`、`detectLoginError("", "?error")` → その他の失敗。
  今の実装は正しいので追加分は最初から通る（実装を直す必要はない。前方一致などに書き換えたときに落ちる見張りとして足した）。`npm test` 119 passed。
- R-2【低・実装の不備】→ **(a) で対応**。テスト仕様書 A-12 の手順に「エラー文が出た後に `next.router.refresh()` を実行し、URL が戻らないことを見る（Next.js を上げたときも行う）」を足した。
  実装中にこの手順で不具合（直す前は URL が戻る）を再現し、直した後は戻らないことを確かめているので、A-12 の結果欄にもそれを書いた。`setTimeout` の作り自体は変えていない（PM 判断点3 は残す）。
- 高・中が無いため、ROLE-implementer 手順8 によりレビューは第1回で終了。
