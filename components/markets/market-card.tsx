"use client";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { formatVolume } from "@/lib/utils/format";
import type { ParsedMarket } from "@/lib/api/types";
import { PriceChange } from "@/components/shared/price-change";
import { useMarketStore } from "@/lib/stores/market-store";

interface MarketCardProps {
  market: ParsedMarket;
}

export function MarketCard({ market }: MarketCardProps) {
  const livePrice = useMarketStore((s) => s.prices[market.clobTokenIds[0]]);
  const yesPrice = livePrice ?? market.yesPrice;
  const noPrice = livePrice != null ? 1 - livePrice : market.noPrice;
  const yesPercent = Math.round(yesPrice * 100);

  return (
    <Link
      href={`/markets/${market.slug}`}
      className="group block rounded-xl border border-border bg-surface p-4 transition-all hover:border-border-light hover:bg-surface-hover"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="text-sm font-medium leading-snug text-foreground line-clamp-2 group-hover:text-primary transition-colors">
          {market.question}
        </h3>
        {market.priceChange24h !== 0 && (
          <PriceChange value={market.priceChange24h} className="shrink-0" />
        )}
      </div>

      {/* Probability bar */}
      <div className="mb-3">
        <div className="mb-1 flex justify-between text-xs font-semibold">
          <span className="text-yes">{yesPercent}% Yes</span>
          <span className="text-no">{100 - yesPercent}% No</span>
        </div>
        <div className="flex h-2 overflow-hidden rounded-full bg-background">
          <div
            className="bg-yes/80 transition-all duration-500"
            style={{ width: `${yesPercent}%` }}
          />
          <div
            className="bg-no/80 transition-all duration-500"
            style={{ width: `${100 - yesPercent}%` }}
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 text-xs text-muted">
        <span>Vol {formatVolume(market.volume24h)}</span>
        <span>Liq {formatVolume(market.liquidity)}</span>
      </div>
    </Link>
  );
}
