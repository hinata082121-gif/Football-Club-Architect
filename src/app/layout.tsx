import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Football Club Architect",
  description: "AIで創る名門クラブ。ローカルで遊べるAIクラブ経営シミュレーション。",
  applicationName: "Football Club Architect",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
