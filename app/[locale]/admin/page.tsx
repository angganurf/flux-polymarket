import { prisma } from "@/lib/db";
import { AdminDashboardClient } from "@/components/admin/admin-dashboard-client";

export default async function AdminDashboardPage() {
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
    totalWagered,
    recentUsers,
    recentBets,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.predictionEvent.count(),
    prisma.bet.count(),
    prisma.user.aggregate({ _sum: { points: true } }),
    prisma.predictionEvent.count({ where: { status: "active" } }),
    prisma.predictionEvent.count({ where: { status: "resolved" } }),
    prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.bet.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.bet.aggregate({ _sum: { amount: true } }),
    prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true, points: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.bet.findMany({
      include: {
        user: { select: { id: true, name: true } },
        event: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const stats = {
    totalUsers,
    totalEvents,
    totalBets,
    pointsInCirculation: pointsAgg._sum.points ?? 0,
    totalWagered: totalWagered._sum.amount ?? 0,
    activeEvents,
    resolvedEvents,
    usersToday,
    betsToday,
  };

  return (
    <AdminDashboardClient
      stats={stats}
      recentUsers={recentUsers.map((u) => ({
        ...u,
        createdAt: u.createdAt.toISOString(),
      }))}
      recentBets={recentBets.map((b) => ({
        ...b,
        createdAt: b.createdAt.toISOString(),
      }))}
    />
  );
}
