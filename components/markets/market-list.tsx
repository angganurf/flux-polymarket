"use client";

import { useTranslations } from "next-intl";
import type { ParsedEvent } from "@/lib/api/types";
import { MarketCard } from "./market-card";

interface MarketListProps {
  events: ParsedEvent[];
  isLoading?: boolean;
}

export function MarketList({ events, isLoading }: MarketListProps) {
  const t = useTranslations("markets");

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <MarketCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Flatten events to get all markets
  const markets = events.flatMap((event) =>
    event.markets.length > 0 ? event.markets : []
  );

  if (markets.length === 0) {
    return (
      <div className="py-20 text-center text-muted">{t("noResults")}</div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {markets.map((market) => (
        <MarketCard key={market.id} market={market} />
      ))}
    </div>
  );
}

function MarketCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 animate-pulse">
      <div className="mb-3 space-y-2">
        <div className="h-4 w-3/4 rounded bg-border" />
        <div className="h-4 w-1/2 rounded bg-border" />
      </div>
      <div className="mb-3">
        <div className="h-2 rounded-full bg-border" />
      </div>
      <div className="flex gap-4">
        <div className="h-3 w-16 rounded bg-border" />
        <div className="h-3 w-16 rounded bg-border" />
      </div>
    </div>
  );
}
