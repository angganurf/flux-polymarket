"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useMarketDetail } from "@/lib/hooks/use-market-detail";
import { useMarketWebSocket } from "@/lib/hooks/use-websocket";
import { MarketHeader } from "@/components/market-detail/market-header";
import { MarketStats } from "@/components/market-detail/market-stats";
import { ConnectionStatus } from "@/components/shared/connection-status";
import { ShareButtons } from "@/components/shared/share-buttons";
import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";

const ProbabilityChart = dynamic(
  () => import("@/components/market-detail/probability-chart").then((m) => m.ProbabilityChart),
  { ssr: false, loading: () => <div className="h-[400px] animate-pulse rounded-xl bg-surface-hover" /> }
);

const OrderBook = dynamic(
  () => import("@/components/market-detail/order-book").then((m) => m.OrderBook),
  { ssr: false, loading: () => <div className="h-[300px] animate-pulse rounded-xl bg-surface-hover" /> }
);

const AIAnalysis = dynamic(
  () => import("@/components/market-detail/ai-analysis").then((m) => m.AIAnalysis),
  { ssr: false, loading: () => <div className="h-[200px] animate-pulse rounded-xl bg-surface-hover" /> }
);

const EmbedCodeGenerator = dynamic(
  () => import("@/components/embed/embed-code-generator").then((m) => m.EmbedCodeGenerator),
  { ssr: false }
);

interface MarketDetailViewProps {
  slug: string;
}

export function MarketDetailView({ slug }: MarketDetailViewProps) {
  const t = useTranslations("market");
  const { data: market, isLoading, error } = useMarketDetail(slug);

  const tokenId = market?.clobTokenIds[0];
  const allTokenIds = market?.clobTokenIds ?? [];

  // Subscribe to WebSocket updates
  const { connectionStatus } = useMarketWebSocket(allTokenIds);

  // Build share URL (client-side)
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 animate-pulse">
        <div className="h-6 w-48 rounded bg-border mb-6" />
        <div className="h-8 w-3/4 rounded bg-border mb-4" />
        <div className="h-80 rounded-xl bg-surface" />
      </div>
    );
  }

  if (error || !market) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-20 text-center">
        <p className="text-muted">{t("notFound")}</p>
        <Link
          href="/markets"
          className="mt-4 inline-block text-primary hover:underline"
        >
          {t("backToMarkets")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Back link + connection status */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/markets"
          className="flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToMarkets")}
        </Link>
        <ConnectionStatus status={connectionStatus} />
      </div>

      {/* Share buttons */}
      <div className="mb-4">
        <ShareButtons url={shareUrl} title={market.question} />
      </div>

      {/* Market header */}
      <MarketHeader market={market} />

      {/* Content grid */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Chart (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {tokenId && <ProbabilityChart tokenId={tokenId} />}
          <MarketStats market={market} />

          {/* AI Analysis */}
          <AIAnalysis market={market} />

          {/* Description */}
          {market.description && (
            <div className="rounded-xl border border-border bg-surface p-4">
              <h3 className="mb-2 text-sm font-semibold text-foreground">
                {t("description")}
              </h3>
              <p className="text-sm leading-relaxed text-muted">
                {market.description}
              </p>
              {market.resolutionSource && (
                <a
                  href={market.resolutionSource}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-xs text-primary hover:underline"
                >
                  {t("resolutionLink")} &rarr;
                </a>
              )}
            </div>
          )}

          {/* Embed code generator */}
          <EmbedCodeGenerator slug={slug} />
        </div>

        {/* Order book (1/3 width) */}
        <div>{tokenId && <OrderBook tokenId={tokenId} />}</div>
      </div>
    </div>
  );
}
