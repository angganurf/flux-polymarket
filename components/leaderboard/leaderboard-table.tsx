"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { formatVolume, formatUSD } from "@/lib/utils/format";
import type { LeaderboardEntry } from "@/lib/api/types";
import { Trophy } from "lucide-react";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  isLoading?: boolean;
}

export function LeaderboardTable({ entries, isLoading }: LeaderboardTableProps) {
  const t = useTranslations("leaderboard");

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="p-4 space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 animate-pulse">
              <div className="h-4 w-8 rounded bg-border" />
              <div className="h-8 w-8 rounded-full bg-border" />
              <div className="h-4 w-32 rounded bg-border" />
              <div className="ml-auto h-4 w-20 rounded bg-border" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface py-20 text-center text-muted">
        No data available
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      {/* Table header */}
      <div className="grid grid-cols-12 gap-4 border-b border-border px-4 py-3 text-xs font-medium text-muted">
        <div className="col-span-1">{t("rank")}</div>
        <div className="col-span-5">{t("trader")}</div>
        <div className="col-span-3 text-right">{t("pnl")}</div>
        <div className="col-span-3 text-right">{t("volume")}</div>
      </div>

      {/* Table rows */}
      <div className="divide-y divide-border/50">
        {entries.map((entry) => (
          <div
            key={entry.proxyWallet}
            className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-surface-hover transition-colors"
          >
            {/* Rank */}
            <div className="col-span-1">
              {entry.rank <= 3 ? (
                <RankBadge rank={entry.rank} />
              ) : (
                <span className="text-sm text-muted">{entry.rank}</span>
              )}
            </div>

            {/* Trader */}
            <div className="col-span-5 flex items-center gap-3 min-w-0">
              {entry.profileImage ? (
                <img
                  src={entry.profileImage}
                  alt=""
                  className="h-8 w-8 rounded-full bg-border"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-border flex items-center justify-center text-xs text-muted">
                  {(entry.userName || "?")[0]}
                </div>
              )}
              <span className="text-sm font-medium text-foreground truncate">
                {entry.userName ||
                  `${entry.proxyWallet.slice(0, 6)}...${entry.proxyWallet.slice(-4)}`}
              </span>
            </div>

            {/* PnL */}
            <div className="col-span-3 text-right">
              <span
                className={cn(
                  "text-sm font-semibold",
                  entry.pnl >= 0 ? "text-yes" : "text-no"
                )}
              >
                {entry.pnl >= 0 ? "+" : ""}
                {formatUSD(entry.pnl)}
              </span>
            </div>

            {/* Volume */}
            <div className="col-span-3 text-right">
              <span className="text-sm text-muted">{formatVolume(entry.vol)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const colors: Record<number, string> = {
    1: "text-yellow-500",
    2: "text-gray-400",
    3: "text-amber-700",
  };
  return <Trophy className={cn("h-5 w-5", colors[rank])} />;
}
