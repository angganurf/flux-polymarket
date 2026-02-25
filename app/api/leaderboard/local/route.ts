import { prisma } from "@/lib/db";
import { logError } from "@/lib/logger";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
  const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10), 0);

  try {
    // Get all users who have bets on resolved events
    const usersWithStats = await prisma.user.findMany({
      where: {
        bets: {
          some: {
            event: { status: "resolved" },
          },
        },
      },
      select: {
        id: true,
        name: true,
        image: true,
        bets: {
          where: {
            event: { status: "resolved" },
          },
          select: {
            amount: true,
            payout: true,
          },
        },
      },
    });

    // Calculate stats per user
    const ranked = usersWithStats
      .map((user) => {
        const totalBets = user.bets.length;
        const wins = user.bets.filter(
          (b) => b.payout !== null && b.payout > b.amount
        ).length;
        const losses = totalBets - wins;
        const totalWagered = user.bets.reduce((sum, b) => sum + b.amount, 0);
        const totalPayout = user.bets.reduce(
          (sum, b) => sum + (b.payout ?? 0),
          0
        );
        const profit = totalPayout - totalWagered;
        const winRate = totalBets > 0 ? wins / totalBets : 0;

        return {
          id: user.id,
          name: user.name,
          image: user.image,
          totalBets,
          wins,
          losses,
          totalWagered,
          totalPayout,
          profit,
          winRate,
        };
      })
      .sort((a, b) => b.profit - a.profit);

    const total = ranked.length;
    const paged = ranked.slice(offset, offset + limit).map((u, i) => ({
      rank: offset + i + 1,
      name: u.name,
      image: u.image,
      totalBets: u.totalBets,
      wins: u.wins,
      winRate: u.winRate,
      profit: u.profit,
    }));

    return NextResponse.json({ users: paged, total });
  } catch (error) {
    logError("Local leaderboard error", error, { path: "/api/leaderboard/local" });
    return NextResponse.json(
      { error: "Failed to fetch local leaderboard" },
      { status: 500 }
    );
  }
}
