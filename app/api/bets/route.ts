import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logInfo, logError, createTimer } from "@/lib/logger";

export async function POST(request: NextRequest) {
  const elapsed = createTimer();
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { eventId, choice, amount } = body;

    if (!eventId || !choice || amount == null) {
      return NextResponse.json(
        { error: "eventId, choice, and amount are required" },
        { status: 400 }
      );
    }

    if (choice !== "yes" && choice !== "no") {
      return NextResponse.json(
        { error: "Choice must be 'yes' or 'no'" },
        { status: 400 }
      );
    }

    // Validate amount: must be a positive integer within bounds
    if (
      typeof amount !== "number" ||
      !Number.isInteger(amount) ||
      amount < 10 ||
      amount > 100000
    ) {
      return NextResponse.json(
        { error: "Amount must be an integer between 10 and 100,000" },
        { status: 400 }
      );
    }

    // Check event is active
    const event = await prisma.predictionEvent.findUnique({
      where: { id: eventId },
    });

    if (!event || event.status !== "active") {
      return NextResponse.json(
        { error: "Event is not active" },
        { status: 400 }
      );
    }

    if (new Date() > event.endDate) {
      return NextResponse.json(
        { error: "Event has ended" },
        { status: 400 }
      );
    }

    // Create bet and deduct points in transaction with optimistic locking
    const userId = session.user.id;
    const bet = await prisma.$transaction(async (tx) => {
      // Atomic balance check + deduction: only deducts if points >= amount
      const updated = await tx.user.updateMany({
        where: { id: userId, points: { gte: amount } },
        data: { points: { decrement: amount } },
      });

      if (updated.count === 0) {
        throw new Error("INSUFFICIENT_POINTS");
      }

      // Create bet
      return tx.bet.create({
        data: {
          userId,
          eventId,
          choice,
          amount,
        },
      });
    });

    logInfo("Bet placed", { path: "/api/bets", userId, eventId, amount, duration: elapsed() });
    return NextResponse.json(bet, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "INSUFFICIENT_POINTS") {
      return NextResponse.json(
        { error: "Not enough points" },
        { status: 400 }
      );
    }
    logError("Bet placement failed", error, { path: "/api/bets", userId: session.user.id });
    return NextResponse.json(
      { error: "Failed to place bet" },
      { status: 500 }
    );
  }
}
