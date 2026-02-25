"use client";

import { useMarketDetail } from "@/lib/hooks/use-market-detail";
import { useMarketWebSocket } from "@/lib/hooks/use-websocket";
import { MarketHeader } from "@/components/market-detail/market-header";
import { ProbabilityChart } from "@/components/market-detail/probability-chart";
import { OrderBook } from "@/components/market-detail/order-book";
import { MarketStats } from "@/components/market-detail/market-stats";
import { ConnectionStatus } from "@/components/shared/connection-status";
import { ShareButtons } from "@/components/shared/share-buttons";
import { EmbedCodeGenerator } from "@/components/embed/embed-code-generator";
import { AIAnalysis } from "@/components/market-detail/ai-analysis";
import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";

interface MarketDetailViewProps {
  slug: string;
}

export function MarketDetailView({ slug }: MarketDetailViewProps) {
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
        <p className="text-muted">Market not found</p>
        <Link
          href="/markets"
          className="mt-4 inline-block text-primary hover:underline"
        >
          Back to Markets
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
          Markets
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
                Description
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
                  Resolution Source &rarr;
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
