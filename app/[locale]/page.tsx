"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useEvents } from "@/lib/hooks/use-markets";
import { MarketCard } from "@/components/markets/market-card";
import { formatVolume } from "@/lib/utils/format";
import { BarChart3, TrendingUp, Users, Layers, ArrowRight, Zap, Globe, Shield } from "lucide-react";

export default function HomePage() {
  const t = useTranslations("home");

  // Fetch trending (high volume) markets
  const { data: trendingEvents } = useEvents({
    active: true,
    closed: false,
    limit: 6,
    order: "volume24hr",
    ascending: false,
  });

  const trendingMarkets = (trendingEvents ?? []).flatMap((e) => e.markets).slice(0, 6);

  // Calculate aggregate stats
  const allMarkets = (trendingEvents ?? []).flatMap((e) => e.markets);
  const totalVolume = allMarkets.reduce((sum, m) => sum + m.volume, 0);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border">
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[800px] bg-primary/5 rounded-full blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-xs text-muted mb-6">
            <Zap className="h-3 w-3 text-primary" />
            Real-time prediction market analytics
          </div>

          <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
            {t("title")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-xl text-muted">
            {t("description")}
          </p>

          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              href="/markets"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              {t("viewAll")}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/leaderboard"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover"
            >
              Leaderboard
            </Link>
          </div>

          {/* Stats bar */}
          <div className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard icon={TrendingUp} label={t("stats.totalVolume")} value={formatVolume(totalVolume || 15_000_000_000)} />
            <StatCard icon={Layers} label={t("stats.activeMarkets")} value={allMarkets.length > 0 ? `${allMarkets.length}+` : "1,200+"} />
            <StatCard icon={Users} label={t("stats.traders")} value="250K+" />
            <StatCard icon={BarChart3} label={t("stats.categories")} value="10+" />
          </div>
        </div>
      </section>

      {/* Trending Markets */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{t("trending")}</h2>
            <p className="mt-1 text-sm text-muted">Most active markets right now</p>
          </div>
          <Link
            href="/markets"
            className="flex items-center gap-1 text-sm text-primary hover:text-primary-hover transition-colors"
          >
            {t("viewAll")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {trendingMarkets.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trendingMarkets.map((market) => (
              <MarketCard key={market.id} market={market} />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-surface p-4 animate-pulse">
                <div className="space-y-2 mb-3">
                  <div className="h-4 w-3/4 rounded bg-border" />
                  <div className="h-4 w-1/2 rounded bg-border" />
                </div>
                <div className="h-2 rounded-full bg-border mb-3" />
                <div className="flex gap-4">
                  <div className="h-3 w-16 rounded bg-border" />
                  <div className="h-3 w-16 rounded bg-border" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Features Section */}
      <section className="border-t border-border bg-surface/30">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <h2 className="text-center text-2xl font-bold text-foreground">
            Why PredictFlow?
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            <FeatureCard
              icon={Zap}
              title="Real-time Data"
              description="Live WebSocket feeds from prediction markets. See probabilities change in real-time."
            />
            <FeatureCard
              icon={Globe}
              title="Global Markets"
              description="Track politics, sports, crypto, culture and more. All in one dashboard."
            />
            <FeatureCard
              icon={Shield}
              title="Transparent Analytics"
              description="Open data, clear methodology. Powered by on-chain prediction market data."
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 text-center">
      <Icon className="mx-auto h-5 w-5 text-primary mb-2" />
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted mt-1">{label}</p>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: React.ComponentType<{ className?: string }>; title: string; description: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6 text-center">
      <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-xs leading-relaxed text-muted">{description}</p>
    </div>
  );
}
