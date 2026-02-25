"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowLeft, Coins, Users, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/format";
import { ShareButtons } from "@/components/shared/share-buttons";
import { CommentSection } from "@/components/predict/comment-section";

interface BetEntry {
  id: string;
  choice: string;
  amount: number;
  payout: number | null;
  createdAt: string;
  user: { id: string; name: string | null };
}

interface EventDetail {
  id: string;
  title: string;
  description: string | null;
  category: string;
  endDate: string;
  status: string;
  result: string | null;
  creator: { id: string; name: string | null };
  bets: BetEntry[];
  yesProbability: number;
  noProbability: number;
  totalVolume: number;
  yesVolume: number;
  noVolume: number;
  totalBets: number;
}

interface PredictionDetailViewProps {
  id: string;
}

export function PredictionDetailView({ id }: PredictionDetailViewProps) {
  const t = useTranslations("predict");
  const { data: session } = useSession();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [betChoice, setBetChoice] = useState<"yes" | "no" | null>(null);
  const [betAmount, setBetAmount] = useState("100");
  const [betting, setBetting] = useState(false);
  const [betError, setBetError] = useState("");

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      const res = await fetch(`/api/events/${id}`);
      if (res.ok) {
        setEvent(await res.json());
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  const handleBet = async () => {
    if (!betChoice || !betAmount) return;
    setBetError("");
    setBetting(true);
    try {
      const res = await fetch("/api/bets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: id,
          choice: betChoice,
          amount: parseInt(betAmount),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setBetError(data.error || "Failed to place bet");
      } else {
        setBetChoice(null);
        setBetAmount("100");
        fetchEvent();
      }
    } catch {
      setBetError("Something went wrong");
    } finally {
      setBetting(false);
    }
  };

  const handleResolve = async (result: "yes" | "no") => {
    if (!confirm(`Resolve as ${result.toUpperCase()}?`)) return;
    try {
      const res = await fetch(`/api/events/${id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result }),
      });
      if (res.ok) fetchEvent();
    } catch {
      /* ignore */
    }
  };

  // Build share URL (client-side)
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 animate-pulse">
        <div className="h-6 w-48 rounded bg-border mb-6" />
        <div className="h-8 w-3/4 rounded bg-border mb-4" />
        <div className="h-40 rounded-xl bg-surface" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-muted">Prediction not found</p>
        <Link href="/predict" className="mt-4 inline-block text-primary">
          Back to Predictions
        </Link>
      </div>
    );
  }

  const yesPercent = Math.round(event.yesProbability * 100);
  const isActive =
    event.status === "active" && new Date(event.endDate) > new Date();
  const isCreator = session?.user?.id === event.creator.id;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href="/predict"
        className="flex items-center gap-1 text-sm text-muted hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      {/* Share buttons */}
      <div className="mb-4">
        <ShareButtons url={shareUrl} title={event.title} />
      </div>

      {/* Header */}
      <h1 className="text-2xl font-bold text-foreground">{event.title}</h1>
      {event.description && (
        <p className="mt-2 text-sm text-muted">{event.description}</p>
      )}

      {/* Result banner */}
      {event.status === "resolved" && (
        <div
          className={cn(
            "mt-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium",
            event.result === "yes"
              ? "bg-yes/10 text-yes"
              : "bg-no/10 text-no"
          )}
        >
          {event.result === "yes" ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <XCircle className="h-5 w-5" />
          )}
          {t("resolved")}: {event.result?.toUpperCase()}
        </div>
      )}

      {/* Probability */}
      <div className="mt-6">
        <div className="flex items-center gap-6 mb-3">
          <span className="text-3xl font-bold text-yes">{yesPercent}% Yes</span>
          <span className="text-3xl font-bold text-no">
            {100 - yesPercent}% No
          </span>
        </div>
        <div className="flex h-3 overflow-hidden rounded-full bg-background">
          <div
            className="bg-yes transition-all"
            style={{ width: `${yesPercent}%` }}
          />
          <div
            className="bg-no transition-all"
            style={{ width: `${100 - yesPercent}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-surface p-3 text-center">
          <Coins className="mx-auto h-4 w-4 text-primary mb-1" />
          <p className="text-lg font-bold text-foreground">
            {event.totalVolume.toLocaleString()}
          </p>
          <p className="text-xs text-muted">{t("totalPool")}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-3 text-center">
          <Users className="mx-auto h-4 w-4 text-primary mb-1" />
          <p className="text-lg font-bold text-foreground">{event.totalBets}</p>
          <p className="text-xs text-muted">{t("participants")}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-3 text-center">
          <p className="text-xs text-muted mb-1">{t("endDate")}</p>
          <p className="text-sm font-medium text-foreground">
            {formatDate(event.endDate)}
          </p>
        </div>
      </div>

      {/* Bet panel */}
      {isActive && session && (
        <div className="mt-6 rounded-xl border border-border bg-surface p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            {t("placeBet")}
          </h3>

          {betError && (
            <div className="mb-3 rounded-lg bg-no/10 px-3 py-2 text-xs text-no">
              {betError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={() => setBetChoice("yes")}
              className={cn(
                "rounded-xl py-3 text-sm font-semibold transition-all border-2",
                betChoice === "yes"
                  ? "border-yes bg-yes/10 text-yes"
                  : "border-border text-muted hover:border-yes/50 hover:text-yes"
              )}
            >
              YES
            </button>
            <button
              onClick={() => setBetChoice("no")}
              className={cn(
                "rounded-xl py-3 text-sm font-semibold transition-all border-2",
                betChoice === "no"
                  ? "border-no bg-no/10 text-no"
                  : "border-border text-muted hover:border-no/50 hover:text-no"
              )}
            >
              NO
            </button>
          </div>

          {betChoice && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted">{t("amount")}</label>
                <input
                  type="number"
                  min="10"
                  step="10"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                />
                <p className="mt-1 text-xs text-muted">{t("minBet")}</p>
              </div>
              <button
                onClick={handleBet}
                disabled={betting || parseInt(betAmount) < 10}
                className={cn(
                  "w-full rounded-xl py-3 text-sm font-semibold text-white transition-colors disabled:opacity-50",
                  betChoice === "yes"
                    ? "bg-yes hover:bg-yes/90"
                    : "bg-no hover:bg-no/90"
                )}
              >
                {betting
                  ? "..."
                  : `${t("confirm")} ${betChoice.toUpperCase()} - ${betAmount} pts`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Resolve buttons for creator */}
      {isActive && isCreator && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            onClick={() => handleResolve("yes")}
            className="rounded-xl border-2 border-yes bg-yes/10 py-2.5 text-sm font-medium text-yes hover:bg-yes/20"
          >
            {t("resolveYes")}
          </button>
          <button
            onClick={() => handleResolve("no")}
            className="rounded-xl border-2 border-no bg-no/10 py-2.5 text-sm font-medium text-no hover:bg-no/20"
          >
            {t("resolveNo")}
          </button>
        </div>
      )}

      {/* Recent bets */}
      {event.bets.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Recent Predictions
          </h3>
          <div className="space-y-2">
            {event.bets.slice(0, 20).map((bet) => (
              <div
                key={bet.id}
                className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-2.5"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-xs font-bold px-2 py-0.5 rounded",
                      bet.choice === "yes"
                        ? "bg-yes/10 text-yes"
                        : "bg-no/10 text-no"
                    )}
                  >
                    {bet.choice.toUpperCase()}
                  </span>
                  <span className="text-sm text-muted">
                    {bet.user.name || "Anonymous"}
                  </span>
                </div>
                <span className="text-sm font-medium text-foreground">
                  {bet.amount} pts
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comments */}
      <CommentSection eventId={id} />
    </div>
  );
}
