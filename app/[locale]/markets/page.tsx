"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useEvents, useMarketSearch } from "@/lib/hooks/use-markets";
import { MarketList } from "@/components/markets/market-list";
import { MarketFilters } from "@/components/markets/market-filters";
import { MarketSearch } from "@/components/markets/market-search";

export default function MarketsPage() {
  const t = useTranslations("markets");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("volume24hr");
  const [searchQuery, setSearchQuery] = useState("");

  // Map UI category IDs to Gamma API tag slugs
  const CATEGORY_TO_TAG: Record<string, string> = {
    politics: "politics",
    sports: "sports",
    crypto: "crypto",
    "pop-culture": "culture",
    science: "science",
    business: "business",
  };
  const activeTag = category !== "all" ? CATEGORY_TO_TAG[category] : undefined;

  // Search mode vs browse mode
  const searchResults = useMarketSearch(searchQuery);
  const browseResults = useEvents({
    active: true,
    closed: false,
    limit: 30,
    order: sort,
    ascending: false,
    tag: activeTag,
  });

  const isSearching = searchQuery.length > 1;
  const events = isSearching ? searchResults.data : browseResults.data;
  const isLoading = isSearching ? searchResults.isLoading : browseResults.isLoading;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold text-foreground">{t("title")}</h1>

      <div className="mt-6 space-y-4">
        <MarketSearch value={searchQuery} onChange={setSearchQuery} />

        {!isSearching && (
          <MarketFilters
            selectedCategory={category}
            selectedSort={sort}
            onCategoryChange={setCategory}
            onSortChange={setSort}
          />
        )}
      </div>

      <div className="mt-6">
        <MarketList events={events ?? []} isLoading={isLoading} />
      </div>
    </div>
  );
}
