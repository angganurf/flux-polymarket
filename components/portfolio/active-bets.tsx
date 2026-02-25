"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Activity } from "lucide-react";

interface BetWithEvent {
  id: string;
  choice: string;
  amount: number;
  payout: number | null;
  createdAt: string;
  event: {
    id: string;
    title: string;
    status: string;
    result: string | null;
    endDate: string;
    category: string;
  };
}

interface ActiveBetsProps {
  bets: BetWithEvent[];
}

export function ActiveBets({ bets }: ActiveBetsProps) {
  const t = useTranslations("portfolio");

  if (bets.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-8 text-center text-muted">
        <Activity className="mx-auto mb-2 h-6 w-6" />
        <p>{t("noActive")}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {bets.map((bet) => (
        <Link
          key={bet.id}
          href={`/predict/${bet.event.id}`}
          className="group block rounded-xl border border-border bg-surface p-4 transition-all hover:bg-surface-hover"
        >
          <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
            {bet.event.title}
          </h4>
          <div className="flex items-center gap-3 text-xs text-muted">
            <span
              className={cn(
                "rounded px-2 py-0.5 text-[10px] font-semibold uppercase",
                bet.choice === "yes"
                  ? "bg-yes/10 text-yes"
                  : "bg-no/10 text-no"
              )}
            >
              {bet.choice}
            </span>
            <span>{bet.amount.toLocaleString()} pts</span>
            <span className="ml-auto rounded px-2 py-0.5 bg-yellow-500/10 text-yellow-500 text-[10px] font-medium">
              {t("statuses.active")}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
