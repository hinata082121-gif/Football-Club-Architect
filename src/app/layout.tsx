import type { Metadata } from "next";
import Script from "next/script";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
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
      <body className="min-h-full flex flex-col">
        <Script
          id="adsense-site-verification"
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1305303366441643"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
