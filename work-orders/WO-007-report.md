# WO-007 報告: 見た目の土台を作り直す（色のトークンとコントラスト・書体・角・デザインの決まりの文書）
- 状態: **受入待ち**（コードレビュー2回で収束〔高・中なし〕。PM 判断〔2026-10-14〕の①凡例の枠 2.5px と⑥実績の登録〜復元の再確認を実施済み）
- 実施日: 2026-10-14 / 実施: WO スレ
- 環境: ローカル `npm run dev`（ポート 3000）→ 本番 Supabase。確認とスクショは**デモ表示モード**（ログインはオーナーが内蔵ブラウザで実施）。

## やったこと
1. **Red Gate**: `src/lib/note-color.test.ts`（23本）を先に書き、`src/lib/note-color.ts` を「選択肢は空・関数は例外を投げる」スタブにして `npx vitest run` → 22本失敗（下の記録）。
2. メモの色の読み替え `toNoteColor`・`noteColorVar` と選択肢 `NOTE_COLOR_OPTIONS`（黄・紫・橙・青・水色）を実装 → 全部通過。`types.ts` の `NOTE_PRESETS`・`NOTE_COLOR_MAP`・`noteColor` は `note-color.ts` に置き換えて消した。
3. `globals.css` を作り直した: **素の値**（`#rrggbb`。「素の値ここから〜ここまで」の間だけ）と**意味の名前**の2層。shadcn の名前は意味の名前の別名として `@theme inline` に残し、未使用の `chart-*`・`.dark`・`@custom-variant dark` は消した。
   Tailwind の既定の色・角・影は `@theme { --color-*: initial; --radius-*: initial; --shadow-*: initial; }` で消し、`amber-500`・`bg-white`・`rounded-xl`・`shadow-sm` などを**書いても効かない**状態にした（直書きを防ぐため）。
4. 部品（`ui/*`）と画面の色・角・影のクラスを意味の名前に置き換えた。透明度付き（`/10`・`/50` 等）は0件に。フォーカスの輪は全部品で不透明の `ring`／`outline`（`--focus-ring`）。
   tailwind-merge に新しい角・影の名前を教えた（`src/lib/utils.ts`。教えないと `rounded-control` と `rounded-full` が同じ要素に付いたとき上書きされない）。
5. 書体を BIZ UDPゴシック（400・700）に差し替え、予備に日本語の標準書体を並べた。`themeColor` を画面の地と同じ `#f4f6fa` に。
6. 地図: ピンの形と色を `src/components/map/pin-glyph.ts` にまとめ、地図のピン・凡例・位置指定のピンで共有。履歴なしは中抜き。凡例を小さなピンで描き直した。吹き出しの履歴に評価の文字。メモの印・現在地・ラベル・吹き出しの色をトークンに。
7. `docs/デザインの決まり.md` を作成（トークンの一覧、測ったコントラスト比、使い方の決まり、例外、角・影・書体、文字の段階 14/16/20〔18・24〕・太さ 400/700・押す場所 44px、ダークは後で、検索の式）。
8. デモ表示モードで手動確認・実測・スクショ。`docs/テスト仕様書.md` に 8 章（H-01〜H-13）を追加し、結果を記入。

## Red Gate の記録（実装前）
スタブ（`NOTE_COLOR_OPTIONS = []`、`toNoteColor`・`noteColorVar` は `throw new Error("未実装: …")`）で `npx vitest run src/lib/note-color.test.ts`:
- **23本中22本が失敗**。
  - S-7 選択肢の並び（1本）: `expected [] to deeply equal [ …(5) ]`（期待値は仕様の 黄・紫・橙・青・水色 を固定で書いた）
  - S-7 既存の5値がそのまま選ばれる（5本）、E-1 red→orange・green→cyan と描く色（4本）、E-2 空・想定外・大文字・前に空白・null・undefined→yellow と描く色（7本）、描く色がトークン（5本）: すべて `Error: 未実装: <入力>`（入力ごとに失敗したことが分かる）
- **通った1本**: 「S-7: 選択肢に赤・緑は出さない」。選択肢が空のスタブでは「含まない」が成り立つため。否定の確認なので、同じ describe の「選択肢は5色（この順）」と組で意味を持つ（5色の並びは固定値で確かめている）。
- 手動の行（テスト仕様書 H-01〜H-13）は、**実装の後に**足した（ROLE の「先に足す」と順序が違う。期待結果は WO の S-n・E-n をそのまま写した）。

## S-n / E-n の達成状況
| ID | 状況 | 確かめ方 |
|---|---|---|
| S-1 | ✅ | 下の「直書きの検索結果」。素の値は `globals.css` の区切りの中だけ。画面・部品・Leaflet の規則は意味の名前だけ。影・暗幕もトークン（`shadow-card`・`shadow-overlay`・`bg-scrim`、地図は `--elevation-map-*`）。透明度付きは0件、不透明度の指定は下の注記 |
| S-2 | ✅ | `docs/デザインの決まり.md` 2-2 に一覧。表のすべての役割を持つ（名前の対応も同表） |
| S-3 | ✅ | H-01・H-02。トークン46組と、各画面の文字のある要素すべてを実測し基準未満0件（下の「測ったコントラスト比」）。基調・状態に赤緑なし |
| S-4 | ✅ | `layout.tsx`（`BIZ_UDPGothic`、`weight: ["400", "700"]`）。ブラウザで `BIZ UDPGothic 400/700 loaded` を確認。予備に日本語書体。地図の中の自前のラベル・吹き出しも同じ書体（レビュー第1回 R-1 で修正。Leaflet の拡大ボタン等は既定のまま） |
| S-5 | ✅ | `rounded-control`（8px）・`rounded-card`（12px）・`rounded-full` の3段だけ（検索結果）。Tailwind の既定の角は消してある。どの部品がどの段かは文書 3 章 |
| S-6 | ✅ | H-05・H-06。ピン・メモの直書きなし。中抜きのピン（枠 4.83:1・約 2.8px）、凡例も中抜き。吹き出しに評価の文字（`RATING_META` の呼び名） |
| S-7 | ✅ | 自動テスト＋H-07・H-08。選択肢 黄・紫・橙・青・水色。橙 H 60.7・水色 H 215.2（文書 2-4） |
| S-8 | ✅ | `docs/デザインの決まり.md` |
| S-9 | ✅ | 例外は Google のボタン・ロゴ、`themeColor`、読み替えの `"red"`・`"green"`、色ではない語だけ（下の検索結果） |
| S-10 | ✅ | `.dark` と `@custom-variant dark` を削除 |
| S-11 | ✅ | 文言・機能・構成・文字の大きさ・押す場所は変えていない（例外: 吹き出しの評価の文字・メモの色の呼び名・削除済みの淡い地）。H-13・H-14: 既存項目を再確認（実績の登録・編集・削除・復元は PM 判断⑥で実施） |
| E-1 | ✅ | 自動テスト＋H-07（デモのシードの red・green を色に触らず保存 → `orange`・`cyan`） |
| E-2 | ✅ | 自動テスト（空・想定外・大文字・前に空白・null・undefined → 黄が選ばれる）。DB に未知の値を作れないため画面では未確認。「色に触らず保存すると yellow」はコードで確認: `note-form.tsx` の色の状態は `useState<NoteColor>(toNoteColor(initial?.color))` で始まり、保存はその状態の値を送るだけ（レビュー第1回 R-4） |
| E-3 | ✅ | H-02。バッジ 5.71／6.77／6.10（カード・PC の表とも） |
| E-4 | ✅ | H-02。エラー文の色 7.10（カード）／6.56（画面の地）。削除ボタンの白文字 7.10。エラー文を実際に出した画面での実測はしていない（色は全15か所が同じ `text-danger`） |
| E-5 | ✅ | H-09 |
| E-6 | ✅ | H-01・H-03。枠 4.18（カード）、輪 9.36／8.65、不透明 |
| E-7 | ✅ | H-05。凡例を小さなピンで描き直し、地図と同じ `PIN_STYLE` を使う |
| E-8 | ✅ | H-11 |
| E-9 | ✅ | H-12 |
| SS-1〜 | ✅ | 下の「スクショ」 |
| SS-PC | ✅ | `list-pc.png` |

## 決めたトークンの値
`docs/デザインの決まり.md` 2-1（素の値）・2-2（意味の名前）。主なもの:
| 役割 | 値 |
|---|---|
| 基調（藍）／押している間／淡い地 | `#22428f` ／ `#1b3573` ／ `#e5ebf8` |
| 本文／補足 | `#18223a` ／ `#56607a` |
| 画面の地／カードの地／淡い地 | `#f4f6fa` ／ `#ffffff` ／ `#e9edf4` |
| 飾りの線／部品の境目 | `#dde2ec` ／ `#737c91` |
| 危険（文字・塗り）／押している間 | `#a8261b` ／ `#8a1f16` |
| デモの帯（地／文字）／選択欄（地／枠・アイコン／文字） | `#ffd84a` ／ `#2a2300` ／ `#fff8db` ／ `#806400` ／ `#2a2300` |
| 評価のピン（良好・普通・非推奨） | `#20a04e`・`#95989f`・`#de3b3d`（今の OKLCH の値を `#rrggbb` に直しただけ。色相は同じ） |
| 評価のバッジ（地／文字） | 良好 `#e3f4e8`／`#1d6b3a`、普通 `#eceef1`／`#4a5260`、非推奨 `#fbe6e4`／`#a2291f` |
| 地図: 小学校・現在地・履歴なしの枠 | `#22428f`・`#2563eb`・`#6b7280` |
| メモ 黄・紫・橙・青・水色 | `#eab308`・`#8b5cf6`・`#ee8700`・`#3b82f6`・`#06b6d4` |
| 角 部品／カード／丸 | 8px ／ 12px ／ 丸 |

## 測ったコントラスト比
全表は `docs/デザインの決まり.md` 2-5。**基準未満 0 件**。
- 測り方: 開発サーバーで、意味の名前を当てた要素の計算済みの色（`getComputedStyle`）を取り、WCAG の相対輝度の式で計算。半透明（地図のラベルの地）は白・黒に重ねた両方で計算。
- トークンの組 46 組: 文字の最小 5.25（補足／基調の淡い地）、線の最小 3.87（部品の境目／画面の地）。
- 画面の実測（文字のある要素すべて）: ログイン、地図（凡例・ラベル・吹き出し）、一覧（カード・削除済み・PC の表）、小学校マスタ（立ち位置を開いた状態）、変更履歴、登録のダイアログ（配布実績・マップメモ）、メモの編集。基準未満 0 件。
  - Leaflet の既定の文字（拡大ボタンの「+」`#000`、著作権の `#333`・リンク `#0078a8`＝4.94）も基準以上（範囲外だが測った）。

## 直書きの検索結果
検索の式（`docs/デザインの決まり.md` 8 章と同じ）:
```
# 1. 色の値・色の名前（src の ts/tsx）
grep -rnE "#[0-9a-fA-F]{3,8}\b|oklch\(|rgba?\(|hsla?\(|\b(white|black)\b|-(white|black)\b|\b(amber|red|green|blue|yellow|gray|grey|slate|zinc|neutral|stone|emerald|orange|purple|sky|cyan|lime|teal|indigo|violet|fuchsia|pink|rose)-[0-9]{2,3}\b" src --include=*.tsx --include=*.ts
# 2. CSS の色名を文字列として書いたもの
grep -rnE "[\"'\` :=](red|green|blue|yellow|purple|orange|cyan|gray|grey|silver|navy|teal|lime|maroon|olive|aqua|fuchsia|pink)[\"'\`;)]" src --include=*.tsx --include=*.ts
# 3. 透明度付きの色
grep -rnoE "\b[a-z:\[\]=-]*(bg|text|border|ring|outline|divide|fill|stroke|accent|from|to|via|shadow|decoration|placeholder|caret)-[a-z0-9-]+/[0-9]{1,3}\b" src --include=*.tsx --include=*.ts
# 4. 角・影（3段・2段以外）
grep -rnoE "rounded(-[a-z0-9]+)?\b|shadow-[a-z0-9]+|border-radius:[^;\"]*" src --include=*.tsx --include=*.ts | grep -vE "rounded-(control|card|full)|shadow-(card|overlay)"
# 5. globals.css の「素の値ここから〜ここまで」の外
awk '/素の値ここから/{s=1} /素の値ここまで/{s=0;next} !s' src/app/globals.css | grep -nE "#[0-9a-fA-F]{3,8}\b|oklch\(|rgba?\(|hsla?\(|\b(white|black|red|green|blue|yellow|gray|grey|orange|purple|cyan)\b"
```
結果:
| 式 | 当たった箇所 | 扱い |
|---|---|---|
| 1 | `layout.tsx:23` `themeColor: "#f4f6fa"` | S-9 例外（画面の地と同じ色） |
| 1 | `login/page.tsx:286` `#747775`・`#FFFFFF`・`#1F1F1F`・`#F2F2F2` | S-9 例外（Google のボタン）。Tailwind の `bg-white` は消したため `bg-[#FFFFFF]` に書き換えた（色は同じ） |
| 1 | `google-logo.tsx:8,12,16,20` | S-9 例外（G のロゴ） |
| 2 | `note-color.ts:33,34` の `"red"`・`"green"` | S-9 例外（読み替えの関数の中） |
| 2 | `note-color.ts:6,10-14,18` の `"yellow"` 等（`NoteColor` の型・選択肢の値・既定値） | DB に保存する値の名前（色の値ではない。描く色はトークン）。下の「PM に判断を求める点」2 |
| 2 | `note-color.test.ts` の各入力・期待値 | テストの入力と期待値（DB の値の名前） |
| 3 | 0 件 | — |
| 4 | `flyer-map.tsx:31` `border-radius:var(--corner-round)` | トークン（丸） |
| 5 | `white-space: nowrap`・`white-space: normal`（`globals.css` の Leaflet の規則） | 色ではない語（S-9） |
| 5 | `--map-note-yellow`〜`--map-note-cyan: var(--memo-…)`（意味の名前の定義5行） | トークンの名前に色の名前が入っているだけ（値は素の値への参照。レビュー第1回 R-5 で追記） |

- 不透明度の指定（S-1 の例外の範囲の確認）: `disabled:opacity-50` 等の押せない状態のほか、既存の `ui/dialog.tsx` の「×」の `opacity-70 hover:opacity-100` と `ui/select.tsx` の▼アイコンの `opacity-50` が残っている（色の透明度付きの書き方ではないので検索の対象外）。どちらも WO-008（押す場所・フォーカス）で「×」を作り直すときに合わせて扱うのがよいと考え、今回は変えていない。
- 評価の色の流用（S-2）: `rating-` を使う場所は `types.ts`（`RATING_META`）・`pin-glyph.ts`（ピン・凡例）・`globals.css` の定義だけ。`RATING_META` の使い手は、ピンの吹き出しの点（`flyer-map.tsx`）・評価のバッジ（`visit-row.tsx`・`visit-table-row.tsx`）・評価の文字（`visit-form.tsx`・`visit-log-dialog.tsx` の差分表示）だけ。以前の流用4か所（成功の文・完了アイコン・コピー完了・監査ログの登録）は `text-success`・`text-audit-create` に変えた。
  検索: `grep -rn "rating-" src --include=*.tsx --include=*.ts` と `grep -rn "RATING_META" src`。

## 変更したファイル
- 新規: `src/lib/note-color.ts`、`src/lib/note-color.test.ts`、`src/components/map/pin-glyph.ts`、`docs/デザインの決まり.md`、`docs/screenshots/WO-007/*.png`（9枚）、`work-orders/WO-007-report.md`
- 変更: `src/app/globals.css`、`src/app/layout.tsx`、`src/lib/types.ts`（評価のバッジの色・メモの色の定義を移動）、`src/lib/utils.ts`（tailwind-merge に角・影の名前）、
  `src/components/ui/{button,card,dialog,input,select,textarea}.tsx`、
  `src/app/login/page.tsx`、`src/components/{account-menu,app-header,bottom-tab-bar,demo-banner,register-dialog}.tsx`、
  `src/components/map/{flyer-map,location-picker-map,location-picker,map-view,note-form}.tsx`、
  `src/components/schools/{cooldown-setting,school-manager,school-spots}.tsx`、
  `src/components/visits/{visit-form,visit-list-view,visit-log-dialog,visit-row,visit-table-row}.tsx`（`visit-form` はエラー文の `text-danger` だけ）、
  `docs/テスト仕様書.md`（8 章 H-01〜H-13）
- DB・`supabase/*`・`src/lib/data/*` は変更なし。

## 動作確認
- `npx tsc --noEmit` / `npm run lint` / `npm test`（142 passed）通過。
- デモ表示モードで、テスト仕様書 H-01〜H-13 を実施（結果は同書）。
- 書体: ブラウザの `document.fonts` で `BIZ UDPGothic` 400・700 が読み込まれていることを確認。
- tailwind の出力: `shadow-card` は `var(--elevation-card)`、`rounded-control` は `var(--corner-8)`、`*` は `outline-color: var(--focus-ring)`（透明度なし）。`--color-white`・`--radius-xl`・`--shadow-sm` は定義されていない（消えている）ことを確認。

## スクショ（`docs/screenshots/WO-007/`）と見本の案A・S-n との見比べ
| ファイル | 内容 | 見比べ |
|---|---|---|
| `login-mobile.png` | ログイン（デモの選択欄・Google のボタン） | 藍の主ボタン・灰の枠の入力欄・淡い黄の選択欄。Google のボタンは白のまま（E-8）。**この1枚だけ縮小表示で撮った（281×609）**: 等倍で撮ると内蔵ブラウザの描画が崩れたため |
| `map-mobile.png` | 地図（デモの帯・凡例・ピン・中抜き・メモ5色） | 帯は通学帽の黄に濃い文字（案A と同じ）。凡例は小さなピン、履歴なしは中抜き（案A の凡例と同じ考え）。メモに赤・緑なし |
| `map-popup-mobile.png` | ピンの吹き出し | 履歴の行に「普通」の文字（S-6） |
| `note-edit-red-mobile.png` | `red` のメモの編集 | 橙が選ばれている（E-1）。黄のチップの輪は、開いたときのフォーカス（下の注記） |
| `list-mobile.png` | 一覧（上部） | 白いヘッダー・藍の主ボタン・淡い地のバッジ（案A と同じ） |
| `list-deleted-mobile.png` | 削除済みのカード | 淡い地＋「削除済み」、半透明なし（Q-7） |
| `log-mobile.png` | 変更履歴 | 登録＝濃い藍、編集＝灰（S-2） |
| `schools-mobile-1.png`・`-2.png` | 小学校マスタ（立ち位置を開いた状態） | 「クールダウン中」＝淡い藍の地＋濃い藍の文字＋藍の枠、「配布可」＝淡い地、「非推奨（対象外）」＝枠だけ（案A の同じ画面とほぼ同じ見た目） |
| `list-pc.png` | PC の一覧の表（1280px を縮小表示で撮影） | 見出し行は淡い地、評価のバッジ、削除済みの行は淡い地 |
- 案A との違い（意図したもの）: 主ボタンの角は案A の 10px ではなく、S-5 の「部品 8px」。下のタブの選択中の印（上の線）は案A にあるが、形の違いは WO-008（点検 No.28）の範囲なので付けていない。
- 注記: `note-edit-red-mobile.png` の「黄」のチップの濃い輪は、ダイアログを開いたときに先頭のボタンに当たるフォーカスの輪（キーボード操作の扱い。指で開いたときは出ない）。輪を不透明にしたので、選ばれている印（濃い枠）と似て見える。輪の出方は WO-008 の範囲。
- 地図のスクショには地図タイルの地名が写っている。デモの架空の街の場所（本番の活動エリアから離した場所）のもので、本番データ・本番の地名は写っていない。

## 見つかった不具合
- なし（バグ管理表への記録なし）。

## 気づいたこと（範囲外。報告だけ）
- Tailwind v4 は `docs/`・`work-orders/` の `.md` も読んでクラスを作るため、WO の本文にある `ring-ring/50` 等の規則が CSS に出力されている（画面では使っていないので見た目への影響はない）。気になるなら `@source not` で文書を除く設定を別 WO で。
- 小学校マスタの注記「地図に青いピンで表示され…」: 小学校のピンを藍（`--ai-700`）にしたので「青い」がやや合わない。文言は変えていない（WO-010 の候補）。
- `supabase/seed_demo.sql` のメモの色の注記（yellow / purple / red / blue / green）は古くなった（`supabase/*` は触れないため未変更。仕様レビュー第1回 R-15）。

## 仕様の穴
- なし（実装中に解釈が割れた点は無かった）。

## PM に判断を求める点
1. **手動確認の行を実装の後に足した**（ROLE の順序と違う）。期待結果は WO の S-n・E-n を写したもの。
2. **メモの色の値の名前（`"yellow"` 等）の扱い**: S-9 の例外は `"red"`・`"green"` だけを挙げているが、`note-color.ts` には DB の値の名前として `"yellow"`・`"purple"`・`"orange"`・`"blue"`・`"cyan"` も書く必要がある（色の値ではなく DB の値。描く色は `--map-note-*`）。仕様レビュー第2回 R-3 の「DB に保存するメモの色の値は色の値ではない」の考えで扱ったが、文書の例外の表に参考として書き足した。これでよいか。
3. **小学校のピンの色を藍に変えた**（以前は `#2563eb` の青。現在地と同じ色だった）。S-2 は「小学校のピン」の役割だけを決めており色は指定が無いので、基調に揃えて現在地・メモの青と見分けやすくした。前の青に戻す方がよければ素の値を1つ変えるだけ。
4. **ヘッダーと下のタブの地**: 以前は半透明の地＋ぼかし（`bg-background/80 backdrop-blur-sm`）だった。透明度付きの書き方の禁止（S-1）に合わせ、案A と同じ白い地（カードの地）にした。スクロールしたとき下の内容が透けなくなる。
5. **（レビュー第1回 R-3・仕様の穴）凡例の「履歴なし」の枠の太さ**: 地図のピンの枠は約 2.8px（S-6 の 2.5px 以上）。凡例の小さなピン（幅 12px・画面の地の上）は画面上 2px。S-6 の「太さ 2.5px 以上」が凡例にも掛かるかが仕様から読み取れないため直していない。(a) 2.5px は地図のピンだけ（凡例は対象外）と S-6 に書く／(b) 凡例も 2.5px にする（`map-view.tsx` の `LegendPin` の `strokeWidth` を 2.5 に。1行）。
6. **（レビュー第1回 R-2）削除済みの地と淡い地が同じ色**: `--surface-deleted` と `--surface-muted` がどちらも `#e9edf4`。削除済みのカードの中で、メモの枠と「普通」のバッジの形が地に溶ける（文字は 13.46・5.34・6.77 で読める）。見た目の判断なので直していない。直すなら (a) 削除済みの地を別の素の値にして測り直す／(b) 削除済みのカードの中のメモの枠に飾りの線を付ける。
7. **（レビュー第2回 R-2）WO-008 への持ち越し**: 主ボタン・削除ボタンのフォーカスの輪が塗りに接して見分けにくい（判定は満たす）。WO-008 の輪の出方の整理で扱ってほしい。

## レビュー指摘（第1回・2026-10-14）
批判役（サブエージェント）。根拠は `WO-007-design-tokens.md`・本 report・`git diff`（作業ツリーの未コミットの変更）・新規ファイル（`note-color.ts`・`note-color.test.ts`・`pin-glyph.ts`・`docs/デザインの決まり.md`・`docs/screenshots/WO-007/`）・`node_modules/leaflet/dist/leaflet.css`。
`npx vitest run`（142 passed）・`npx tsc --noEmit`（エラーなし）を再実行して確認。直書きの検索（式1・5）を再実行し、report の結果と一致（式5の差は R-5）。主なトークンの組のコントラスト比を `#rrggbb` から別に計算し、report・文書の値と一致（文字の最小 5.25、部品の境目 4.18／3.87、フォーカスの輪 9.36／8.65、評価のバッジ 5.71／6.77／6.10、デモの帯 11.33 等）。
tailwind-merge（3.6.0）の拡張を実際に動かし、`rounded-control rounded-full` → `rounded-full`、評価のバッジの `bg-primary` → `bg-rating-*-badge` の上書きが効くことを確認。DB の `map_notes.color` に CHECK 制約が無く、`orange`・`cyan` を保存できることを `supabase/schema*.sql` で確認。
件数 6（高 0／中 1／低 5）。分類: 実装の不備 4／テストの穴 1／仕様の穴 1。

S-n／E-n の対応: S-1 ✅（R-5・R-6 の補足あり）／S-2 ✅／S-3 ✅／S-4 △（R-1）／S-5 ✅／S-6 ✅（R-3）／S-7 ✅／S-8 ✅／S-9 ✅／S-10 ✅／S-11 ✅（実績の登録・編集・削除の再確認は未。report 記載のとおり）／E-1〜E-9 ✅。Red Gate の記録あり。スクショはデモ表示モードで、本番データは写っていない。

- R-1【中】【実装の不備】対象: S-4・`src/app/globals.css`（Leaflet まわりの規則）
  何が起きるか: `leaflet.css` の `.leaflet-container { font-family: "Helvetica Neue", Arial, Helvetica, sans-serif; }` が地図の中の要素に効くため、チラトラが自前で装飾しているピンの名前のラベル（`.flyer-label`）・吹き出し（`.flyer-history`・`.flyer-school-popup`）・メモの吹き出し（`.flyer-note-tip`）は BIZ UDPゴシックにならず、端末の既定の日本語書体（Windows なら游ゴシック／メイリオ、iPhone ならヒラギノ）で出る。地図は主な画面で、ここだけ書体が違う。`globals.css` に Leaflet の書体を上書きする規則は無い（変更前も無かったが、S-4 で書体を UD 書体にそろえる目的に対して取りこぼし）。
  直し方の案: 自前の規則（`.flyer-label`・`.flyer-history`・`.flyer-school-popup`・`.flyer-note-tip`）にアプリの書体を指定する。`@theme inline` の `--font-sans` は CSS 変数として出力されない可能性があるため、`:root` に意味の名前（例 `--font-body`）を置いて `@theme inline` の `--font-sans` とこの規則の両方から使う。拡大縮小ボタン・著作権表示（Leaflet の既定の見た目）は範囲外のとおり触らない。PM が「地図の中の書体は範囲外」と判断するなら、仕様の穴として S-4 に明記する。

- R-2【低】【実装の不備】対象: S-2（削除済みの行の地）・Q-7・`globals.css` の `--surface-deleted`
  何が起きるか: `--surface-deleted` と `--surface-muted` が同じ素の値（`--sumi-100` `#e9edf4`）で、評価「普通」のバッジの地（`#eceef1`）もほぼ同じ色。削除済みのカードの中では、メモの枠（`bg-muted`）が消え、「普通」のバッジの形も地に溶ける（`list-deleted-mobile.png` で確認できる）。文字のコントラストは基準を満たすので読めはする。report は「気づいたこと（範囲外）」に書いているが、本 WO で決めた値の組み合わせから起きているので、本 WO の範囲。
  直し方の案: 削除済みの地を淡い地と別の素の値にする（例 少し濃い灰。上に乗る補足の文字 4.5:1 と部品の境目を測り直す）か、削除済みのカードの中のメモの枠に飾りの線（`border-border`）を付ける。見た目の判断なので、直さず PM に「このままでよいか」を聞く形でもよい。

- R-3【低】【仕様の穴】対象: S-6・E-7（凡例の中抜きのピンの枠の太さ）・`map-view.tsx` の `LegendPin`
  何が起きるか: 凡例のピンは `strokeWidth={2}`＋`vectorEffect="non-scaling-stroke"` で、枠は画面上 2px。S-6 は中抜きの枠を「太さ 2.5px 以上（地図の地の上で消えないため）」とし、続けて「凡例も中抜きで描く」としている。2.5px が地図のピンだけの基準か、凡例にも掛かるのかが仕様で2通りに読める（凡例は地図ではなく画面の地の上で、幅 12px）。
  直し方の案: PM が決める。(a) 2.5px は地図のピンだけ（凡例は画面の地の上なので対象外）と S-6 に書く／(b) 凡例の「履歴なし」も 2.5px にする（`PIN_STYLE.none.edgeWidth` を凡例でも使う）。

- R-4【低】【テストの穴】対象: E-1・E-2・`src/lib/note-color.test.ts`
  何が起きるか: テストの名前が「そのまま保存すると orange（yellow）になる」と言っているが、確かめているのは `toNoteColor` の戻り値だけ。保存の値になるつながり（`note-form.tsx` の `useState<NoteColor>(toNoteColor(initial?.color))` → `onSubmit({ color, … })`）は自動テストに無く、手動でも確かめたのは `red`（と `green`）の保存だけ。E-2 の「色に触らず保存すると `yellow`」は自動・手動のどちらでも確かめていない（コードを読むと `color` の状態は5つの値のどれかなので成り立つ）。
  直し方の案: テストの名前を確かめている内容（「…が選ばれる」）に合わせる。E-2 の保存はコードレビューで確認した旨を report の E-2 の行に書く（UI のテストを足すほどではない）。

- R-5【低】【実装の不備】対象: S-9（検索の結果を report に書く）・本 report「直書きの検索結果」の式5
  何が起きるか: 式5（`globals.css` の素の値の外）を実行すると、`white-space` の2か所のほかに、意味の名前の `--map-note-yellow`〜`--map-note-cyan: var(--memo-…)`（5行）が当たる（色の名前を含むトークン名）。report の表には `white-space` しか書かれていない。値の直書きではないので中身の問題は無いが、「当たった箇所の一覧」としては欠けている。
  直し方の案: 表に「式5: `--map-note-*`（トークンの名前。値は `var(--memo-*)`）」の行を足す。`docs/デザインの決まり.md` 8 章の式の注記にも同じことを書くと、次に検索する人が迷わない。

- R-6【低】【実装の不備】対象: S-1（フォーカスの輪は「すべての部品」で不透明のトークン）・`src/components/ui/dialog.tsx:58`
  何が起きるか: ダイアログの「×」は `focus:outline-none` で、輪（`ring`）も付いていないため、キーボードでフォーカスしても何も出ない（全体の既定の `outline-ring` も消される）。変更前からの状態だが、S-1 はボタン・自前のボタンを含めて輪の色をそろえるとしており、この1か所だけ輪が無い。report は「×」の `opacity-70` を WO-008 送りにしているが、輪が無いことには触れていない。
  直し方の案: 他のボタンと同じ `focus-visible:ring-2 focus-visible:ring-ring` を付ける（色だけの変更）。出方の整理まで WO-008 に回すなら、report の「PM に判断を求める点」か WO-008 の持ち越しに「×に輪が無い」を明記する。

## レビュー指摘（第1回）への対応（WO スレ・2026-10-14）
- R-1【中】→ 直した。`globals.css` の body で書体の並び `--font-body` を組み立て（`--font-biz-udp` が body に付くため）、`@theme inline` の `--font-sans` と、自前の `.flyer-label`・`.flyer-history`・`.flyer-school-popup`・`.flyer-note-tip` の両方から使う。ブラウザで地図のラベルが `"BIZ UDPGothic", …`、Leaflet の拡大ボタンは既定のまま（`"Lucida Console", …`）であることを確認。`map-mobile.png`・`map-popup-mobile.png` を撮り直した。
- R-2【低】→ 直していない（見た目の判断）。「PM に判断を求める点」6 に移した（「気づいたこと」からは消した）。
- R-3【低・仕様の穴】→ 直していない。「PM に判断を求める点」5。
- R-4【低・テストの穴】→ テストの名前を確かめている内容（「…が選ばれる（編集画面の初期値＝保存される値）」）に直した。E-2 の保存はコードで確認した旨を S-n 表の E-2 に書いた。
- R-5【低】→ 直書きの検索結果の表に式5の `--map-note-*` の行を足した。`docs/デザインの決まり.md` 8 章の注記にも書いた。
- R-6【低】→ 直した。ダイアログの「×」に `focus-visible:ring-2 focus-visible:ring-ring`（他のボタンと同じ輪）を付けた。押す範囲・`opacity-70` は WO-008 のまま。
- 再確認: `npx tsc --noEmit` / `npm run lint` / `npm test`（142 passed）通過。

## レビュー指摘（第2回・2026-10-14）
批判役（サブエージェント）。根拠は `WO-007-design-tokens.md`・本 report（第1回への対応を含む）・`git diff`（作業ツリーの未コミットの変更）・新規ファイル（`note-color.ts`・`note-color.test.ts`・`pin-glyph.ts`・`docs/デザインの決まり.md`）・`docs/テスト仕様書.md` の 8 章。
`npx vitest run`（142 passed）・`npx tsc --noEmit`（エラーなし）・`npm run lint`（エラーなし）を再実行。透明度付きの色の検索（`[a-z]-[a-z0-9-]+/[0-9]{1,3}`）は 0 件、角・影のクラスは `rounded-(control|card|full)`・`shadow-(card|overlay)` 以外 0 件を再確認。
第1回の対応を確認: R-1（地図の自前のラベル・吹き出しに `--font-body`）✅、R-4（テスト名）✅、R-5（式5の表）✅、R-6（ダイアログの「×」の輪）✅。R-2・R-3 は「PM に判断を求める点」5・6 に移っており、本回では重ねて指摘しない。
件数 3（高 0／中 0／低 3）。分類: 実装の不備 3／テストの穴 0／仕様の穴 0（新規）。

S-n／E-n の対応: S-1 ✅（R-1 の補足）／S-2〜S-10 ✅／S-11 ✅（実績の登録・編集・削除の再確認は未。report 記載のとおり）／E-1〜E-9 ✅。Red Gate の記録あり。

- R-1【低】【実装の不備】対象: S-1・S-5（角のトークンの層）・`src/components/map/flyer-map.tsx:31`、`src/app/globals.css` の `.leaflet-tooltip.flyer-label`（`border-radius: var(--corner-8)`）と `.flyer-history-dot`（`var(--corner-round)`）
  何が起きるか: 角は「素の値」（`--corner-8`・`--corner-12`・`--corner-round`）と、Tailwind 側の名前（`--radius-control`・`--radius-card`）の2層になっているが、地図の3か所だけ素の値を直接参照している。後で「部品の角」を 8px から変えたとき（`--radius-control` の参照先を変えたとき）、地図のラベルだけ取り残される。S-1 の「素の値は定義にだけ書き、規則は意味の名前を使う」は色について書かれた決まりなので仕様違反とまでは言えないが、文書（3 章）の「何の部品かで3段に寄せる」の考えと参照の仕方がそろっていない。
  直し方の案: `:root` の意味の名前の側に角の名前（例 `--corner-control: var(--corner-8)`・`--corner-pill: var(--corner-round)`）を置き、`@theme inline` の `--radius-control` と地図の3か所の両方からそれを使う。または「角は素の値を直接使ってよい」と `docs/デザインの決まり.md` の角の章に一行書く（どちらでもよい。そろっていればよい）。

- R-2【低】【実装の不備】対象: E-6・S-1（フォーカスの輪）・`src/components/ui/button.tsx:8`（`default`・`destructive`）
  何が起きるか: 主ボタン（藍の塗り `#22428f`）のフォーカスの輪は同じ `#22428f`・`ring-2`・すき間（`ring-offset`）なしなので、輪とボタンの塗りが一続きになり、フォーカスしたことが「ボタンが 2px 太る」ようにしか見えない。危険のボタン（`#a8261b`）でも、藍の輪が赤の塗りに直に接する。E-6 の判定「輪のすぐ外側の地に対して 3:1 以上」は満たしており（9.36／8.65）、仕様の範囲では合格だが、輪を不透明にしたことで変更前（半透明の輪＝塗りより淡く見えた）より見分けにくくなっている。report・文書に触れられていない。
  直し方の案: 輪の出方（すき間・太さ）は WO-008 の範囲なので、本 WO では直さず、report の「気づいたこと」か WO-008 への持ち越しに「塗りのボタンは輪とすき間が無く、輪が塗りと一続きに見える（`ring-offset` の要否）」と書く。

- R-3【低】【実装の不備】対象: 本 report の冒頭の「状態」
  何が起きるか: 冒頭が「停止（コードレビュー第2回で収束〔高・中なし〕。仕様の穴 R-3〔低〕の判断を PM に求める）」となっているが、第2回のレビューは本節が初出で、報告の作成時点では第2回の結果はまだ無かった。結果としては本回も高・中なしなので食い違いは無いが、レビューの前に結果を書いた形になっている（PM が受入の判断で読む欄）。
  直し方の案: 状態の欄は第2回の指摘を受けた後に書き直す（例「停止（コードレビュー第2回で高・中なし。低3件のうち R-2 は WO-008 へ持ち越し記載、PM に判断を求める点 1〜6）」）。

## レビュー指摘（第2回）への対応（WO スレ・2026-10-14）
- R-1【低】→ 直した。角にも意味の名前 `--shape-control`・`--shape-card`・`--shape-round` を置き（`globals.css` の意味の名前の層）、Tailwind の `--radius-control`・`--radius-card` と、地図のラベル・吹き出しの点・メモの印（`flyer-map.tsx`）はこの名前を使うようにした。文書 2-2・3 章も直した。
- R-2【低】→ 直していない（本 WO の判定〔輪の外側の地に対して 3:1 以上〕は満たす）。**WO-008 への持ち越し**: 主ボタン・削除ボタンは輪（藍・2px）が塗りに直に接して一続きに見え、フォーカスが見分けにくい。輪と部品の間に隙間（`ring-offset`）を入れる等、輪の出方の整理で扱う。「PM に判断を求める点」7 にも書いた。
- R-3【低】→ 冒頭の状態欄を、第2回の結果を見てから書き直した。
- 再確認: `npx tsc --noEmit` / `npm run lint` / `npm test`（142 passed）通過。角の値が変わらないこと（ラベル 8px・メモの印 9999px）をブラウザで確認。レビューは2回で収束（高・中なし）したので、第3回は起動していない。

## PM の判断（2026-10-14）への対応（WO スレ）
PM の判断: ①凡例の「履歴なし」の枠も 2.5px に ②削除済みの地はこのまま ③小学校のピンの藍・④ヘッダーとタブの白い地・⑤メモの色の値の扱いは受入 ⑥受入前に実績の登録・編集・削除・復元を再確認 ⑦フォーカスの輪は WO-008 へ持ち越し。
- ① 直した。`map-view.tsx` の `LegendPin` の枠の太さを `PIN_STYLE` の `edgeWidth` から取る（`non-scaling-stroke` なので画面上の px）。履歴なしは 2.5px、ほかは今までどおり 2px。ブラウザで凡例の枠の太さ（履歴なし 2.5px）を確認し、`map-mobile.png` を撮り直した。
- ⑥ デモ表示モード（375px）で実施し、テスト仕様書 H-14 に記録（H-13 も更新）。登録 → 編集（7→8枚）→ 削除 → 削除済みを表示 → 復元 → 変更履歴まで期待どおり。確認用の実績はもう一度削除し、削除済みのまま残した。
- ②③④⑤⑦ 変更なし（⑦は「PM に判断を求める点」7 のとおり WO-008 へ）。
- 再確認: `npx tsc --noEmit` / `npm run lint` / `npm test`（142 passed）通過。①は1行の変更のため、コードレビューは再起動していない。
