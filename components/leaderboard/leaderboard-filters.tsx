"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { LEADERBOARD_CATEGORIES, LEADERBOARD_PERIODS } from "@/lib/utils/constants";

interface LeaderboardFiltersProps {
  selectedCategory: string;
  selectedPeriod: string;
  onCategoryChange: (category: string) => void;
  onPeriodChange: (period: string) => void;
}

export function LeaderboardFilters({
  selectedCategory,
  selectedPeriod,
  onCategoryChange,
  onPeriodChange,
}: LeaderboardFiltersProps) {
  const t = useTranslations("leaderboard");

  const categoryLabels: Record<string, string> = {
    OVERALL: t("categories.overall"),
    POLITICS: t("categories.politics"),
    SPORTS: t("categories.sports"),
    CRYPTO: t("categories.crypto"),
    CULTURE: t("culture"),
  };

  const periodLabels: Record<string, string> = {
    DAY: t("periods.day"),
    WEEK: t("periods.week"),
    MONTH: t("periods.month"),
    ALL: t("periods.all"),
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-1">
        {LEADERBOARD_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              selectedCategory === cat
                ? "bg-primary text-white"
                : "bg-surface text-muted hover:text-foreground hover:bg-surface-hover"
            )}
          >
            {categoryLabels[cat] || cat}
          </button>
        ))}
      </div>
      <div className="flex gap-1">
        {LEADERBOARD_PERIODS.map((period) => (
          <button
            key={period}
            onClick={() => onPeriodChange(period)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              selectedPeriod === period
                ? "bg-primary text-white"
                : "bg-surface text-muted hover:text-foreground hover:bg-surface-hover"
            )}
          >
            {periodLabels[period] || period}
          </button>
        ))}
      </div>
    </div>
  );
}
