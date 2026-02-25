"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Plus, Users, Coins } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePredictionEvents } from "@/lib/hooks/use-prediction-events";

export default function PredictionsPage() {
  const t = useTranslations("predict");
  const { data: session } = useSession();
  const [category, setCategory] = useState("all");
  const { data: events = [], isLoading: loading } = usePredictionEvents({ status: "active", category });

  const categories = [
    { id: "all", label: t("categories.general") },
    { id: "politics", label: t("categories.politics") },
    { id: "sports", label: t("categories.sports") },
    { id: "crypto", label: t("categories.crypto") },
    { id: "entertainment", label: t("categories.entertainment") },
    { id: "technology", label: t("categories.technology") },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">{t("title")}</h1>
        {session && (
          <Link
            href="/predict/create"
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
          >
            <Plus className="h-4 w-4" />
            {t("createNew")}
          </Link>
        )}
      </div>

      {/* Category filter */}
      <div className="mt-6 flex flex-wrap gap-1">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              category === cat.id
                ? "bg-primary text-white"
                : "bg-surface text-muted hover:text-foreground hover:bg-surface-hover"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Events grid */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-surface p-5 animate-pulse">
                <div className="h-5 w-3/4 rounded bg-border mb-3" />
                <div className="h-3 w-1/2 rounded bg-border mb-4" />
                <div className="h-2 rounded-full bg-border" />
              </div>
            ))
          : events.map((event) => {
              const yesPercent = Math.round(event.yesProbability * 100);
              const isEnded = new Date(event.endDate) < new Date();
              return (
                <Link
                  key={event.id}
                  href={`/predict/${event.id}`}
                  className="group block rounded-xl border border-border bg-surface p-5 transition-all hover:border-border hover:bg-surface-hover"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="text-sm font-medium text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                      {event.title}
                    </h3>
                    <span
                      className={cn(
                        "shrink-0 rounded px-2 py-0.5 text-[10px] font-medium",
                        event.status === "resolved"
                          ? "bg-muted/20 text-muted"
                          : isEnded
                          ? "bg-no/10 text-no"
                          : "bg-yes/10 text-yes"
                      )}
                    >
                      {event.status === "resolved"
                        ? t("resolved")
                        : isEnded
                        ? t("ended")
                        : t("active")}
                    </span>
                  </div>

                  {/* Probability bar */}
                  <div className="mb-3">
                    <div className="mb-1 flex justify-between text-xs font-semibold">
                      <span className="text-yes">{yesPercent}% Yes</span>
                      <span className="text-no">{100 - yesPercent}% No</span>
                    </div>
                    <div className="flex h-2 overflow-hidden rounded-full bg-background">
                      <div className="bg-yes/80" style={{ width: `${yesPercent}%` }} />
                      <div className="bg-no/80" style={{ width: `${100 - yesPercent}%` }} />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted">
                    <span className="flex items-center gap-1">
                      <Coins className="h-3 w-3" />
                      {event.totalVolume.toLocaleString()} pts
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {event.totalBets}
                    </span>
                  </div>
                </Link>
              );
            })}
      </div>

      {!loading && events.length === 0 && (
        <div className="py-20 text-center text-muted">
          {t("empty")}
        </div>
      )}
    </div>
  );
}
