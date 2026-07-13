import type { Metadata, Viewport } from "next";
import { M_PLUS_Rounded_1c } from "next/font/google";
import "./globals.css";

const mplusRounded = M_PLUS_Rounded_1c({
  variable: "--font-mplus-rounded",
  weight: ["400", "500", "700", "800"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "チラシ配布実績管理",
  description: "地図上のピンでチラシ配布実績を記録・管理するアプリ",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#f7f8fa",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${mplusRounded.variable} font-sans antialiased`}>
        {/* 🚧 リリース訓練用の一時バナー（切り戻し訓練後に revert 予定） */}
        <div
          style={{
            background: "#f59e0b",
            color: "#111",
            fontWeight: 700,
            fontSize: 13,
            textAlign: "center",
            padding: "6px 8px",
          }}
        >
          🚧 リリース訓練 v-drill — この後ロールバックします
        </div>
        {children}
      </body>
    </html>
  );
}
