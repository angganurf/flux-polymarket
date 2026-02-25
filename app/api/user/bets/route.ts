import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const bets = await prisma.bet.findMany({
      where: { userId: session.user.id },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            status: true,
            result: true,
            endDate: true,
            category: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const totalBets = bets.length;
    const activeBets = bets.filter((b) => b.event.status === "active").length;
    const resolvedBets = bets.filter((b) => b.event.status === "resolved");
    const wonBets = resolvedBets.filter(
      (b) => b.payout !== null && b.payout > 0
    ).length;
    const lostBets = resolvedBets.filter(
      (b) => b.payout === null || b.payout === 0
    ).length;
    const totalWagered = bets.reduce((sum, b) => sum + b.amount, 0);
    const totalPayout = bets.reduce((sum, b) => sum + (b.payout ?? 0), 0);

    const resolvedWagered = resolvedBets.reduce(
      (sum, b) => sum + b.amount,
      0
    );
    const resolvedPayout = resolvedBets.reduce(
      (sum, b) => sum + (b.payout ?? 0),
      0
    );
    const pnl = resolvedPayout - resolvedWagered;

    const winRate =
      wonBets + lostBets > 0 ? wonBets / (wonBets + lostBets) : 0;

    return NextResponse.json({
      bets,
      stats: {
        totalBets,
        activeBets,
        wonBets,
        lostBets,
        totalWagered,
        totalPayout,
        pnl,
        winRate,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch bets" },
      { status: 500 }
    );
  }
}
