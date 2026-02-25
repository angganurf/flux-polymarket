import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "predict" });
  return {
    title: t("title") + " | PredictFlow",
    description: "Create and participate in prediction events with virtual points.",
  };
}

export default function PredictLayout({ children }: { children: React.ReactNode }) {
  return children;
}
