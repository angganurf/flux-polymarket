"use client";

import { useOrderBook } from "@/lib/hooks/use-market-detail";
import { useTranslations } from "next-intl";

interface OrderBookProps {
  tokenId: string;
}

export function OrderBook({ tokenId }: OrderBookProps) {
  const { data, isLoading } = useOrderBook(tokenId);
  const t = useTranslations("market");

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-surface p-4 animate-pulse">
        <div className="h-4 w-24 rounded bg-border mb-4" />
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-3 rounded bg-border" />
          ))}
        </div>
      </div>
    );
  }

  const bids = (data?.bids ?? []).slice(0, 8);
  const asks = (data?.asks ?? []).slice(0, 8);
  const maxSize = Math.max(
    ...bids.map((b) => parseFloat(b.size)),
    ...asks.map((a) => parseFloat(a.size)),
    1
  );

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <h3 className="mb-4 text-sm font-semibold text-foreground">
        {t("orderBook")}
      </h3>

      <div className="grid grid-cols-2 gap-4">
        {/* Bids (Buy/YES) */}
        <div>
          <div className="mb-2 grid grid-cols-2 text-xs text-muted">
            <span>{t("price")}</span>
            <span className="text-right">{t("size")}</span>
          </div>
          <div className="space-y-0.5">
            {bids.map((bid, i) => {
              const size = parseFloat(bid.size);
              const width = (size / maxSize) * 100;
              return (
                <div key={i} className="relative grid grid-cols-2 py-0.5 text-xs">
                  <div
                    className="absolute inset-y-0 left-0 bg-yes/10"
                    style={{ width: `${width}%` }}
                  />
                  <span className="relative text-yes">
                    {(parseFloat(bid.price) * 100).toFixed(1)}¢
                  </span>
                  <span className="relative text-right text-muted">
                    {size.toFixed(0)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Asks (Sell/NO) */}
        <div>
          <div className="mb-2 grid grid-cols-2 text-xs text-muted">
            <span>{t("price")}</span>
            <span className="text-right">{t("size")}</span>
          </div>
          <div className="space-y-0.5">
            {asks.map((ask, i) => {
              const size = parseFloat(ask.size);
              const width = (size / maxSize) * 100;
              return (
                <div key={i} className="relative grid grid-cols-2 py-0.5 text-xs">
                  <div
                    className="absolute inset-y-0 right-0 bg-no/10"
                    style={{ width: `${width}%` }}
                  />
                  <span className="relative text-no">
                    {(parseFloat(ask.price) * 100).toFixed(1)}¢
                  </span>
                  <span className="relative text-right text-muted">
                    {size.toFixed(0)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
