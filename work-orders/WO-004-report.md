# WO-004 報告: クールダウンの日数を小学校マスタから変えられるようにする
- 状態: **受入待ち**（コードレビュー3回で収束。高・中なし）
- 実装: WOスレ（2026-10-12）
- 対象 WO: `work-orders/WO-004-cooldown-setting.md`（仕様承認 2026-10-12）

## やったこと
1. テスト先行: `src/lib/cooldown-setting.test.ts`（S-5・E-1・E-2）を書き、検証関数をスタブにして全部失敗することを確認（Red Gate）。E-7 の回帰テストを `cooldown.test.ts` に追加。手動項目を `docs/テスト仕様書.md` に先に追加（A-08、E-12〜E-24）。
2. 入力値の検証関数 `parseCooldownDays`（`src/lib/cooldown-setting.ts`）を実装してテストを通した。
3. DB: 設定テーブル `app_settings`（1行）を `schema.sql`・`schema_demo.sql` に冪等に追記。戻し SQL を用意。**demo で予行演習 → 適用 → 確認 → E-9 → オーナー承認 → public で予行演習 → 適用 → 確認**（SQL Editor で実施。結果は下の「DB」）。
4. `queries.ts` に `getCooldownDays`、`actions.ts` に `updateCooldownDaysAction` を追加。`schools/page.tsx` が DB の日数を判定に渡す。`COOLDOWN_DAYS` を廃止。
5. 小学校マスタの先頭に「クールダウン: N日」と「変更」ダイアログ（`src/components/schools/cooldown-setting.tsx`）。
6. デモ表示モードで手動確認（テスト仕様書の行）と SS-1 の撮影。

## Red Gate の記録（実装前）
`parseCooldownDays` を「常に `{ ok: false, error: "" }` を返す」スタブにして `npx vitest run`:
- `src/lib/cooldown-setting.test.ts` の **27件すべて失敗**（Tests 27 failed | 66 passed (93)）。
  - E-1: 1・365・90 → 成功のはずが失敗／0・366・-1 → エラー文が "" で不一致（6件）
  - E-2 受け付ける: 「９０」「9０」「 90 」「　90　」「090」（5件）
  - E-2 弾く: 「90.5」「+90」「-0」「1e2」「9,0」「9 0」「⑨⓪」「90日」「九十」「」「   」「　」、数値 90・null・undefined・["90"]（16件）。弾く側はエラー文「1〜365 の整数で入力してください」まで比べているので、スタブ（エラー文 ""）では失敗する。
- E-7 の回帰テスト（`cooldown.test.ts` の「WO-004 E-7」2件）は**実装前から通る**（WO の検証方針どおり Red Gate の対象外。判定関数は前から日数を引数で受けるため）。

## S-n / E-n の達成状況
| ID | 状況 | 確かめ方 |
|---|---|---|
| S-1 | ✅ | テスト仕様書 E-12・E-24。ページ先頭（追加フォームより上）に「クールダウン: 90日」と「変更」（`Button size="sm" variant="outline"`、高さ 36px＝学校の行の「編集」と同じ）。375px で1行。0校のときは E-13（下記） |
| S-2 | ✅ | E-14・E-15・E-19・E-20。初期値＝表示中の日数、保存で閉じる、キャンセルで何も変えない。開くたびに入力欄を表示中の日数に戻しエラー文を消す（`handleOpen`） |
| S-3 | ✅ | E-14: 60 で保存 → 正門前が「2027/1/10(日) から配布可」→「2026/12/11(金) から配布可」に、開き直さずに変わった |
| S-4 | ✅ | 下の「S-4 の検索結果」。`page.tsx` は `getCooldownDays()` の値だけを `getSpotStatus` に渡す（予備の値なし） |
| S-5 | ✅ | 自動テスト（E-1・E-2）。サーバーの `updateCooldownDaysAction` が `parseCooldownDays` で検証してから update。画面側に事前検証なし |
| S-6 | ✅ | E-23。E-01〜E-11 を再確認（E-02・E-08 はレビュー第1回 R-3 で追加実施。E-02 のうち「実績登録で中心表示」は未確認＝下の対応 R-3） |
| S-7 | ✅ | 記録の仕組みは作っていない（表は日数の列だけ） |
| S-8 | ✅ | コード: `.update(...).eq("id", true).select("id")` の返り行数が1でなければ、または error／例外なら「保存できませんでした。時間をおいてやり直してください」。生のエラーは `console.error` だけ |
| S-9 | ✅ | E-17: `type="text"`・`inputmode="numeric"`、「９０」が消えずに送られ 90 で保存 |
| S-10 | ✅ | E-18: 「90日」「366」で閉じずにダイアログ内にエラー文、入力値が残る |
| E-1 | ✅ | 自動テスト |
| E-2 | ✅ | 自動テスト（全入力）＋ E-17（画面から全角） |
| E-3 | ✅ | E-16: 90 のまま保存で Server Action の POST が出て閉じる（画面側で送信を省いていない） |
| E-4 | ✅ | E-21: 2タブで 60 → 45、45 が残る。保存したタブは保存後に、もう一方は開き直すと 45 |
| E-5 | ✅ | E-22: デモ表示モードの画面から 60 に保存 → SQL で public=90・demo=60。後で 90 に戻した |
| E-6 | ✅（コード） | 読めないときの4通り（下の「E-6 の分岐」）。画面では失敗を起こせないためコードで確認 |
| E-7 | ✅ | 回帰テスト（60 → 2026-12-11、90 → 2027-01-10）＋ E-14 の画面 |
| E-8 | ✅（コード） | S-8 と同じ分岐（0行も「1行でない」に入る） |
| E-9 | ✅ | DB: demo で 60 にしてから DDL を流し直し → 60 のまま（rollback で 90 に戻した） |
| SS-1 | ✅ | 下の「スクショ」 |

### E-6 の分岐（`page.tsx` → `school-manager.tsx`）
- `cooldownDays`（設定の行。読めなければ null）と `spotsLoadFailed`（実績・立ち位置の失敗）を**別々に**画面へ渡す。
- 立ち位置の欄（`spotsBySchool`）は「日数・実績・立ち位置がすべて読めた」ときだけ組み立てる。
| 設定 | 実績・立ち位置 | 先頭 | 立ち位置の欄 | WO-003 S-8 の文 |
|---|---|---|---|---|
| 読めた | 読めた | 日数＋「変更」 | 出す | 出さない |
| 読めた | 失敗 | 日数＋「変更」 | 出さない | 出す（追加フォームの下） |
| 失敗 | 読めた | 設定のエラー文 | 出さない | **出さない**（`spotsLoadFailed` が false） |
| 失敗 | 失敗 | 設定のエラー文 | 出さない | 出す（2文が並ぶ） |
- 学校の一覧と追加・編集・削除はどの場合も出る（分岐の外）。`getCooldownDays` は throw せず `{ ok: false }` を返す。

### S-4 の検索結果
- `grep -rnw "COOLDOWN_DAYS" src` → **0件**（範囲の定数は `COOLDOWN_DAYS_MIN`／`_MAX` という別名）。
- `cooldown.ts`・`cooldown-setting.ts`・`schools/page.tsx`・`components/schools/*.tsx`・`queries.ts`・`actions.ts` の「90」→ 1件だけ: `cooldown-setting.ts` のコメント `// 先頭のゼロは受け付ける（"090" → 90）`（入力例の説明で、日数の値ではない）。
- テストの入力値（`cooldown.test.ts` の `N = 90` 等）は対象外。DDL の初期値 90 は Q-3 で可。

## DB（SQL Editor で実施。オーナーがサインイン済みのブラウザで実装スレが流した）
### 設計（`db-change` に沿った判断）
- 表 `app_settings`（public・demo とも同じ）:
  - `id boolean primary key default true check (id)` … 主キーが true しか取れないので、**行は制約で1行に限られる**（権限とは別に守る）。true の2行目は主キーの重複、false は CHECK で止まる。
  - `cooldown_days integer not null check (cooldown_days between 1 and 365)` … 不変条件を DB でも守る。列の default は付けない（値は初期行で入れる）。
  - 初期行は `insert … values (true, 90) on conflict (id) do nothing`（流し直しで値を上書きしない）。
  - 名前を汎用の `app_settings` にしたのは、全校共通の設定を1行で持つ表という意味を名前に出すため（列は日数だけで、要件外の設定は足していない）。
- 権限: `revoke all … from anon, authenticated` → `grant select, update … to authenticated`。RLS 有効、ポリシーは select・update のみ（`to authenticated`）。
- 戻し SQL: `supabase/rollback/WO-004-app-settings-down.sql`。**コードを先に戻してから**流す（逆にすると本番の小学校マスタが「クールダウンの日数を読み込めなかった…」になる）。流す前に今の値を控える SELECT をファイル冒頭に書いた。流すのはオーナー。

### 実行と結果
0. 事前確認: `information_schema.tables` に `app_settings` が無いこと → 0行。
1. demo 予行演習（`begin; DDL; 確認; rollback;`）→ 下の確認がすべて OK。
2. demo 適用 → `demo.app_settings` 1行・90。
3. demo 確認（`begin; … rollback;` の中。`do` ブロックで例外を拾って結果を一時表に記録）:
   | No. | 確認 | 結果 |
   |---|---|---|
   | 1 | 0 に更新 | OK: CHECK で拒否 |
   | 2 | 366 に更新 | OK: CHECK で拒否 |
   | 3 | NULL に更新 | OK: NOT NULL で拒否 |
   | 4 | 2行目の insert（id=true）※管理者で実行 | OK: 主キーで拒否（＝権限ではなく制約で止まる） |
   | 5 | 2行目の insert（id=false）※管理者で実行 | OK: CHECK で拒否 |
   | 6 | 1・365 に更新 | OK: 通った |
   | 7 | 行数 | 1行 |
   | 8 | grants（anon・authenticated） | `authenticated:SELECT, authenticated:UPDATE`（anon なし） |
   | 9 | policies | `demo_app_settings_select:SELECT:authenticated, demo_app_settings_update:UPDATE:authenticated` |
   | 10 | RLS 有効 | true |
4. E-9（demo）: `update … = 60` → DDL を流し直し → `1行 / 60`（rollback で 90 のまま）。
5. **オーナー承認（2026-10-12）を得てから** public 予行演習 → 上の 1〜10 と同じくすべて OK（policies は `app_settings_select`／`app_settings_update`）。
6. public 適用 → 確認: public 1行・90、demo 1行・90、grants(public) `authenticated:SELECT, authenticated:UPDATE`、policies(public) select・update の2つ、RLS true。
- anon の拒否（A-08）: `.env.local` は読まない方針（オーナー指示）のため、anon キーで REST を叩く代わりに、SQL Editor で `begin; … rollback;` の中で**ロールを切り替えて実際に操作**した（レビュー第1回 R-2 で追加）:
  | No. | 確認 | 結果 |
  |---|---|---|
  | 1 | `set local role anon` → public.app_settings を select | OK: permission denied |
  | 2 | anon → demo.app_settings を select | OK: permission denied |
  | 3 | anon → public.app_settings を update | OK: permission denied |
  | 4〜7 | `set local role authenticated` → public・demo に insert／delete | すべて OK: permission denied |
  | 8 | 値（変わっていないこと） | public 90 / demo 90 |
  あわせて上の grants（anon の権限なし）とポリシー（authenticated のみ）。
- 最終状態: public=90、demo=90（手動確認で変えた値はすべて画面から 90 に戻し、E-5 の確認時に SQL で public=90 を確認）。

## 変更したファイル
- 新規: `src/lib/cooldown-setting.ts`、`src/lib/cooldown-setting.test.ts`、`src/components/schools/cooldown-setting.tsx`、`supabase/rollback/WO-004-app-settings-down.sql`、`docs/screenshots/WO-004/*.png`（3枚）、`work-orders/WO-004-report.md`
- 変更: `src/lib/cooldown.ts`（`COOLDOWN_DAYS` の削除のみ）、`src/lib/cooldown.test.ts`（E-7 の追加のみ）、`src/lib/types.ts`（`AppSettings`）、`src/lib/data/queries.ts`（`getCooldownDays` 追加）、`src/lib/data/actions.ts`（`updateCooldownDaysAction` 追加）、`src/app/(main)/schools/page.tsx`、`src/components/schools/school-manager.tsx`、`supabase/schema.sql`・`schema_demo.sql`（末尾に追記）、`docs/テスト仕様書.md`（A-08・E-12〜E-24）
- WO の範囲外: `.claude/launch.json` に `"autoPort": true` を追加（下の「PM に判断を求める点」2）

## 動作確認の方法と結果
- `npx tsc --noEmit` エラーなし／`npm run lint` エラーなし／`npm test` 93 passed（3ファイル）。
- `npm run dev`（内蔵ブラウザ・**デモ表示モード**、ポート 59030）。サーバーログ・ブラウザのコンソールにエラーなし。
- テスト仕様書 A-08・E-12〜E-24 の結果欄を記入（E-13 は未、E-23 は一部。理由は各行）。

## スクショ（デモ表示モード・375px）と S-n との見比べ
| ファイル | 写っているもの |
|---|---|
| `docs/screenshots/WO-004/schools-cooldown-setting-mobile.png` | ページ先頭の「クールダウン: 90日」と「変更」、その下の追加フォーム、学校カード |
| `docs/screenshots/WO-004/schools-cooldown-dialog-mobile.png` | 「変更」ダイアログ（見出し・「日数（1〜365）」・初期値 90・キャンセル／保存する） |
| `docs/screenshots/WO-004/schools-cooldown-dialog-error-mobile.png` | 「90日」で保存したとき: ダイアログが開いたまま、入力値が残り、「1〜365 の整数で入力してください」 |
- S-1: 追加フォームより上・1行・「変更」は「編集」と同じ大きさのボタン → **一致**
- S-2: 初期値は表示中の日数、キャンセル・保存のボタン → **一致**
- S-10: 失敗時に閉じず中にエラー文・値が残る → **一致**
- 撮影は内蔵ブラウザの画面撮影を PNG にし、下端（固定ナビと開発用アイコン）を切った。写っている学校はデモのシードの架空校だけ。

## 見つかった不具合
- なし。

## 仕様の穴に気づいたら
- なし。

## PM に判断を求める点
1. **E-13（0校でも表示）を画面で確かめていない**: デモには学校があり、0校の状態を作るには紐づく立ち位置ごと消す必要がある（既存機能では消せない）。表示が学校の数の分岐より前にあることはコードで確認した。このままでよいか。
2. **`.claude/launch.json` に `"autoPort": true` を足した**（WO の「触ってよいファイル」の外）: ポート 3000 を別のアプリ（このプロジェクトではない dev サーバー）が使っていたため、プレビューが空いているポートで起動できるようにした。アプリのコードには影響しない。残すか戻すか決めてほしい。
3. 本番反映の順番（WO 前提）: **public には DDL を適用済み**なので、受入後はコードを push してよい状態。戻すときはコードを先に戻してから `supabase/rollback/WO-004-app-settings-down.sql`。
4. 既知の軽微（範囲外のため触っていない）: `getSchools()` の `select("*")` はそのまま。

## レビュー指摘（第1回・2026-10-12）
根拠に読んだもの: `work-orders/ROLE-reviewer.md`、`WO-004-cooldown-setting.md`、本 report、`git diff`（`src/`・`supabase/`・`docs/テスト仕様書.md`・`.claude/launch.json`）、
新規ファイル `src/lib/cooldown-setting.ts`・`cooldown-setting.test.ts`・`src/components/schools/cooldown-setting.tsx`・`supabase/rollback/WO-004-app-settings-down.sql`、スクショ3枚のうち2枚。
こちらでも `npx vitest run`（93 passed）・`npx tsc --noEmit`（エラーなし）・`COOLDOWN_DAYS` の検索（範囲の定数以外 0件）を確認した。

仕様との一致（コードで確認）: S-1〜S-10・E-1〜E-9 の実装は仕様どおり。特に
E-6 の4通り（`cooldownDays` と `spotsLoadFailed` を別々に渡し、「設定だけ失敗」で WO-003 S-8 の文が出ない）、
S-8（`.select("id")` の行数が1でなければ定型文。生のエラーはログだけ）、S-5（`unknown` で受け、全角は `０`〜`９` だけを置換、`trim` で全角空白も除去）、
S-2（`handleOpen` で開くたびに表示中の日数・エラー文を消す）、DB（主キー true 固定＋CHECK で1行・1〜365・NOT NULL、`on conflict do nothing`、revoke→select/update のみ grant、ポリシー select/update のみ、public・demo 同一、戻し SQL に順番の注意）を確認。
テストは期待値を仕様の文言・値で直接書いており（実装の定数を使っていない）、Red Gate の記録もある。スクショはデモ表示モード・架空校のみ。

- R-1【低】【テストの穴】対象: `docs/テスト仕様書.md` A-08・E-12〜E-24
  何が起きるか: 追加した行が「期待結果 || 結果」と `|` が2つ続いていて、セルが7つになっている（見出しは6列）。Markdown の表では余ったセルは捨てられるため、**6列目「結果」は空欄に、OK・未などの記録は表示されない**（GitHub 等で見ると全行が未実施に見える）。
  直し方の案: 各行の `||` を `|` に直す（A-08 と E-12〜E-24 の 14 行）。

- R-2【中】【テストの穴】対象: 検証方針「RLS」・受入基準「RLS（anon 拒否）を確認済み」・テスト仕様書 A-08
  何が起きるか: 検証方針は「手動（anon キーで新テーブルを読もうとして拒否される。テスト仕様書 No.A-04 の手順）」だが、実施したのは SQL Editor での grants・ポリシーの確認で、**anon で実際に読んで拒否される確認はしていない**（report「anon の拒否（A-08）: `.env.local` は読まず…」）。grants に anon が無いことは強い根拠だが、検証方針の確かめ方と違う。A-08 の行も、A-04 の形（REST を anon キーで叩く）ではなく SQL の確認に書き換わっている。
  直し方の案: A-04 と同じ手順で `/rest/v1/app_settings?select=cooldown_days` を anon キーで叩き（demo は `Accept-Profile: demo` も）、拒否（401／permission denied）を記録する。キーの扱いは anon キーなので公開してよい範囲だが、`.env.local` を読みたくない理由があるなら、オーナーに叩いてもらうか、grants 確認での代替を PM に判断してもらう（その場合は「代替した」ことを report の S-n 表に書く）。

- R-3【中】【テストの穴】対象: 受入基準「既存機能を壊していない（No.E-01〜E-11）」・S-6・テスト仕様書 E-23
  何が起きるか: E-02（位置の編集）・E-08（実績の登録・削除）を「本 WO で触っていない処理」として未再確認のまま。ただし E-02 の画面は今回 props と描画を変えた `school-manager.tsx` の中にあり、E-08 は立ち位置の欄（今回 `spotsBySchool` の組み立て条件を変えた）の表示に効く。受入基準は E-01〜E-11 の全部を求めている。
  直し方の案: デモ表示モード・日数 90 で E-02・E-08 を実施して E-23 の結果欄を埋める（E-08 で実績を足したら消して元に戻す）。

- R-4【低】【テストの穴】対象: S-1「学校が0校のときも表示」・テスト仕様書 E-13
  何が起きるか: 画面では未確認（PM に判断を求める点1 で上げ済み）。コードでは `CooldownSetting` が `schools.length === 0` の分岐より前・外にあり、0校でも描画されることは確認した（`school-manager.tsx` の先頭）。
  直し方の案: 追加の作業は不要と考える（純粋に描画位置の話でコードで確定できる）。PM が「コードレビューで確認」で受けるなら、E-13 の結果欄にその旨（「コードで確認・画面は未」）を残せば足りる。

- R-5【低】【実装の不備】対象: `.claude/launch.json`
  何が起きるか: WO の「触ってよいファイル」外の変更（`"autoPort": true` の追加と `runtimeArgs` の改行の整形）。アプリには影響しないが、範囲外の変更が WO のコミットに混ざる。`autoPort` が launch.json で効くキーかはこちらでは確認できていない。
  直し方の案: PM の判断（PM に判断を求める点2）。残すなら WO-004 のコミットと分けて別コミットにする。戻すなら `git checkout -- .claude/launch.json`。

仕様の穴: なし（実装から見えた未定義の振る舞いは見つからなかった）。
まとめ: 5件（高 0／中 2／低 3。テストの穴 4／実装の不備 1／仕様の穴 0）。コード本体（`src/`・`supabase/`）への指摘は無く、指摘はすべて確認・記録の側。

## レビュー第1回への対応（WOスレ・2026-10-12）
- R-1【低】【テストの穴】→ **直した**。原因は結果欄を書き込んだ自分のスクリプト（`| |` の置き換えで `|` が1つ余った）。A-08・E-12〜E-24 の14行を `|` 1つに直し、全行が6列（区切りで数えて8）になったことを確認。
- R-2【中】【テストの穴】→ **確認を足した**。オーナーの指示で `.env.local` は読まないため、anon キーで REST を叩く代わりに、SQL Editor で `set local role anon`／`authenticated` に切り替えて実際に select・update・insert・delete し、すべて permission denied になることを確かめた（`begin; … rollback;`。結果は「DB」の A-08 の表）。テスト仕様書 A-08 の手順・期待結果をこの形に書き直した。A-04 の形（REST）と違う点は A-08 に明記した。
- R-3【中】【テストの穴】→ **実施した**（デモ・日数 90）。
  - E-02: 架空校「ことり丘小学校」を追加 →「位置未設定」→ 編集で位置を保存 →「位置設定済み」・エラーなし → 削除。
    ただし E-02 の後半「実績登録時にその付近が中心表示」は、今の登録フォームが「既存の配布場所から選ぶ」形で、追加した学校の立ち位置が無いと選べないため未確認（登録フォームのコードは本 WO で触っていない）。
  - E-08: みどり第一・西側通りに今日・1枚・普通で登録 → 小学校マスタで「クールダウン中」「前回 2026/10/12(月)（今日）」「2027/1/10(日) から配布可」→ 一覧から削除（論理削除）→「配布可」「前回 2026/6/23(火)（111日前）」に戻った。
  - テスト仕様書 E-23 の結果欄を更新。
- R-4【低】【テストの穴】→ **見送り（PM 判断）**。E-13 の結果欄に「画面は未・コードで確認（R-4）」と書いた。0校の状態はデモでは作れない（立ち位置のある学校は既存機能で消せない）。
- R-5【低】【実装の不備】→ **見送り（PM 判断）**。`.claude/launch.json` の `autoPort` は、ポート 3000 を別アプリが使っていたためプレビューを起動するのに必要だった（プレビュー側が「autoPort を有効にした」と応答し、ポート 59030 で起動した）。残すなら WO-004 と別のコミットに、戻すなら `git checkout -- .claude/launch.json`。
- 対応後: `npx tsc --noEmit`・`npm run lint`・`npm test`（93 passed）は変化なし（コードは変えていない）。画面のコードを変えていないのでスクショは撮り直していない。

## レビュー指摘（第2回・2026-10-12）
根拠に読んだもの: `work-orders/ROLE-reviewer.md`、`WO-004-cooldown-setting.md`、本 report（第1回の指摘と対応を含む）、`git diff`（`src/`・`supabase/`・`docs/テスト仕様書.md`・`.claude/launch.json`）、
新規ファイル `src/lib/cooldown-setting.ts`・`cooldown-setting.test.ts`・`src/components/schools/cooldown-setting.tsx`・`supabase/rollback/WO-004-app-settings-down.sql`、スクショ2枚（先頭・エラー時）。
こちらでも `npx vitest run`（93 passed）を確認した。

第1回への対応の確認: R-1（テスト仕様書の `||`）は A-08・E-12〜E-24 とも `|` 1つに直っている。R-2（anon の拒否）は SQL のロール切替で実際に操作して permission denied を記録、A-08 に代替の旨あり。R-3（E-02・E-08）は E-23 に結果あり。R-4・R-5 は PM 判断待ちで report に残っている。
仕様との一致（S-1〜S-10・E-1〜E-9）、E-6 の4通りの出し分け、S-8 の行数確認、DB（1行の制約・CHECK・NOT NULL・`on conflict do nothing`・revoke→select/update・public/demo 同一・戻し SQL の順番）は第1回の確認から変わっていない（コードの差分に変化なし）。

- R-1【低】【実装の不備】対象: `src/components/schools/cooldown-setting.tsx` の `handleSave`
  何が起きるか: `startTransition` の中で `await updateCooldownDaysAction(...)` の後に `setOpen(false)`・`router.refresh()` を呼んでいる。`pending` は Server Action の完了で false に戻り、`router.refresh()` の再描画（新しい `days` が props に届く）を待たない。「変更」ボタンは `pending` で止めていないので、保存直後〜再表示までの短い間に「変更」を押すと、`handleOpen` が**古い日数**を入力欄に入れる。そのまま保存すると、S-2 が防ぎたい「保存後に開き直して古い値のまま保存し、黙って元に戻る」がわずかな時間だけ起こりうる（実際には数百ミリ秒の窓で、再表示後に開き直せば正しい値になる）。
  直し方の案: どちらか。(a) `router.refresh()` を `startTransition(() => router.refresh())` で包み、再表示が終わるまで「変更」ボタンを `disabled={pending}` にする。(b) 窓が十分短いので直さず、report に「既知の軽微」として残す。業務上の影響は小さいので (b) でもよい。

- R-2【低】【実装の不備】対象: `src/lib/types.ts` の `AppSettings`
  何が起きるか: 型 `AppSettings` を追加したが、どこからも使われていない（`src/` の検索で定義の1件だけ）。`getCooldownDays` は `unknown` で受けて実行時に確かめているので、型は DB スキーマとの対応表としての役目だけになっている。共通規約「型定義は1か所に集約し、DB スキーマと対応させる」には沿っているので誤りではないが、読む人が「どこで使うのか」を探すことになる。
  直し方の案: 型のコメントに「DB の表との対応を示す型。取得は `getCooldownDays` が列だけを読み、実行時に値を確かめる」と一言足す。または `getCooldownDays` の `select` の列名を `keyof AppSettings` と結び付ける程度に使う（凝った型にはしない）。そのままでも受入に支障はない。

仕様の穴: なし。
まとめ: 2件（高 0／中 0／低 2。実装の不備 2／テストの穴 0／仕様の穴 0）。第1回の中・低の指摘は対応済み（R-4・R-5 は PM 判断待ち）。指摘は低のみで、ひねり出すほどの残りは無い＝収束のサインと考える。

## レビュー第2回への対応（WOスレ・2026-10-12）
- R-1【低】【実装の不備】→ **直した**（S-2 が防ぎたい「古い値のまま保存して黙って元に戻る」事故そのものなので）。`cooldown-setting.tsx`: 保存成功後の `setOpen(false)`・`router.refresh()` を `startTransition` で包み直し（await の後の更新は元の transition に含まれないため）、`pending` の間は「変更」ボタンを押せなくした。
  確認（デモ・ブラウザで 50ms ごとに観測）: 保存を押してから約 0.85 秒、ダイアログは「保存中…」で開いたまま・「変更」は押せない・表示は 90 → 再表示と同時にダイアログが閉じ「60日」・「変更」が押せる。古い日数のまま「変更」が押せる瞬間は無かった。開き直すと初期値 60。その後 90 に戻した。
  見た目の違い: 成功時にダイアログが閉じるのが再表示の完了まで（今回は約 0.85 秒）遅れる。その間は「保存中…」が出ている。
  自動テストは無い（画面の部品のテストは WO-001 S-4 で範囲外）ため、上のブラウザでの確認で代えた。
- R-2【低】【実装の不備】→ **見送り**。`AppSettings` はどこからも使っていないが、共通規約「型定義は1か所に集約し DB スキーマと対応させる。列を足したら型も更新」に沿って DB の表と対応する型として置いている（既存の `Visit` 等と同じ扱い）。取得は列を1つだけ選び実行時に検査しているため、この型で `as` するより今の形が安全。
- 対応後: `npx tsc --noEmit`・`npm run lint`・`npm test`（93 passed）通過。画面の見た目（静止状態）は変わらないためスクショは撮り直していない。

## レビュー指摘（第3回・2026-10-12）
根拠に読んだもの: `work-orders/ROLE-reviewer.md`、`WO-004-cooldown-setting.md`、本 report（第1回・第2回の指摘と対応を含む）、`git diff`（`src/`・`supabase/`・`.claude/launch.json`）、
新規ファイル `src/lib/cooldown-setting.ts`・`cooldown-setting.test.ts`・`src/components/schools/cooldown-setting.tsx`・`supabase/rollback/WO-004-app-settings-down.sql`、`src/components/ui/dialog.tsx`（閉じるボタン）。
こちらでも `npx vitest run`（93 passed）を確認した。

第2回への対応の確認: R-1 は `cooldown-setting.tsx` で、保存成功後の `setOpen(false)`・`router.refresh()` を `startTransition` で包み直し、「変更」を `disabled={pending}` にしている（await の後の更新を transition で包み直すのは React 19 のやり方どおり）。保存中は `onOpenChange` が `!pending` のときだけ閉じるので、右上の×・Esc・外側のクリックでも閉じず、キャンセルも押せない。開き直したときに古い日数が入る窓は無くなった。R-2 の見送り理由（DB の表と対応する型として置く）は共通規約に沿っており、妥当。
仕様との一致（S-1〜S-10・E-1〜E-9）、E-6 の4通りの出し分け、S-8 の行数確認、DB（1行の制約・CHECK・NOT NULL・`on conflict do nothing`・revoke→select/update・public/demo 同一・戻し SQL の順番）は第1回・第2回の確認から変わっていない。

- R-1【低】【実装の不備】対象: 本 report の2行目「状態」
  何が起きるか: 「状態: **作業中**（コードレビュー前）」のままで、コードレビュー3回と対応が済んだ今の状態と食い違う。PM が受入の判断で report を読むとき、どこまで進んだかを取り違えるおそれがある。
  直し方の案: 中継文を出すときに、状態を「コードレビュー済み（3回）・受入待ち」などに直す。

仕様の穴: なし。
まとめ: 1件（高 0／中 0／低 1。実装の不備 1／テストの穴 0／仕様の穴 0）。コード本体（`src/`・`supabase/`）への指摘は無い。PM 判断待ちは第1回の R-4（E-13 は画面で未確認）と R-5（`.claude/launch.json`）の2件のまま。指摘をひねり出す段階に来ているので、収束と考える。

## レビュー第3回への対応（WOスレ・2026-10-12）
- R-1【低】→ **直した**。冒頭の状態を「受入待ち」に更新した。
- 収束: 第3回は低1件のみ（コード本体への指摘なし）。レビューは3回で終了。残りは PM 判断待ちの第1回 R-4（E-13 を画面で未確認）・R-5（`.claude/launch.json` の `autoPort`）。
