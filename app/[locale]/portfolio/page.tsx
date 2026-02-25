"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PortfolioStats } from "@/components/portfolio/portfolio-stats";
import { BetHistory } from "@/components/portfolio/bet-history";
import { ActiveBets } from "@/components/portfolio/active-bets";
import { BetWithEvent } from "@/lib/types/portfolio";

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

export default function PortfolioPage() {
  const t = useTranslations("portfolio");
  const tAuth = useTranslations("auth");
  const { data: session, status: sessionStatus } = useSession();
  const [bets, setBets] = useState<BetWithEvent[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      fetchBets();
    } else if (sessionStatus === "unauthenticated") {
      setLoading(false);
    }
  }, [sessionStatus]);

  const fetchBets = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/bets");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setBets(data.bets ?? []);
      setStats(data.stats ?? null);
    } catch {
      setBets([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  // Unauthenticated state
  if (sessionStatus === "unauthenticated") {
    return (
      <div className="mx-auto max-w-5xl px-4 py-20 text-center">
        <p className="text-lg text-muted mb-4">{t("loginRequired")}</p>
        <Link
          href="/login"
          className="inline-block rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
        >
          {tAuth("login")}
        </Link>
      </div>
    );
  }

  // Loading skeleton
  if (loading || sessionStatus === "loading") {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="h-8 w-40 rounded bg-border animate-pulse mb-8" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-surface p-4 animate-pulse"
            >
              <div className="h-3 w-20 rounded bg-border mb-3" />
              <div className="h-6 w-16 rounded bg-border" />
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-border bg-surface p-5 animate-pulse">
          <div className="h-4 w-32 rounded bg-border mb-4" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 rounded bg-border mb-2" />
          ))}
        </div>
      </div>
    );
  }

  const activeBets = bets.filter((b) => b.event.status === "active");

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-bold text-foreground mb-8">{t("title")}</h1>

      {/* Stats overview */}
      {stats && (
        <div className="mb-8">
          <PortfolioStats stats={stats} />
        </div>
      )}

      {/* Active positions */}
      {activeBets.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            {t("stats.activeBets")}
          </h2>
          <ActiveBets bets={activeBets} />
        </div>
      )}

      {/* Bet history */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">
          {t("history")}
        </h2>
        <BetHistory bets={bets} />
      </div>
    </div>
  );
}
