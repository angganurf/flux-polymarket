import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(Math.max(1, parseInt(searchParams.get("limit") || "20") || 20), 100);
  const offset = parseInt(searchParams.get("offset") || "0") || 0;

  try {
    const eventInclude = {
      select: {
        id: true,
        title: true,
        status: true,
        result: true,
        endDate: true,
        category: true,
      },
    };

    // Fetch paginated bets for display AND all bets for stats in parallel
    const [bets, allBets, total] = await Promise.all([
      prisma.bet.findMany({
        where: { userId: session.user.id },
        include: { event: eventInclude },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.bet.findMany({
        where: { userId: session.user.id },
        include: { event: eventInclude },
        orderBy: { createdAt: "desc" },
      }),
      prisma.bet.count({ where: { userId: session.user.id } }),
    ]);

    // Stats computed over ALL bets, not just the current page
    const totalBets = allBets.length;
    const activeBets = allBets.filter((b) => b.event.status === "active").length;
    const resolvedBets = allBets.filter((b) => b.event.status === "resolved");
    const wonBets = resolvedBets.filter(
      (b) => b.payout !== null && b.payout > 0
    ).length;
    const lostBets = resolvedBets.filter(
      (b) => b.payout === null || b.payout === 0
    ).length;
    const totalWagered = allBets.reduce((sum, b) => sum + b.amount, 0);
    const totalPayout = allBets.reduce((sum, b) => sum + (b.payout ?? 0), 0);

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
      total,
      limit,
      offset,
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
