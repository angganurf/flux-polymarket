"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { CATEGORIES, SORT_OPTIONS } from "@/lib/utils/constants";

interface MarketFiltersProps {
  selectedCategory: string;
  selectedSort: string;
  onCategoryChange: (category: string) => void;
  onSortChange: (sort: string) => void;
}

export function MarketFilters({
  selectedCategory,
  selectedSort,
  onCategoryChange,
  onSortChange,
}: MarketFiltersProps) {
  const t = useTranslations("markets");

  const categoryTranslations: Record<string, string> = {
    all: t("filters.all"),
    politics: t("filters.politics"),
    sports: t("filters.sports"),
    crypto: t("filters.crypto"),
    "pop-culture": t("filters.culture"),
    science: t("filters.science"),
  };

  const sortTranslations: Record<string, string> = {
    volume_24hr: t("sort.volume"),
    liquidity: t("sort.liquidity"),
    start_date: t("sort.newest"),
    end_date: t("sort.ending"),
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Category tabs */}
      <div className="flex flex-wrap gap-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onCategoryChange(cat.id)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              selectedCategory === cat.id
                ? "bg-primary text-white"
                : "bg-surface text-muted hover:text-foreground hover:bg-surface-hover"
            )}
          >
            {categoryTranslations[cat.id] || cat.label}
          </button>
        ))}
      </div>

      {/* Sort select */}
      <select
        value={selectedSort}
        onChange={(e) => onSortChange(e.target.value)}
        className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-foreground outline-none focus:border-primary"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {sortTranslations[opt.id] || opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
