import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { result } = await request.json();

  if (result !== "yes" && result !== "no") {
    return NextResponse.json({ error: "Result must be 'yes' or 'no'" }, { status: 400 });
  }

  try {
    const event = await prisma.predictionEvent.findUnique({
      where: { id },
      include: { bets: true },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.status !== "active") {
      return NextResponse.json({ error: "Event already resolved" }, { status: 400 });
    }

    // Check if user is creator or admin
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (event.creatorId !== session.user.id && user?.role !== "admin") {
      return NextResponse.json({ error: "Only creator or admin can resolve" }, { status: 403 });
    }

    // Calculate payouts
    const winningBets = event.bets.filter((b) => b.choice === result);
    const losingBets = event.bets.filter((b) => b.choice !== result);
    const totalPool = event.bets.reduce((sum, b) => sum + b.amount, 0);
    const winningPool = winningBets.reduce((sum, b) => sum + b.amount, 0);

    // Settle in a transaction
    await prisma.$transaction(async (tx) => {
      // Update event status
      await tx.predictionEvent.update({
        where: { id },
        data: { status: "resolved", result },
      });

      // Set payout=0 for losers
      for (const bet of losingBets) {
        await tx.bet.update({
          where: { id: bet.id },
          data: { payout: 0 },
        });
      }

      // Pay winners proportionally from total pool
      for (const bet of winningBets) {
        const payout = winningPool > 0
          ? Math.round((bet.amount / winningPool) * totalPool)
          : bet.amount; // refund if no winners somehow

        await tx.bet.update({
          where: { id: bet.id },
          data: { payout },
        });

        // Add payout to user's points
        await tx.user.update({
          where: { id: bet.userId },
          data: { points: { increment: payout } },
        });
      }
    });

    return NextResponse.json({ success: true, result });
  } catch {
    return NextResponse.json({ error: "Failed to resolve event" }, { status: 500 });
  }
}
