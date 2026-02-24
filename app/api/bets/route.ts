import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { eventId, choice, amount } = await request.json();

    if (!eventId || !choice || !amount) {
      return NextResponse.json(
        { error: "eventId, choice, and amount are required" },
        { status: 400 }
      );
    }

    if (choice !== "yes" && choice !== "no") {
      return NextResponse.json({ error: "Choice must be 'yes' or 'no'" }, { status: 400 });
    }

    if (amount < 10) {
      return NextResponse.json({ error: "Minimum bet is 10 points" }, { status: 400 });
    }

    // Check event is active
    const event = await prisma.predictionEvent.findUnique({
      where: { id: eventId },
    });

    if (!event || event.status !== "active") {
      return NextResponse.json({ error: "Event is not active" }, { status: 400 });
    }

    if (new Date() > event.endDate) {
      return NextResponse.json({ error: "Event has ended" }, { status: 400 });
    }

    // Check user has enough points
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || user.points < amount) {
      return NextResponse.json({ error: "Not enough points" }, { status: 400 });
    }

    // Create bet and deduct points in transaction
    const userId = session.user.id;
    const bet = await prisma.$transaction(async (tx) => {
      // Deduct points
      await tx.user.update({
        where: { id: userId },
        data: { points: { decrement: amount } },
      });

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

    return NextResponse.json(bet, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to place bet" }, { status: 500 });
  }
}
