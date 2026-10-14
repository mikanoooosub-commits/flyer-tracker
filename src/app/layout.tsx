import type { Metadata, Viewport } from "next";
import { BIZ_UDPGothic } from "next/font/google";
import "./globals.css";

// 書体は BIZ UDPゴシック（UD 書体）。太さは決まりの2段（400・700）だけ読み込む（WO-007 S-4）
const bizUdpGothic = BIZ_UDPGothic({
  variable: "--font-biz-udp",
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "チラトラ",
  description: "地図上のピンでチラシ配布実績を記録・共有するアプリ「チラトラ」",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  // メタタグには CSS 変数を使えないため、画面の地（globals.css の --surface-page ＝ --sumi-50）と同じ色を直接書く（WO-007 S-9）
  themeColor: "#f4f6fa",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${bizUdpGothic.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
