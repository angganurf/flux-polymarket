import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "markets" });
  return {
    title: t("title") + " | PredictFlow",
    description: "Browse and search prediction markets. Filter by category, volume, and liquidity.",
  };
}

export default function MarketsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
