import type { Metadata } from "next";
import { fetchMarketBySlug } from "@/lib/api/gamma";
import { MarketDetailView } from "@/components/market-detail/market-detail-view";

interface PageProps {
  params: Promise<{ slug: string; locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const market = await fetchMarketBySlug(slug);

    const yesPercent = Math.round(market.yesPrice * 100);
    const noPercent = 100 - yesPercent;
    const title = market.question;
    const description = `${yesPercent}% Yes / ${noPercent}% No`;

    const ogImageUrl = `/api/og?${new URLSearchParams({
      title,
      yes: String(yesPercent),
      no: String(noPercent),
      type: "market",
    }).toString()}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "article",
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [ogImageUrl],
      },
    };
  } catch {
    return {
      title: "Market | PredictFlow",
    };
  }
}

export default async function MarketDetailPage({ params }: PageProps) {
  const { slug } = await params;

  return <MarketDetailView slug={slug} />;
}
