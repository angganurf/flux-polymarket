import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { logInfo, logError, createTimer } from "@/lib/logger";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const elapsed = createTimer();
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const { id } = await params;
  const { result } = await request.json();

  if (result !== "yes" && result !== "no") {
    return NextResponse.json({ error: "Result must be 'yes' or 'no'" }, { status: 400 });
  }

  try {
    // Check if user is creator or admin
    const user = await prisma.user.findUnique({ where: { id: userId } });

    // Settle everything inside a single transaction to prevent double-resolution
    const settlement = await prisma.$transaction(async (tx) => {
      // Atomically claim the event: only update if still active
      const updated = await tx.predictionEvent.updateMany({
        where: { id, status: "active" },
        data: { status: "resolved", result },
      });

      // If no rows updated, the event was already resolved (or doesn't exist)
      if (updated.count === 0) {
        throw new Error("ALREADY_RESOLVED");
      }

      // Now fetch the event with bets for payout calculation
      const event = await tx.predictionEvent.findUnique({
        where: { id },
        include: { bets: true },
      });

      if (!event) {
        throw new Error("EVENT_NOT_FOUND");
      }

      // Verify authorization
      if (event.creatorId !== userId && user?.role !== "admin") {
        // Rollback by throwing — transaction will revert the status change
        throw new Error("FORBIDDEN");
      }

      // Calculate payouts
      const winningBets = event.bets.filter((b) => b.choice === result);
      const losingBets = event.bets.filter((b) => b.choice !== result);
      const totalPool = event.bets.reduce((sum, b) => sum + b.amount, 0);
      const winningPool = winningBets.reduce((sum, b) => sum + b.amount, 0);

      // Set payout=0 for losers
      if (losingBets.length > 0) {
        await tx.bet.updateMany({
          where: { id: { in: losingBets.map((b) => b.id) } },
          data: { payout: 0 },
        });
      }

      // Pay winners proportionally from total pool
      const winnerPayouts: { userId: string; payout: number }[] = [];
      for (const bet of winningBets) {
        const payout = winningPool > 0
          ? Math.round((bet.amount / winningPool) * totalPool)
          : bet.amount;

        await tx.bet.update({
          where: { id: bet.id },
          data: { payout },
        });

        await tx.user.update({
          where: { id: bet.userId },
          data: { points: { increment: payout } },
        });

        winnerPayouts.push({ userId: bet.userId, payout });
      }

      return {
        result,
        eventTitle: event.title,
        eventId: event.id,
        winnerPayouts,
        loserUserIds: losingBets.map((b) => b.userId),
      };
    });

    // Send notifications to all bettors (fire-and-forget, don't block response)
    const notificationPromises: Promise<unknown>[] = [];

    // Notify winners
    const uniqueWinners = new Map<string, number>();
    for (const w of settlement.winnerPayouts) {
      uniqueWinners.set(
        w.userId,
        (uniqueWinners.get(w.userId) || 0) + w.payout
      );
    }
    for (const [winnerId, payout] of uniqueWinners) {
      notificationPromises.push(
        createNotification({
          userId: winnerId,
          type: "bet_result",
          title: "You won!",
          message: `You earned ${payout} points from "${settlement.eventTitle}"`,
          link: `/predict/${settlement.eventId}`,
        })
      );
    }

    // Notify losers (deduplicate by userId)
    const uniqueLoserIds = [...new Set(settlement.loserUserIds)];
    for (const loserId of uniqueLoserIds) {
      notificationPromises.push(
        createNotification({
          userId: loserId,
          type: "bet_result",
          title: "Better luck next time",
          message: `The prediction "${settlement.eventTitle}" was resolved as ${settlement.result.toUpperCase()}`,
          link: `/predict/${settlement.eventId}`,
        })
      );
    }

    // Don't await — notifications are non-critical
    Promise.allSettled(notificationPromises).catch(() => {});

    logInfo("Event resolved", {
      path: `/api/events/${id}/resolve`,
      userId,
      eventId: id,
      result: settlement.result,
      duration: elapsed(),
    });
    return NextResponse.json({ success: true, result: settlement.result });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "ALREADY_RESOLVED") {
        return NextResponse.json({ error: "Event already resolved" }, { status: 400 });
      }
      if (error.message === "EVENT_NOT_FOUND") {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }
      if (error.message === "FORBIDDEN") {
        return NextResponse.json({ error: "Only creator or admin can resolve" }, { status: 403 });
      }
    }
    logError("Event resolution failed", error, { path: `/api/events/${id}/resolve`, userId });
    return NextResponse.json({ error: "Failed to resolve event" }, { status: 500 });
  }
}
