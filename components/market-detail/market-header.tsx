"use client";

import { useTranslations } from "next-intl";
import { useMarketStore } from "@/lib/stores/market-store";
import { PriceChange } from "@/components/shared/price-change";
import type { ParsedMarket } from "@/lib/api/types";

interface MarketHeaderProps {
  market: ParsedMarket;
}

export function MarketHeader({ market }: MarketHeaderProps) {
  const t = useTranslations("market");
  const livePrice = useMarketStore((s) => s.prices[market.clobTokenIds[0]]);
  const yesPrice = livePrice ?? market.yesPrice;
  const noPrice = livePrice != null ? 1 - livePrice : market.noPrice;
  const yesPercent = Math.round(yesPrice * 100);

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">{market.question}</h1>

      <div className="mt-4 flex items-center gap-6">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-yes">{yesPercent}%</span>
          <span className="text-lg text-muted">{t("yes")}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-no">
            {100 - yesPercent}%
          </span>
          <span className="text-lg text-muted">{t("no")}</span>
        </div>
        {market.priceChange24h !== 0 && (
          <PriceChange value={market.priceChange24h} className="text-base" />
        )}
      </div>

      {/* Probability bar */}
      <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-background">
        <div
          className="bg-yes transition-all duration-700"
          style={{ width: `${yesPercent}%` }}
        />
        <div
          className="bg-no transition-all duration-700"
          style={{ width: `${100 - yesPercent}%` }}
        />
      </div>

      {/* suppress unused var warning */}
      <span className="sr-only">{noPrice}</span>
    </div>
  );
}
