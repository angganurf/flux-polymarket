"use client";

import { useTranslations } from "next-intl";
import { TrendingUp, Target, Coins, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface Stats {
  totalBets: number;
  activeBets: number;
  wonBets: number;
  lostBets: number;
  totalWagered: number;
  totalPayout: number;
  pnl: number;
  winRate: number;
}

interface PortfolioStatsProps {
  stats: Stats;
}

export function PortfolioStats({ stats }: PortfolioStatsProps) {
  const t = useTranslations("portfolio.stats");

  const cards = [
    {
      label: t("totalBets"),
      value: stats.totalBets.toLocaleString(),
      icon: Target,
      color: "text-primary",
    },
    {
      label: t("winRate"),
      value: `${(stats.winRate * 100).toFixed(1)}%`,
      icon: TrendingUp,
      color:
        stats.winRate > 0.5
          ? "text-yes"
          : stats.winRate < 0.5 && stats.winRate > 0
            ? "text-no"
            : "text-muted",
    },
    {
      label: t("pnl"),
      value: `${stats.pnl >= 0 ? "+" : ""}${stats.pnl.toLocaleString()}`,
      icon: Coins,
      color: stats.pnl > 0 ? "text-yes" : stats.pnl < 0 ? "text-no" : "text-muted",
    },
    {
      label: t("activeBets"),
      value: stats.activeBets.toLocaleString(),
      icon: Activity,
      color: "text-primary",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-border bg-surface p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <card.icon className={cn("h-4 w-4", card.color)} />
            <span className="text-xs text-muted">{card.label}</span>
          </div>
          <p className={cn("text-xl font-bold", card.color)}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}
