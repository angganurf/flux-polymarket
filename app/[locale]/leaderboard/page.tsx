"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useLeaderboard } from "@/lib/hooks/use-leaderboard";
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";
import { LeaderboardFilters } from "@/components/leaderboard/leaderboard-filters";

export default function LeaderboardPage() {
  const t = useTranslations("leaderboard");
  const [category, setCategory] = useState("OVERALL");
  const [period, setPeriod] = useState("ALL");

  const { data, isLoading } = useLeaderboard({
    category,
    timePeriod: period,
    limit: 25,
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-bold text-foreground">{t("title")}</h1>

      <div className="mt-6">
        <LeaderboardFilters
          selectedCategory={category}
          selectedPeriod={period}
          onCategoryChange={setCategory}
          onPeriodChange={setPeriod}
        />
      </div>

      <div className="mt-6">
        <LeaderboardTable entries={data ?? []} isLoading={isLoading} />
      </div>
    </div>
  );
}
