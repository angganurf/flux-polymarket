import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "portfolio" });
  return {
    title: t("title") + " | PredictFlow",
    description: "Track your prediction bets, win rate, and P&L.",
  };
}

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return children;
}
