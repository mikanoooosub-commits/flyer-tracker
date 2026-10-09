# チラトラ（flyer-tracker）— プロジェクト引き継ぎ書（CLAUDE.md）

**真実の所在はこの CLAUDE.md と `docs/*.md`。会話履歴ではなくファイルを正とする。**
（理由: セッションが変わっても、別フォルダから開いても、サブエージェントに渡しても、同じ状態から再開できるようにするため）

このファイルはClaude Codeが毎セッション最初に読む前提のメモ。
全プロジェクト共通の規約は `~/.claude/CLAUDE.md`、DBスキーマ変更は `db-change` スキルに従う。
本書はこのプロジェクト固有の文脈だけを書く。

## 現在地（2026-10-09 整備時点）
v1.0 を塾で**本番運用中**（Vercel デプロイ済み・スマホ確認済み）。地図・一覧・小学校マスタ・認証・監査ログ・
**デモ表示モード**（demoスキーマ方式）まで実装・動作確認済み。
今回このプロジェクトを独立した Claude Code プロジェクトとして整備（CLAUDE.md・`.claude/` を追加）。
**次は機能追加フェーズに入る。** 着手前に `docs/構想・ロードマップ.md` を見る。
同日、改修の進め方に **VSDD（仕様→仕様レビュー→テスト先行→敵対的レビュー→収束）** を導入（`work-orders/README.md`）。
その前提として **WO-001（Vitest 導入）を起票済み**。最初に VSDD で回す機能は**未定**（オーナーが決める）。

## これは何か
チラシのポスティング実績を、**地図上のピン（大島てる的）で記録・共有・分析する**モバイルファーストの業務Webアプリ。
塾オーナーが実際に**本番運用中**。同時に、作成者（元SIer・フリーランス）の**ポートフォリオ**でもある。
利用者は少人数チーム（相互に閲覧・編集）。端末はスマホ主体（PCは一覧をテーブル表示）。

## 構成（主要ファイル）
- `src/lib/types.ts` … 型定義を集約（DBテーブルに対応）。`Rating` / `School` / `Visit` など。
- `src/lib/data/queries.ts` … 読み取り関数群（サーバーコンポーネントから呼ぶ）。
- `src/lib/data/actions.ts` … Server Actions（登録・更新・論理削除・座標紐付け・監査ログ取得）。
- `src/lib/supabase/{client,server}.ts` … Supabaseクライアント。**参照スキーマの切替は server.ts の1か所だけ**。
- `src/lib/demo.ts` … デモ表示モードの cookie 定義（next/headers 非依存でクライアントからも使う）。
- `src/components/map/*` … Leaflet地図（ピン色分け・ホバー履歴・GPS・住所検索）。
- `src/app/(main)/` … 地図(ホーム `/`)・一覧(`/list`)・小学校マスタ(`/schools`)。
- `supabase/schema.sql` … 本番(public)スキーマ。冪等。
- `supabase/schema_demo.sql` / `seed_demo.sql` … デモ(demo)スキーマの構造と架空データ。
- `docs/` … 設計書・要件・テスト仕様書・変更管理表・バグ管理表・コーディング規約・構想ロードマップ・ドメイン設定手順。

## スタック
Next.js 15 (App Router) / React 19 / TypeScript strict / Tailwind v4 / shadcn/ui / lucide-react /
Leaflet + OpenStreetMap + Nominatim（無料・APIキー不要）/ Supabase（Auth + PostgreSQL + RLS + トリガー + ビュー）/ Vercel。

## 起動
`npm run dev` → http://localhost:3000
⚠️ **ローカルでも接続先は本番Supabase**（`.env.local`）。デモモードOFFで操作すると本番データを触る。
⚠️ `next dev` 稼働中に `next build` を実行しない（同じ `.next` を奪い合い壊れる。過去に2回踏んだ罠）。

## 設計上の重要な判断（＝勝手に変えないでほしい方針）
- **location（配布場所）と visit（配布履歴）を分離**したリレーショナル設計。
  ピンの色は各locationの「直近の評価」で決まる（ビュー `location_pin_status`）。緑=良好/灰=普通/赤=非推奨。
- **監査ログはトリガーで自動記録**（`visits` の create/update/delete を `visit_logs` に before/after jsonb で）。
  **削除は論理削除**（`is_deleted`）。RLSでも物理DELETEを許可しない。
- **RLSは全テーブル有効**。`authenticated` のみ、`anon`（未認証）は一切不可。サインアップは無効化。
- **デモ表示モード**（`demo` スキーマ方式）:
  - 本番と同じプロジェクト内に同構造の `demo` スキーマを持ち、ログイン画面のチェックボックスで
    参照先を public/demo に切替。切替点は `server.ts` の `createClient()` の1か所（`db.schema`）。
    よって `queries.ts` / `actions.ts` は無変更。
  - **なぜ is_demo フラグではなくスキーマ分離か**: 切替がチェックボックス（クライアント由来）のため
    RLSで制御できない。同一テーブルにフラグ同居だと「絞り忘れ＝本番データが出る」事故になるが、
    スキーマ分離なら demo参照中は本番行が物理的に出てこない。
  - **解除ボタンは意図的に置かない**。デモは人に見せている画面なので、誤タップで本番が出るのを防ぐ。
    解除はログアウト→ログイン画面でチェックを外す。
  - **public にテーブル/カラムを足したら demo にも同じDDLを当てる**（ドリフト防止）。
  - デモの座標は本番の活動エリアから離した架空の街に置く（地図は名前より「場所」が機微なため）。
- **実在地名・本番データをデモや画面共有に出さない**（placeholderも汎用に）。

## 次にやること / 保留中
- **WO-001 Vitest 導入**（起票済み・実装スレ待ち）。
- **（その後）機能追加**。どれから着手するかは未定。着手前に `docs/構想・ロードマップ.md` を確認する（例: 配布セッション＋在庫連動＝残部逆算方式）。
- 保留: `flyer.riceparrow.com` サブドメイン設定（手順は `docs/ドメイン設定手順.md`。ユーザー操作）。
- 保留: Supabase の **Max rows**（既定1000）の現在値確認。超えると件数が黙って欠落する（性能より先に正しさの問題）。
- 保留: 本番の**バックアップ方針**（Free は日次バックアップ無し。手動エクスポート or Pro移行）。
- 既知の軽微: `queries.ts` の `getSchools()` が `select("*")`（規約違反）。次に触るとき列指定に直す。

## コーディング・運用方針
- `~/.claude/CLAUDE.md` の共通規約（人が読める/根拠/要件外を足さない）に従う。
- DBスキーマ変更は `db-change` スキルに従い、`public`/`demo` 両方に当てる。破壊的変更は `begin; … rollback;` で予行演習。
- 仕様・スキーマ変更は `docs/変更管理表.md`、不具合は `docs/バグ管理表.md` に記録する。
- **要件外のものを良かれと思って足さない**（ゴールドプレーティング＝不具合。必要と思ったら実装せず提案する）。

## 進め方（チーム運用）
機能追加は `work-orders/` の work-order 方式＋**VSDD** で進める。**仕様（S-n／境界ケース E-n）を先に書き、オーナー承認後に実装する。**
- 役割: オーナー（仕様承認・最終受入）／PM（仕様化・WO起票・差し戻し振り分け・受入判定＝本体スレ。**コードは触らない**）／
  実装（`work-orders/ROLE-implementer.md`、テスト先行）／批判役（`work-orders/ROLE-reviewer.md`、**毎回新スレ**＋`/code-review` 併用）。
- 規模で「フル／軽量」コースを使い分ける（`work-orders/README.md`）。
- 流れと作法は `work-orders/README.md`。新しい作業は `work-orders/WO-TEMPLATE.md` をコピーして起票する。
