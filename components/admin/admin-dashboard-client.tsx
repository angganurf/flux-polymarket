"use client";

import { useTranslations } from "next-intl";
import {
  Users,
  Calendar,
  TrendingUp,
  Coins,
  UserPlus,
  BarChart3,
} from "lucide-react";

interface Stats {
  totalUsers: number;
  totalEvents: number;
  totalBets: number;
  pointsInCirculation: number;
  totalWagered: number;
  activeEvents: number;
  resolvedEvents: number;
  usersToday: number;
  betsToday: number;
}

interface RecentUser {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  points: number;
  createdAt: string;
}

interface RecentBet {
  id: string;
  choice: string;
  amount: number;
  payout: number | null;
  createdAt: string;
  user: { id: string; name: string | null };
  event: { id: string; title: string };
}

export function AdminDashboardClient({
  stats,
  recentUsers,
  recentBets,
}: {
  stats: Stats;
  recentUsers: RecentUser[];
  recentBets: RecentBet[];
}) {
  const t = useTranslations("admin");

  const statCards = [
    {
      label: t("totalUsers"),
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      sub: `+${stats.usersToday} ${t("today")}`,
      color: "text-primary",
    },
    {
      label: t("activeEvents"),
      value: stats.activeEvents.toLocaleString(),
      icon: Calendar,
      sub: `${stats.resolvedEvents} resolved`,
      color: "text-yes",
    },
    {
      label: t("totalBets"),
      value: stats.totalBets.toLocaleString(),
      icon: TrendingUp,
      sub: `+${stats.betsToday} ${t("today")}`,
      color: "text-yellow-500",
    },
    {
      label: t("pointsCirculation"),
      value: stats.pointsInCirculation.toLocaleString(),
      icon: Coins,
      sub: `${stats.totalWagered.toLocaleString()} wagered`,
      color: "text-orange-500",
    },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">{t("dashboard")}</h1>

      {/* Stat cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-xl border border-border bg-surface p-5"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted">{card.label}</p>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
              <p className="mt-2 text-2xl font-bold text-foreground">{card.value}</p>
              <p className="mt-1 text-xs text-muted">{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent users */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="mb-4 flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">{t("recentUsers")}</h2>
          </div>
          <div className="space-y-3">
            {recentUsers.length === 0 ? (
              <p className="text-sm text-muted">{t("noResults")}</p>
            ) : (
              recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {user.name || "Anonymous"}
                    </p>
                    <p className="text-xs text-muted">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {user.role}
                    </span>
                    <p className="mt-0.5 text-xs text-muted">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent bets */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-yes" />
            <h2 className="text-sm font-semibold text-foreground">{t("recentBets")}</h2>
          </div>
          <div className="space-y-3">
            {recentBets.length === 0 ? (
              <p className="text-sm text-muted">{t("noResults")}</p>
            ) : (
              recentBets.map((bet) => (
                <div
                  key={bet.id}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {bet.event.title}
                    </p>
                    <p className="text-xs text-muted">
                      {bet.user.name || "Anonymous"} &middot;{" "}
                      <span
                        className={
                          bet.choice === "yes" ? "text-yes" : "text-no"
                        }
                      >
                        {bet.choice.toUpperCase()}
                      </span>
                    </p>
                  </div>
                  <div className="ml-3 text-right shrink-0">
                    <p className="text-sm font-semibold text-foreground">
                      {bet.amount.toLocaleString()} pts
                    </p>
                    <p className="text-xs text-muted">
                      {new Date(bet.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
