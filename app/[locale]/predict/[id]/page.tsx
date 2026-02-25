import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { PredictionDetailView } from "@/components/predict/prediction-detail-view";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const event = await prisma.predictionEvent.findUnique({
      where: { id },
      include: {
        bets: { select: { choice: true, amount: true } },
      },
    });

    if (!event) {
      return { title: "Prediction Not Found" };
    }

    const yesTotal = event.bets
      .filter((b) => b.choice === "yes")
      .reduce((sum, b) => sum + b.amount, 0);
    const noTotal = event.bets
      .filter((b) => b.choice === "no")
      .reduce((sum, b) => sum + b.amount, 0);
    const total = yesTotal + noTotal;
    const yesProbability = total > 0 ? yesTotal / total : 0.5;

    const yesPercent = Math.round(yesProbability * 100);
    const noPercent = 100 - yesPercent;
    const title = event.title;
    const description = event.description
      ? `${yesPercent}% Yes / ${noPercent}% No - ${event.description}`
      : `${yesPercent}% Yes / ${noPercent}% No`;

    const ogImageUrl = `/api/og?${new URLSearchParams({
      title,
      yes: String(yesPercent),
      no: String(noPercent),
      type: "predict",
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
      title: "Prediction | PredictFlow",
    };
  }
}

export default async function PredictionDetailPage({ params }: PageProps) {
  const { id } = await params;

  return <PredictionDetailView id={id} />;
}
