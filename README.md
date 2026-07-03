# チラシ配布実績管理アプリ（flyer-tracker）

チラシのポスティング実績を、大島てる的に**地図上のピン**で記録・管理するアプリ。
ピンの色は、その場所の**直近の配布評価**（良好=緑 / 普通=グレー / 非推奨=赤）で出し分ける。

> 「きみのアーカイブ」とは**別の独立したプロジェクト**です（スタックのみ共通）。

## 技術構成

- Next.js 15 (App Router) / TypeScript
- Tailwind CSS v4 / shadcn/ui / lucide-react
- Supabase（Auth + Postgres）… 認証・DB
- Leaflet + OpenStreetMap（react-leaflet）… 地図
- ホスティング: Vercel

## セットアップ

```bash
npm install
cp .env.example .env.local   # Supabase の URL / anon key を記入
npm run dev
```

`http://localhost:3000` を開く（スマホサイズ表示推奨）。

### 環境変数（`.env.local`）

| 変数 | 説明 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクトの URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase の anon public key |
| `NEXT_PUBLIC_SITE_URL` | マジックリンクのリダイレクト先（開発は `http://localhost:3000`） |

## Supabase

1. [supabase.com](https://supabase.com) でプロジェクトを作成
2. SQL Editor で `supabase/schema.sql` を実行（テーブル・トリガー・ビュー・RLS を作成）
3. Authentication > URL Configuration に、マジックリンクのリダイレクト URL（`http://localhost:3000/auth/confirm` と本番URL）を登録
4. Authentication > Users からチームメンバーを招待

## デプロイ（Vercel + 独自ドメイン）

1. GitHub にこのリポジトリを push し、Vercel でインポート
2. Vercel の Environment Variables に上記3変数を設定（`NEXT_PUBLIC_SITE_URL` は本番URL）
3. 独自ドメイン `flyer.<取得済みドメイン>` を Vercel の Domains に追加
4. お名前.com Navi で、サブドメイン `flyer` の CNAME レコードを Vercel が指示する値（`cname.vercel-dns.com` 等）に向ける
5. Supabase の Auth リダイレクトURLに本番URLを追加

※ 既存のレンタルサーバー上のLPは無関係（今回のアプリとは別）。

## デモ環境（flyerdemo）の構築

ポートフォリオ用に、本番（`flyer.<ドメイン>` = 自分用）とは**完全に分離**したデモ環境
（`flyerdemo.<ドメイン>`）を用意できる。データも別、ログインもワンクリック。

```
flyer.<ドメイン>      → Vercel プロジェクトA → Supabase プロジェクト①（実データ）
flyerdemo.<ドメイン>  → Vercel プロジェクトB → Supabase プロジェクト②（デモデータ）
```

### 手順
1. **Supabase でデモ用プロジェクトを新規作成**（無料枠は2つまで）
2. デモプロジェクトの SQL Editor で `supabase/schema.sql` を実行、続けて `supabase/seed_demo.sql` を1回だけ実行（ダミーデータ投入）
3. デモプロジェクトの **Authentication → Providers → Email** で「メール＋パスワード」を有効化し、
   **Authentication → Users → Add user** でデモ用アカウント（例 `demo@example.com` ＋パスワード）を作成
   - メール確認が有効なら、Add user 時に「Auto Confirm」を有効にするか、確認を済ませておく
4. **Vercel で2つ目のプロジェクト**を同じ GitHub リポジトリから作成し、環境変数を設定:
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` … デモ用プロジェクトの値
   - `NEXT_PUBLIC_SITE_URL` … `https://flyerdemo.<ドメイン>`
   - `NEXT_PUBLIC_DEMO_MODE=1`
   - `NEXT_PUBLIC_DEMO_EMAIL` / `NEXT_PUBLIC_DEMO_PASSWORD` … 手順3のアカウント
5. Vercel の Domains に `flyerdemo.<ドメイン>` を追加し、お名前.com で `flyerdemo` の CNAME を Vercel に向ける
6. デモプロジェクトの Auth リダイレクトURLに `https://flyerdemo.<ドメイン>/auth/confirm` を追加

これで `flyerdemo.<ドメイン>` を開くと「デモとしてログイン」ボタンが表示され、誰でも即体験できる。
本番 `flyer` 側は `NEXT_PUBLIC_DEMO_MODE` を設定しないので、デモボタンは出ない。

## 画面構成

```
/            一覧タブ（配布履歴の一覧・登録・編集・削除・変更履歴）
/map         地図タブ（ピン表示・配置・履歴追加）
/schools     小学校マスタ管理
/login       ログイン（マジックリンク）
/auth/confirm  マジックリンクのコールバック
```

## はじめての起動チェックリスト

1. `npm install`
2. Supabase プロジェクトを作成し、`supabase/schema.sql` を SQL Editor で実行
3. `.env.local` に `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` を設定
4. Supabase の **Authentication > URL Configuration** に以下を登録
   - Site URL: `http://localhost:3000`（本番は本番URL）
   - Redirect URLs: `http://localhost:3000/auth/confirm`（本番URLの `/auth/confirm` も）
5. `npm run dev` → `http://localhost:3000` を開く
6. 未ログインなら `/login` にリダイレクトされる。メールを入力しログインリンクを受信 → クリックでログイン
7. 「小学校」タブで小学校を1件登録 → 「一覧」タブで配布実績を登録 → 「地図に配置」または「地図」タブで座標を紐付け

> マジックリンクは Supabase 標準の PKCE（`?code=` 付き）と `token_hash` 形式の両方に対応しています。
> 標準のメールテンプレートのままで動作します。

## 動作確認の観点

- 未ログインで任意URL → `/login` にリダイレクトされる
- ログイン後、配布実績を登録するとトリガーにより `visit_logs` に `create` が記録される
- 編集すると `update`、削除すると `delete` が記録され、「変更履歴」から確認できる
- 削除は論理削除。「削除済みを表示」で一覧に出て、復元できる
- 地図のピン色が、その場所の直近評価（緑=良好 / グレー=普通 / 赤=非推奨）で変わる
- 別ブラウザ（未ログイン）ではデータが一切取得できない（RLS）

詳細な要件は [REQUIREMENTS.md](./REQUIREMENTS.md) を参照。
