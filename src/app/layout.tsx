import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist } from "next/font/google";
// Self-hosted: next/font/google failed to parse this family's stylesheet.
import "@fontsource/cormorant-garamond/300.css";
import "@fontsource/cormorant-garamond/300-italic.css";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/400-italic.css";
import "@fontsource/cormorant-garamond/500.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import BagDrawer, { BagHydrator } from "@/components/BagDrawer";
import ScrollProgress from "@/components/ScrollProgress";
import ChatAssistant from "@/components/ChatAssistant";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Ghanam Rang — Modest sets in deep colour", template: "%s — Ghanam Rang" },
  description: "Abaya and khimar sets in deep, rich colours. Swipe through every style and shop the full set.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} antialiased`}>
        <ScrollProgress />
        <Suspense fallback={<div className="h-16" />}>
          <SiteHeader />
        </Suspense>
        {children}
        <SiteFooter />
        <BagDrawer />
        <BagHydrator />
        <Suspense fallback={null}>
          <ChatAssistant />
        </Suspense>
      </body>
    </html>
  );
}
