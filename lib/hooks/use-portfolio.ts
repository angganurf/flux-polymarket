import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
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

interface PortfolioData {
  bets: BetWithEvent[];
  stats: Stats;
}

async function fetchPortfolio(): Promise<PortfolioData> {
  const res = await fetch("/api/user/bets");
  if (!res.ok) throw new Error("Failed to fetch portfolio");
  return res.json();
}

export function usePortfolio() {
  const { status } = useSession();
  return useQuery({
    queryKey: ["portfolio"],
    queryFn: fetchPortfolio,
    enabled: status === "authenticated",
    staleTime: 60_000,
  });
}
