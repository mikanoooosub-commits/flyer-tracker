# WO-001 報告: 自動テスト基盤（Vitest）を導入する
- 報告日: 2026-10-09（追記 2026-10-10）/ 担当: 実装スレ / 状態: **受入待ち**（コードレビュー3回で収束：高・中なし。コミットはしていない）

## やったこと
1. Next.js 公式の Vitest 導入手順と Vitest / Vite 公式を確認してから設定を書いた（下の「参照した公式ドキュメント」）。
2. `vitest` を devDependencies に追加し、`vitest.config.mts` を新規作成（Node 環境・`@/*` 解決）。
3. `package.json` に `"test": "vitest run"` を追加（1回実行で終わる形）。
4. `src/lib/format.test.ts` を新規作成（10本。テスト名に E-n を記載）。
5. E-5（わざと失敗するテスト）で終了コードを確認し、削除した。
6. tsc / lint / test / build を実行し、すべて通過。
7. `README.md` のセットアップ手順に `npm test` の1行を追加。

## 追加した依存と版
| パッケージ | 指定 | 実際に入った版 | 区分 |
|---|---|---|---|
| `vitest` | `^4.1.11` | 4.1.11（内部で `vite@8.3.4`） | devDependencies |

**Vitest 5 ではなく 4 系にした理由**: 最新の `vitest@5.0.3` は peer 依存が `@types/node@"^22.0.0 || >=24.0.0"` で、
本プロジェクトの `@types/node@^20` と衝突して `npm install` が ERESOLVE で失敗した。
回避策は (a) `@types/node` を上げる（WO の範囲外・アプリ全体の型に影響）、(b) `--legacy-peer-deps`（不整合を黙認するので不可）、
(c) Vitest 4 系を使う、の3つで、(c) を選んだ。`vitest@4.1.11` は peer が `@types/node@"^20.0.0 || ^22.0.0 || >=24.0.0"`、
engines が `node@"^20.0.0 || ^22.0.0 || >=24.0.0"` で、現状の構成と整合する（`npm view vitest@4 peerDependencies engines` で確認）。
→ 「PM に判断を求める点」1 を参照。

**`vite-tsconfig-paths` を入れなかった理由**: Next.js 公式手順は `@/` 解決に `vite-tsconfig-paths` プラグインを使うが、
一度入れて実行したところ Vite 8 が「Vite now supports tsconfig paths resolution natively via the `resolve.tsconfigPaths` option.
You can remove the plugin」と警告した。Vite 公式（Shared Options）で `resolve.tsconfigPaths`（boolean、既定 false）を確認し、
こちらに切り替えてプラグインはアンインストールした（依存が1つ減る）。

Next 手順の `@vitejs/plugin-react` / `jsdom` / `@testing-library/*` は S-4・範囲外のため入れていない。

### 参照した公式ドキュメント（2026-10-09 確認）
- Next.js: How to set up Vitest with Next.js — https://nextjs.org/docs/app/guides/testing/vitest （設定ファイル名 `vitest.config.mts`、`"test": "vitest"` は既定で watch になる旨）
- Vitest: `environment` — https://vitest.dev/config/environment （Default: `'node'`）
- Vitest: CLI — https://vitest.dev/guide/cli （`vitest run`: "Perform a single run without watch mode."）
- Vite: Shared Options `resolve.tsconfigPaths` — https://vite.dev/config/shared-options
- 失敗時の終了コードは公式 CLI ページに明記が見当たらなかったため、E-5 の実測で確認した。

## S-n / E-n の達成状況
| ID | 状況 | 確かめ方 |
|---|---|---|
| S-1 | ✅ | `npm test` → `vitest run` が1回実行して終了。全通過で exit 0、失敗ありで exit 1（E-5 で実測）。watch に入らない |
| S-2 | ✅ | `src/lib/format.test.ts` を対象と同じ場所に配置。`import … from "@/lib/format"` が解決できてテストが通る |
| S-3 | ✅ | `formatTime` / `formatTimeRange` / `formatDate` のテスト10本（自動） |
| S-4 | ✅ | `vitest.config.mts` で `test.environment: "node"` を明示。jsdom 等は未導入 |
| S-5 | ✅ | `npx tsc --noEmit` / `npm run lint` / `npm run build` いずれも exit 0。tsc の対象には `format.test.ts` が入る。`vitest.config.mts` は `tsconfig.json` の `include`（`**/*.ts` / `**/*.tsx`）に当たらないため **tsc の対象外**で、lint・`npm test` の実行・単体の型チェック（下記）で確認（R-2 で訂正） |
| E-1 | ✅ | 自動: `formatTime(null/undefined/"")` → `""`（＋通常系 `"09:30:00"`→`"09:30"`） |
| E-2 | ✅ | 自動: 4通りを個別のテストで確認 |
| E-3 | ✅ | 自動: `2026-07-03`→`(金)`、月初 `2026-08-01`→`(土)`、年末 `2026-12-31`→`(木)`。期待値の曜日は手計算＋`toLocaleDateString` で別途照合してから書いた |
| E-4 | ✅ | 自動: `formatDate("abc")` → `"abc"` |
| E-5 | ✅ | 手動: 一時ファイル `src/lib/e5-temp-fail.test.ts`（`expect(1).toBe(2)`）を置いて `npm test` → **exit 1**。削除後に再実行 → **exit 0** |

前提・不変条件: テストは `format.ts` の純粋関数のみを import し、Supabase・`.env*` には触れていない。
`package.json` に足した依存は devDependencies のみ。ただし lock では**既存の推移的依存3件のパッチ版が上がった**（下記・R-1）。

## 変更したファイル
- 新規: `vitest.config.mts`、`src/lib/format.test.ts`、`work-orders/WO-001-report.md`
- 変更: `package.json`（`test` スクリプト、devDependencies に `vitest`）、`package-lock.json`、`README.md`（1行）
- `package-lock.json` の中身（HEAD の lock と `packages` を突き合わせて確認。R-1 で追記）:
  - 追加 60 件（vitest / vite / rolldown 等。すべて vitest 経由）。削除 0 件。
  - **既存パッケージの版上げ 3 件**（いずれもパッチ版）:
    | パッケージ | 前 → 後 | 上がった理由 |
    |---|---|---|
    | `postcss`（hoist 分） | 8.5.16 → 8.5.29 | `vite@8.3.4` の依存が `postcss@^8.5.29` のため（`npm view vite@8.3.4 dependencies` で確認） |
    | `nanoid` | 3.3.15 → 3.3.20 | postcss の依存の連動 |
    | `source-map-js` | 1.2.1 → 1.2.2 | postcss の依存の連動 |
  - 本番ビルドへの影響: hoist された `postcss@8.5.29` は `@tailwindcss/postcss` も使う（`npm ls postcss` で確認）＝**本番の CSS 生成に使われる版が変わる**。
    `next` 本体は自前の `postcss@8.4.31` を持つので変化なし。build は通過済み。
    → 不変条件「Vercel の配信物は変えない」に厳密には触れるため、受け入れるかを PM に上げる（「PM に判断を求める点」4）。
  - lock 先頭の `version` が `0.1.0` → `1.0.0`（`package.json` の `version` に npm が同期しただけ。実害なし）。
- `tsconfig.json` / `eslint.config.mjs` は**変更不要だった**（そのままで tsc・lint とも通過）。
- `src/` の既存コード（`format.ts` 含む）・`CLAUDE.md`・`docs/*`・`.env*`・`supabase/*` は触っていない。

## コマンドの実行結果
| コマンド | 結果 |
|---|---|
| `npm test` | Test Files 1 passed / Tests 10 passed、**exit 0** |
| `npm test`（E-5 の失敗テストあり） | Tests 1 failed / 10 passed、**exit 1** |
| `npx tsc --noEmit` | exit 0（対象に `format.test.ts` を含む。`vitest.config.mts` は含まない） |
| `npx tsc --noEmit --strict --target es2022 --module esnext --moduleResolution bundler --skipLibCheck vitest.config.mts` | exit 0（設定ファイル単体の型チェック。R-2 対応で追加。tsconfig は変更していない） |
| `npm run lint` | exit 0（警告なし） |
| `npm run build` | exit 0（✓ Compiled successfully、全6ルート生成）。実行前に 3000 番ポートが LISTEN していないこと、`next dev` のプロセスが無いことを確認済み |

参考: `npm audit` は導入前（HEAD の lock）12件 → 導入後 10件で、**今回の追加で増えてはいない**（`next` / `sharp` / `postcss` 等の既存分）。

## テストで見つかった既存の不具合（直していない）
E-n の範囲では不具合なし。範囲外の入力を手元で試した結果のみ記録する（テストには入れていない）:
- `formatDate("2026-13-01")` → `"2026/13/1(金)"`、`formatDate("2026-02-30")` → `"2026/2/30(月)"`。
  数字として読める不正な日付は「そのまま返す」にならず、表示は入力どおりの月日・**曜日は繰り上がった日付のもの**になる。
  DB の `date` 型から来る値なら実害は出ないはずだが、仕様（E-4）の想定外の振る舞い。

## PM に判断を求める点
1. **Vitest のメジャー版**: 今回は 4 系（4.1.11）。5 系に上げるには `@types/node` を `^22` 以上に上げる必要がある
   （ローカルの Node は v24.16.0）。Vercel 側の Node 版と合わせて、上げるかどうかを別 WO で判断してほしい。
2. **`@/` の解決方式**: Next 公式手順（`vite-tsconfig-paths`）ではなく Vite 本体の `resolve.tsconfigPaths` を採用した。
   公式手順から外れる判断なので、問題があれば差し戻してほしい。
3. **`formatDate` の不正日付の扱い**（上記）: 現状維持でよいか、別 WO で「不正日付はそのまま返す」に揃えるか。
4. **lock での `postcss` 等のパッチ版上げを受け入れるか**（R-1）: 選択肢は
   (a) 受け入れる（パッチ版のみ・build 通過済み。受け入れるなら変更管理表に残す）、
   (b) 戻す（`vite@7` 系も `postcss@^8.5.6` を要求するので、vite を 7 に下げても 8.5.16 のままにできるかは要検証。overrides 等の追加設定が要る可能性）。
   実装スレとしては (a) を推す（差分がパッチ版のみで、戻すほうが設定が増えて読みにくくなるため）。
5. **コミットの分け方**（R-3）: 実装スレはコミットしないため、PM がコミットするときに
   「運用文書の改訂（変更管理表 No.35 ほか）」と「WO-001 の実装」を別コミットに分けてほしい。
   WO-001 側のファイル: `package.json` / `package-lock.json` / `vitest.config.mts` / `src/lib/format.test.ts` / `README.md` / `work-orders/WO-001-report.md`。
   なお新規3ファイルは、レビューの `git diff` に出るよう `git add -N`（intent-to-add・中身はステージしていない）にしてある。
6. **テストの収集範囲を `src/**/*.test.ts` に絞るか**（第3回 R-1・低）: Vitest 4 の既定の除外は `node_modules` と `.git` だけなので、
   プロジェクト配下に worktree（`.claude/worktrees/`）ができると古いコピーのテストも走る。現時点では該当ディレクトリが無く実害なし。
   (a) `vitest.config.mts` に `test.include: ["src/**/*.test.ts"]` を1行足す（小さな追補 WO か、受入時の差し戻しで）、
   (b) worktree を使い始めた時点で対応、のどちらにするか判断してほしい。実装スレとしては (a) を推す。

## レビュー指摘（第1回・2026-10-09）
批判役（サブエージェント）。根拠は WO-001 仕様・本 report・`git diff HEAD`・実行結果のみ。
再現確認: `npm test` → 10 passed / exit 0。`TZ=America/Los_Angeles` / `TZ=Pacific/Kiritimati` でも 10 passed（`formatDate` はローカル日付で組み立てるため TZ 非依存であることを確認）。
E-5 の一時ファイル `src/lib/e5-temp-fail.test.ts` は残っていない。`vite@8.3.4` に `resolve.tsconfigPaths?: boolean` が存在することを型定義で確認。

仕様との一致: S-1 ✅ / S-2 ✅ / S-3 ✅ / S-4 ✅ / S-5 ✅（ただし R-2）/ E-1〜E-4 ✅（自動）/ E-5 ✅（手動・記録あり）。仕様に無い振る舞いの追加なし。
テストの質: 期待値はすべて具体値で、実装をなぞるだけのテストではない（例: 曜日配列がずれれば E-3 の3本が落ちる）。軽量コースのため Red Gate 記録なしは WO どおり。

- R-1【中】【実装の不備】対象: `package-lock.json`／前提・不変条件「本番のアプリの動き・Vercel の配信物は変えない」
  何が起きるか: lock の差分に vitest 系の追加だけでなく、**既存の推移的依存の版上げ**が含まれている。
  `node_modules/postcss` 8.5.16 → 8.5.29、`nanoid` 3.3.15 → 3.3.20、`source-map-js` 1.2.1 → 1.2.2（vite 8 の要求に合わせて巻き上げられたものと推測）。
  hoist された `postcss` は `@tailwindcss/postcss` 経由で本番ビルドの CSS 生成に使われうるため、「devDependencies を足しただけで配信物は不変」とは言い切れない。
  report には記載がない（`npm audit` が 12→10 件に減ったのも、これが原因の可能性が高い）。
  ほか、lock 先頭の `version` が `0.1.0` → `1.0.0` に変わっている（package.json に合わせた同期で実害なし。記載だけ）。
  直し方の案: report の「変更したファイル」に推移的依存の版上げ3件と `version` 同期を明記する。
  パッチ版のみ・build 通過済みなので受け入れてよいかは PM 判断（受け入れるなら変更管理表にその旨を残す。戻すなら vite 8 の要求範囲との両立を確認してから）。

- R-2【低】【実装の不備】対象: report「S-5 … テストファイル・設定ファイルを含む」／`tsconfig.json` の `include`
  何が起きるか: `tsconfig.json` の `include` は `**/*.ts` / `**/*.tsx` なので **`vitest.config.mts` は `tsc --noEmit` の対象外**
  （`tsc --listFiles` に `format.test.ts` は出るが `vitest.config.mts` は出ない）。lint は対象（eslint --debug で確認）。
  よって「tsc が設定ファイルを含めて通った」という記述は不正確。設定ファイルの型誤り（例: `tsconfigPaths` の綴り違い）は tsc では検出されない。
  直し方の案: report の S-5 の記述を「tsc はテストファイルを含む／設定ファイルは lint と `npm test` の実行で確認」に直す。
  tsconfig の `include` に `*.mts` を足すかは範囲外（必要なら別途。WO は tsconfig 変更を「必要な場合のみ」としている）。

- R-3【低】【実装の不備】対象: 作業ツリー全体（コミット単位）
  何が起きるか: 現在の未コミット差分に、WO-001 の実装（`package*.json`・`vitest.config.mts`・`format.test.ts`・`README.md`・report）と、
  PM 側の運用文書改訂（`CLAUDE.md`・`docs/変更管理表.md` No.35・`work-orders/README.md` / `ROLE-*.md` / `WO-TEMPLATE.md` / `WO-001-vitest-setup.md`）が混在している。
  後者は実装スレの「不可」ファイルだが、内容から PM の変更と判断（実装スレの越権ではない）。一括コミットすると「何を・なぜ」が分からなくなる。
  直し方の案: コミット時に「運用文書改訂（No.35）」と「WO-001 実装」を別コミットに分ける。

仕様の穴: 新規なし（report 記載の「`formatDate` の数値として読める不正日付」はすでに PM 判断待ちとして挙がっており、妥当な指摘。DB の `date` 型由来なら実害なしという見立ても同意）。

まとめ: 3件（高0・中1・低2）。仕様の穴なし。

## レビュー指摘への対応（第1回分・2026-10-09）
- R-1【中】→ **対応（report に明記）**。lock の `packages` を HEAD と突き合わせ、版上げは指摘の3件＋root の `version` 同期のみ・削除なしを確認。
  `postcss` が上がった理由は推測でなく `vite@8.3.4` の依存 `postcss@^8.5.29` と確認。本番 CSS 生成（`@tailwindcss/postcss`）が使う版が変わる点を
  「変更したファイル」に書き、受け入れ可否を「PM に判断を求める点」4 に上げた。lock 自体は戻していない（戻すかは PM 判断）。
- R-2【低】→ **対応（記述を訂正）**。`tsc --listFilesOnly` で `vitest.config.mts` が対象外なのを確認し、S-5 と実行結果の記述を直した。
  代わりに設定ファイル単体の型チェック（exit 0）を追加で実施・記録。`tsconfig.json` の `include` に `*.mts` を足すのは
  WO が「必要な場合のみ」としているため**見送り**（tsc 以外の手段で確認できており、必要性がないため）。
- R-3【低】→ **見送り（PM へ）**。コミットは PM の担当のため、分け方の依頼を「PM に判断を求める点」5 に書いた。

## レビュー指摘（第2回・2026-10-09）
批判役（サブエージェント）。根拠は WO-001 仕様・本 report（第1回対応を含む）・`git diff HEAD`・再実行結果のみ。
再現確認: `npm test` → 1 file / 10 passed / exit 0（テストファイルは `src/lib/format.test.ts` の1本のみ。`.next` 等に余計な `*.test.*` なし）。
`npx tsc --noEmit` exit 0、report 記載の設定ファイル単体の型チェック exit 0、`npx eslint vitest.config.mts src/lib/format.test.ts` exit 0。
`package-lock.json` を HEAD と突き合わせ: 追加 60 件（すべて `dev: true`、本番依存の新規なし）・削除 0 件・版変更は root の `version` 同期と
`postcss` 8.5.16→8.5.29 / `nanoid` 3.3.15→3.3.20 / `source-map-js` 1.2.1→1.2.2 のみ。report の R-1 対応記載と一致。

第1回指摘の確認:
- R-1 → 記載どおり対応済み（事実関係を再確認、一致）。受け入れ可否は PM 判断待ち（判断を求める点 4）で妥当。
- R-2 → 記述訂正済み。代替の型チェックも再現できた。tsconfig 不変更の判断も WO の「必要な場合のみ」に沿う。
- R-3 → PM 担当事項として判断を求める点 5 に移管済みで妥当。

仕様との一致: S-1〜S-5 ✅ / E-1〜E-4 ✅（自動）/ E-5 ✅（手動・記録あり）。仕様に無い振る舞いの追加なし。
`format.ts` を含む `src/` 既存コード・`.env*`・`supabase/*` に差分なし。

指摘なし。

仕様の穴: 新規なし。
まとめ: 0件（高0・中0・低0）。残りは report の「PM に判断を求める点」1〜5（R-3 由来のコミット分割を含む）のみ。

## レビュー指摘（第3回・2026-10-10）
批判役（サブエージェント）。根拠は WO-001 仕様・本 report（第1・2回を含む）・`git diff HEAD`・再実行結果のみ。
再現確認: `npm test` → 1 file / 10 passed / exit 0。`npx vitest list` で収集対象は `src/lib/format.test.ts` の10本のみ。
第2回以降、WO-001 側ファイル（`package.json` / `vitest.config.mts` / `src/lib/format.test.ts` / `README.md`）に変更なし。`src/` 既存コード・`.env*`・`supabase/*` に差分なし。

仕様との一致: S-1〜S-5 ✅ / E-1〜E-4 ✅（自動）/ E-5 ✅（手動・記録あり）。仕様に無い振る舞いの追加なし。
テストの質: 期待値はすべて具体値。E-4 は `"abc"` が `Number` で NaN になり早期 return する経路を実際に通っている（`format.ts` で確認）。

- R-1【低】【実装の不備】対象: `vitest.config.mts`（`test.include` / `test.exclude` 未指定）
  何が起きるか: Vitest 4 の既定の除外は `["**/node_modules/**", "**/.git/**"]` のみ（`node_modules/vitest/dist` の `defaultExclude` で確認。3系より狭い）。
  そのためプロジェクト配下に別のコピーができると、その中の `*.test.ts` も拾って実行する。
  本プロジェクトは「WO ごとに1スレ」の運用で、Claude Code の worktree 隔離（既定の置き場所 `.claude/worktrees/`）を使うと、
  古い版のテストが二重に走り、結果が紛らわしくなる・失敗の原因が別コピーにある、といったことが起こりうる。現時点では該当ディレクトリは無く、実害はない（潜在）。
  直し方の案: (a) `test.include: ["src/**/*.test.ts"]` を明示して S-2 の「対象と同じ場所に置く」規約に収集範囲を合わせる（1行・読みやすい）、
  (b) 現状維持とし、worktree を使い始めた時点で対応する。今回の WO の受入を止めるほどではないため、どちらにするかは PM 判断。

参考（指摘ではない）: `WO-001-vitest-setup.md` 冒頭の状態が「作業中（コードレビュー待ち）」のまま、report は「受入待ち」。WO 本文は PM の担当のため記載のみ。

仕様の穴: 新規なし。
まとめ: 1件（高0・中0・低1）。残りは report の「PM に判断を求める点」1〜5 のみ。

## レビュー指摘への対応（第3回分・2026-10-10）
- R-1【低】→ **見送り（PM へ）**。指摘の事実は確認済み（`node_modules/vitest/dist/chunks/defaults.*.js` の `defaultExclude` が
  `["**/node_modules/**", "**/.git/**"]`、`.claude/worktrees/` は現時点で無い）。見送る理由:
  第3回はレビュー上限（最大3回）で、ここで設定を変えると**レビューを通っていない変更が残る**こと、また現時点で実害がないこと。
  直すかどうかは「PM に判断を求める点」6 に上げた。
- 参考の「WO 本文の状態が『作業中』のまま」は WO 本文が PM の担当ファイルのため触っていない。

## 収束
レビュー3回で重要度「高・中」なし（第1回 中1・低2 → 対応済み／第2回 指摘なし／第3回 低1 → 見送り・PM 判断）。
画面変更なし（WO-001 は基盤整備のみ）のため、手順5のスクショは対象外。
