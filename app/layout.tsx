import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FitSpace 运营后台",
  description: "FitSpace 小程序测试运营后台"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
