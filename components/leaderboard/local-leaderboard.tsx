"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Trophy } from "lucide-react";

interface LocalLeaderboardUser {
  rank: number;
  name: string | null;
  image: string | null;
  totalBets: number;
  wins: number;
  winRate: number;
  profit: number;
}

interface LocalLeaderboardResponse {
  users: LocalLeaderboardUser[];
  total: number;
}

async function fetchLocalLeaderboard(
  limit = 20,
  offset = 0
): Promise<LocalLeaderboardResponse> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  const res = await fetch(`/api/leaderboard/local?${params}`);
  if (!res.ok) throw new Error("Failed to fetch local leaderboard");
  return res.json();
}

export function LocalLeaderboard() {
  const t = useTranslations("leaderboard");
  const tCommon = useTranslations("common");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["leaderboard-local"],
    queryFn: () => fetchLocalLeaderboard(25),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="p-4 space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 animate-pulse">
              <div className="h-4 w-8 rounded bg-border" />
              <div className="h-8 w-8 rounded-full bg-border" />
              <div className="h-4 w-32 rounded bg-border" />
              <div className="ml-auto h-4 w-16 rounded bg-border" />
              <div className="h-4 w-16 rounded bg-border" />
              <div className="h-4 w-20 rounded bg-border" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-border bg-surface py-20 text-center text-muted">
        {tCommon("error")}
      </div>
    );
  }

  const users = data?.users ?? [];

  if (users.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface py-20 text-center text-muted">
        {t("noResolvedData")}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      {/* Header */}
      <div className="hidden sm:grid grid-cols-12 gap-4 border-b border-border px-4 py-3 text-xs font-medium text-muted">
        <div className="col-span-1">{t("rank")}</div>
        <div className="col-span-4">{t("localUser")}</div>
        <div className="col-span-2 text-right">{t("localTotalBets")}</div>
        <div className="col-span-2 text-right">{t("localWinRate")}</div>
        <div className="col-span-3 text-right">{t("localProfit")}</div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-border/50">
        {users.map((user) => (
          <div
            key={`${user.rank}-${user.name}`}
            className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-surface-hover transition-colors"
          >
            {/* Rank */}
            <div className="col-span-1">
              {user.rank <= 3 ? (
                <RankBadge rank={user.rank} />
              ) : (
                <span className="text-sm text-muted">{user.rank}</span>
              )}
            </div>

            {/* User */}
            <div className="col-span-4 flex items-center gap-3 min-w-0">
              {user.image ? (
                <img
                  src={user.image}
                  alt=""
                  className="h-8 w-8 rounded-full bg-border"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-border flex items-center justify-center text-xs text-muted">
                  {(user.name || "?")[0]}
                </div>
              )}
              <span className="text-sm font-medium text-foreground truncate">
                {user.name || tCommon("anonymous")}
              </span>
            </div>

            {/* Total Bets */}
            <div className="col-span-2 text-right">
              <span className="text-sm text-muted">
                {user.totalBets}
              </span>
            </div>

            {/* Win Rate */}
            <div className="col-span-2 text-right">
              <span className="text-sm text-muted">
                {(user.winRate * 100).toFixed(1)}%
              </span>
            </div>

            {/* Profit */}
            <div className="col-span-3 text-right">
              <span
                className={cn(
                  "text-sm font-semibold",
                  user.profit >= 0 ? "text-yes" : "text-no"
                )}
              >
                {user.profit >= 0 ? "+" : ""}
                {user.profit.toLocaleString()} {t("localPoints")}
              </span>
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
