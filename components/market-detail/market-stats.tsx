"use client";

import { useTranslations } from "next-intl";
import { useOpenInterest } from "@/lib/hooks/use-market-detail";
import { formatVolume, formatDate } from "@/lib/utils/format";
import type { ParsedMarket } from "@/lib/api/types";

interface MarketStatsProps {
  market: ParsedMarket;
}

export function MarketStats({ market }: MarketStatsProps) {
  const t = useTranslations("market");
  const { data: oiData } = useOpenInterest(market.conditionId);
  const openInterest = oiData?.[0]?.value;

  const stats = [
    { label: t("volume"), value: formatVolume(market.volume) },
    { label: t("volume24h"), value: formatVolume(market.volume24h) },
    { label: t("liquidity"), value: formatVolume(market.liquidity) },
    ...(openInterest != null
      ? [{ label: t("openInterest"), value: formatVolume(openInterest) }]
      : []),
    ...(market.endDate
      ? [{ label: t("endDate"), value: formatDate(market.endDate) }]
      : []),
  ];

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label}>
            <p className="text-xs text-muted">{stat.label}</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
