# WO-001: 自動テスト基盤（Vitest）を導入する
- 作成日: 2026-10-09 / 作成: PM / 状態: **起票**
- コース: **軽量**（基盤整備のため。仕様レビュー②・Red Gate③は省略。コードレビューは `/code-review` 可）
- 背景: VSDD 導入（2026-10-09 オーナー決定）に伴い、「テストを先に書き、実装前に失敗することを確かめる」ための
  テストランナーが必要。現状 `package.json` にテストの仕組みが無い。以降の機能 WO（フルコース）の前提になる。

## 目的
- `npm test` 1コマンドで、純粋なロジックの自動テストを実行できるようにする。
- 既存の純粋関数（`src/lib/format.ts`）にテストを書き、基盤が実際に使えることを示す（以降の WO の書き方の見本にする）。

## 仕様

### 仕様項目（S-n）
- **S-1**: `npm test` を実行すると Vitest が**1回だけ**実行され、全テストが通れば終了コード 0、1本でも失敗すれば 0 以外で終わる（監視モードで止まらない）。
- **S-2**: テストファイルは対象と同じ場所に `*.test.ts` として置く（例: `src/lib/format.test.ts`）。テストから `@/…` の import が解決できる。
- **S-3**: `src/lib/format.ts` の `formatTime` / `formatTimeRange` / `formatDate` について、現在の振る舞いを確かめるテストがある（下の E-n を含む）。
- **S-4**: テストの実行環境は Node（ブラウザの模擬環境は入れない）。今回の対象は純粋なロジックだけのため。
- **S-5**: 既存の `npx tsc --noEmit` / `npm run lint` / `npm run build` が引き続き通る（テストファイルを含めて）。

### 前提・不変条件
- 自動テストは**本番 Supabase にも `.env*` にも触れない**（純粋なロジックのみ）。
- 本番のアプリの動き・Vercel の配信物は変えない（依存は devDependencies のみ）。

### 境界ケース（E-n）
- **E-1**: `formatTime(null)` / `formatTime(undefined)` / `formatTime("")` → `""`。
- **E-2**: `formatTimeRange` の4通り（開始のみ／終了のみ／両方／両方なし）がそれぞれ `"09:30〜"` `"〜10:15"` `"09:30〜10:15"` `""` になる。
- **E-3**: `formatDate("2026-07-03")` → `"2026/7/3(金)"`。月初・年末（例 `"2026-12-31"`）でも曜日が正しい。
- **E-4**: `formatDate` に形式外の文字列（例 `"abc"`）を渡すと、入力をそのまま返す。
- **E-5**: わざと失敗するテストを1本置いて `npm test` が 0 以外で終わることを確認する（確認後に削除し、report に結果を記録）。

### 非機能
- 画面・DB・RLS・デモへの影響: なし。

### 検証方針
| ID | 確かめ方 | 置き場所 |
|---|---|---|
| S-1, E-5 | 手動（コマンド実行と終了コードの確認） | report に記録 |
| S-2, S-3, E-1〜E-4 | 自動テスト | `src/lib/format.test.ts` |
| S-4 | 設定ファイルの確認 | `vitest.config.*` |
| S-5 | コマンド実行 | report に記録（**`next dev` を止めてから** build） |

### 範囲外（やらないこと）
- 画面コンポーネントのテスト（jsdom / Testing Library の導入）。必要になったら別 WO。
- E2E テスト（Playwright 等）、DB・RLS の自動テスト、CI（GitHub Actions）。
- `formatDateTime` 等、タイムゾーンに依存する関数のテスト（実行環境の TZ で結果が変わるため、扱い方を決めてから別途）。
- `format.ts` 自体の修正（テストで不具合を見つけても**直さず** report に書く）。

## 受入基準
- [ ] S-1〜S-5 / E-1〜E-5 が検証方針どおりに確かめられている
- [ ] `npx tsc --noEmit` / `npm run lint` / `npm test` / `npm run build` が通る
- [ ] 追加した依存パッケージ名とバージョンが report に書かれている（根拠: 公式ドキュメントの参照先も）

## 先に読むもの
- `CLAUDE.md`、`work-orders/README.md`（VSDD の流れ）
- `src/lib/format.ts`、`package.json`、`tsconfig.json`（`@/*` のパス設定）
- Vitest 公式ドキュメントと Next.js 公式の Vitest 導入手順（**推測で設定を書かず、公式を確認する**）

## やること
1. Vitest を devDependencies に追加し、設定ファイル（Node 環境、`@/` の解決）を置く。
2. `package.json` に `"test"` スクリプトを追加（S-1: 1回実行で終わる形）。
3. `src/lib/format.test.ts` を書く。テスト名に E-n を入れる。
4. E-5 の確認をして、失敗テストを削除する。
5. tsc / lint / test / build を通し、report を書く。

## 触ってよいファイル / 触らないファイル
- 可: `package.json` / `package-lock.json`、`vitest.config.*`（新規）、`src/lib/format.test.ts`（新規）、
  `README.md`（セットアップ手順に `npm test` の1行を足す程度）、`work-orders/WO-001-report.md`（新規）。
  `tsconfig.json` / `eslint.config.mjs` はテストを通すために**必要な場合のみ**、最小の変更で（理由を report に書く）。
- 不可: `src/` の既存コード（`format.ts` を含む）、`CLAUDE.md`、`docs/変更管理表.md`、`.env*`、`supabase/*`。

## 禁止・注意（チラトラ共通）
- `~/.claude/CLAUDE.md` の共通規約に従う（人が読める／根拠／**要件外を良かれで足さない**）。
- `next dev` 稼働中に `next build` をしない（`.next` の奪い合いで壊れる）。
- ローカルでも接続先は**本番Supabase**。`.env*` を読まない・秘密情報を扱わない。
- 仕様の解釈が割れたら**勝手に決めずに止まって** report の「PM に判断を求める点」に書く。

## 報告（`WO-001-report.md` に書く）
- やったこと / 追加した依存と版・参照した公式ドキュメント / S-n・E-n ごとの達成状況（✅ / 未、確かめ方） /
  変更したファイル / コマンドの実行結果（tsc・lint・test・build、E-5 の終了コード） /
  テストで見つかった既存の不具合（あれば。直さない） / PM に判断を求める点

## 改訂履歴（仕様承認後の変更）
| 日付 | 変更 | 理由（どのレビュー指摘 R-n から） |
|---|---|---|

## 別スレに貼る一文
- 実装: > `work-orders/WO-001-vitest-setup.md` と `work-orders/ROLE-implementer.md` を読んで作業し、報告を `work-orders/WO-001-report.md` に書いて止まってください。
- コードレビュー: > `work-orders/ROLE-reviewer.md` を読んで、WO-001 の「コードレビュー」をしてください。（または `/code-review`）
