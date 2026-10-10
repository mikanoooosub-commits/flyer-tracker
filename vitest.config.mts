import { defineConfig } from "vitest/config";

// Next.js 公式の Vitest 導入手順をもとに、純粋なロジックのテスト用に絞った設定。
// - React プラグイン / jsdom は入れない（画面のテストは範囲外。WO-001 S-4）
// - `@/*` の解決は Next 手順の vite-tsconfig-paths ではなく、Vite 本体の resolve.tsconfigPaths を使う
//   （Vite 8 が「プラグイン不要」と警告を出すため。依存を1つ減らせる）
export default defineConfig({
  resolve: {
    // tsconfig.json の paths（`@/*` → `./src/*`）をテストでも解決する
    tsconfigPaths: true,
  },
  test: {
    // Vitest の既定値も "node" だが、ブラウザ模擬環境を使わない方針を明示する
    environment: "node",
  },
});
