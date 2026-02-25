"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/format";
import { BetWithEvent } from "@/lib/types/portfolio";

interface BetHistoryProps {
  bets: BetWithEvent[];
}

function getBetStatus(bet: BetWithEvent): "active" | "won" | "lost" | "pending" {
  if (bet.event.status === "active") return "active";
  if (bet.event.status === "resolved") {
    if (bet.payout !== null && bet.payout > 0) return "won";
    return "lost";
  }
  return "pending";
}

const statusStyles: Record<string, string> = {
  active: "bg-yellow-500/10 text-yellow-500",
  won: "bg-yes/10 text-yes",
  lost: "bg-no/10 text-no",
  pending: "bg-muted/20 text-muted",
};

export function BetHistory({ bets }: BetHistoryProps) {
  const t = useTranslations("portfolio");

  if (bets.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-8 text-center text-muted">
        {t("empty")}
      </div>
    );
  }

  return (
    <div>
      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-xl border border-border bg-surface md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="px-4 py-3 font-medium">{t("date")}</th>
              <th className="px-4 py-3 font-medium">{t("market")}</th>
              <th className="px-4 py-3 font-medium">{t("choice")}</th>
              <th className="px-4 py-3 font-medium">{t("amount")}</th>
              <th className="px-4 py-3 font-medium">{t("status")}</th>
              <th className="px-4 py-3 font-medium">{t("payout")}</th>
            </tr>
          </thead>
          <tbody>
            {bets.map((bet) => {
              const status = getBetStatus(bet);
              return (
                <tr
                  key={bet.id}
                  className="border-b border-border last:border-0 transition-colors hover:bg-surface-hover"
                >
                  <td className="px-4 py-3 text-muted whitespace-nowrap">
                    {formatDate(bet.createdAt)}
                  </td>
                  <td className="px-4 py-3 max-w-[250px]">
                    <Link
                      href={`/predict/${bet.event.id}`}
                      className="text-foreground hover:text-primary transition-colors line-clamp-1"
                    >
                      {bet.event.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-block rounded px-2 py-0.5 text-xs font-semibold uppercase",
                        bet.choice === "yes"
                          ? "bg-yes/10 text-yes"
                          : "bg-no/10 text-no"
                      )}
                    >
                      {bet.choice}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-foreground whitespace-nowrap">
                    {bet.amount.toLocaleString()} pts
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-block rounded px-2 py-0.5 text-xs font-medium",
                        statusStyles[status]
                      )}
                    >
                      {t(`statuses.${status}`)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-foreground whitespace-nowrap">
                    {bet.payout !== null
                      ? `${bet.payout.toLocaleString()} pts`
                      : "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {bets.map((bet) => {
          const status = getBetStatus(bet);
          return (
            <div
              key={bet.id}
              className="rounded-xl border border-border bg-surface p-4"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <Link
                  href={`/predict/${bet.event.id}`}
                  className="text-sm font-medium text-foreground hover:text-primary transition-colors line-clamp-2"
                >
                  {bet.event.title}
                </Link>
                <span
                  className={cn(
                    "shrink-0 rounded px-2 py-0.5 text-xs font-medium",
                    statusStyles[status]
                  )}
                >
                  {t(`statuses.${status}`)}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted">
                <span>{formatDate(bet.createdAt)}</span>
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                    bet.choice === "yes"
                      ? "bg-yes/10 text-yes"
                      : "bg-no/10 text-no"
                  )}
                >
                  {bet.choice}
                </span>
                <span>{bet.amount.toLocaleString()} pts</span>
                {bet.payout !== null && (
                  <span className="ml-auto text-foreground">
                    {t("payout")}: {bet.payout.toLocaleString()} pts
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
