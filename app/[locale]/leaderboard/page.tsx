"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useLeaderboard } from "@/lib/hooks/use-leaderboard";
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";
import { LeaderboardFilters } from "@/components/leaderboard/leaderboard-filters";

const LocalLeaderboard = dynamic(
  () =>
    import("@/components/leaderboard/local-leaderboard").then(
      (mod) => mod.LocalLeaderboard
    ),
  {
    loading: () => (
      <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 animate-pulse">
            <div className="h-4 w-8 rounded bg-border" />
            <div className="h-8 w-8 rounded-full bg-border" />
            <div className="h-4 w-32 rounded bg-border" />
            <div className="ml-auto h-4 w-20 rounded bg-border" />
          </div>
        ))}
      </div>
    ),
  }
);

type Tab = "polymarket" | "predictflow";

export default function LeaderboardPage() {
  const t = useTranslations("leaderboard");
  const [activeTab, setActiveTab] = useState<Tab>("polymarket");
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

      {/* Tab switcher */}
      <div className="mt-6 flex gap-1 rounded-lg bg-surface p-1 w-fit">
        <button
          onClick={() => setActiveTab("polymarket")}
          className={cn(
            "rounded-md px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "polymarket"
              ? "bg-primary text-white"
              : "text-muted hover:text-foreground hover:bg-surface-hover"
          )}
        >
          {t("polymarketTab")}
        </button>
        <button
          onClick={() => setActiveTab("predictflow")}
          className={cn(
            "rounded-md px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "predictflow"
              ? "bg-primary text-white"
              : "text-muted hover:text-foreground hover:bg-surface-hover"
          )}
        >
          {t("predictflowTab")}
        </button>
      </div>

      {activeTab === "polymarket" ? (
        <>
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
        </>
      ) : (
        <div className="mt-6">
          <LocalLeaderboard />
        </div>
      )}
    </div>
  );
}
