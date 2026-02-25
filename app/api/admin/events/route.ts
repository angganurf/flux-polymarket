import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(Math.max(1, parseInt(searchParams.get("limit") || "20") || 20), 100);
  const offset = parseInt(searchParams.get("offset") || "0") || 0;
  const status = searchParams.get("status") || "all";

  try {
    const where: Record<string, unknown> = {};
    if (status !== "all") {
      where.status = status;
    }

    const [events, total] = await Promise.all([
      prisma.predictionEvent.findMany({
        where,
        include: {
          creator: { select: { id: true, name: true } },
          _count: { select: { bets: true, comments: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.predictionEvent.count({ where }),
    ]);

    // Get bet volume for each event
    const eventIds = events.map((e) => e.id);
    const betVolumes = await prisma.bet.groupBy({
      by: ["eventId"],
      where: { eventId: { in: eventIds } },
      _sum: { amount: true },
    });

    const volumeMap = new Map(
      betVolumes.map((b) => [b.eventId, b._sum.amount ?? 0])
    );

    const enrichedEvents = events.map((event) => ({
      ...event,
      totalVolume: volumeMap.get(event.id) ?? 0,
    }));

    return NextResponse.json({ events: enrichedEvents, total, limit, offset });
  } catch {
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { eventId, action, result } = await request.json();

    if (!eventId || !action) {
      return NextResponse.json(
        { error: "eventId and action are required" },
        { status: 400 }
      );
    }

    if (action === "resolve") {
      if (result !== "yes" && result !== "no") {
        return NextResponse.json(
          { error: "result must be 'yes' or 'no'" },
          { status: 400 }
        );
      }

      // Resolve the event and pay out winners in a transaction
      await prisma.$transaction(async (tx) => {
        // Update event status
        await tx.predictionEvent.update({
          where: { id: eventId },
          data: { status: "resolved", result },
        });

        // Get all bets for this event
        const bets = await tx.bet.findMany({
          where: { eventId },
        });

        const winningBets = bets.filter((b) => b.choice === result);
        const losingBets = bets.filter((b) => b.choice !== result);

        const totalPool =
          winningBets.reduce((s, b) => s + b.amount, 0) +
          losingBets.reduce((s, b) => s + b.amount, 0);
        const winnerPool = winningBets.reduce((s, b) => s + b.amount, 0);

        // Pay out winners proportionally
        for (const bet of winningBets) {
          const payout =
            winnerPool > 0
              ? Math.round((bet.amount / winnerPool) * totalPool)
              : bet.amount;

          await tx.bet.update({
            where: { id: bet.id },
            data: { payout },
          });

          await tx.user.update({
            where: { id: bet.userId },
            data: { points: { increment: payout } },
          });
        }

        // Mark losing bets with 0 payout
        for (const bet of losingBets) {
          await tx.bet.update({
            where: { id: bet.id },
            data: { payout: 0 },
          });
        }
      });

      return NextResponse.json({ success: true, action: "resolved", result });
    }

    if (action === "cancel") {
      // Cancel the event and refund all bets
      await prisma.$transaction(async (tx) => {
        await tx.predictionEvent.update({
          where: { id: eventId },
          data: { status: "cancelled" },
        });

        // Refund all bets
        const bets = await tx.bet.findMany({ where: { eventId } });

        for (const bet of bets) {
          await tx.bet.update({
            where: { id: bet.id },
            data: { payout: bet.amount },
          });

          await tx.user.update({
            where: { id: bet.userId },
            data: { points: { increment: bet.amount } },
          });
        }
      });

      return NextResponse.json({ success: true, action: "cancelled" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}
