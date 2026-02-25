import { getTranslations } from "next-intl/server";
import HomeClient from "@/components/home/home-client";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  return {
    title: t("title") + " | PredictFlow",
    description: t("subtitle"),
  };
}

export default function HomePage() {
  return <HomeClient />;
}
