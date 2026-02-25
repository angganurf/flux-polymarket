import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "PredictFlow - Real-time Prediction Market Analytics",
    template: "%s | PredictFlow",
  },
  description: "Track, analyze, and explore prediction markets with live data. Real-time Polymarket analytics dashboard.",
  keywords: ["prediction market", "polymarket", "analytics", "crypto", "trading", "forecasting"],
  openGraph: {
    title: "PredictFlow - Real-time Prediction Market Analytics",
    description: "Track, analyze, and explore prediction markets with live data.",
    type: "website",
    locale: "en_US",
    siteName: "PredictFlow",
  },
  twitter: {
    card: "summary_large_image",
    title: "PredictFlow",
    description: "Real-time Prediction Market Analytics Dashboard",
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/manifest.json",
  themeColor: "#6366f1",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PredictFlow",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
