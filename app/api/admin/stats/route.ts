import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalUsers,
      totalEvents,
      totalBets,
      pointsAgg,
      activeEvents,
      resolvedEvents,
      usersToday,
      betsToday,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.predictionEvent.count(),
      prisma.bet.count(),
      prisma.user.aggregate({ _sum: { points: true } }),
      prisma.predictionEvent.count({ where: { status: "active" } }),
      prisma.predictionEvent.count({ where: { status: "resolved" } }),
      prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.bet.count({ where: { createdAt: { gte: todayStart } } }),
    ]);

    // Total points wagered (in bets) to calculate total circulation
    const totalWagered = await prisma.bet.aggregate({ _sum: { amount: true } });

    return NextResponse.json({
      totalUsers,
      totalEvents,
      totalBets,
      pointsInCirculation: pointsAgg._sum.points ?? 0,
      totalWagered: totalWagered._sum.amount ?? 0,
      activeEvents,
      resolvedEvents,
      usersToday,
      betsToday,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
