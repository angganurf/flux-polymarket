import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const event = await prisma.predictionEvent.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true, image: true } },
        bets: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const yesTotal = event.bets
      .filter((b) => b.choice === "yes")
      .reduce((sum, b) => sum + b.amount, 0);
    const noTotal = event.bets
      .filter((b) => b.choice === "no")
      .reduce((sum, b) => sum + b.amount, 0);
    const total = yesTotal + noTotal;
    const yesProbability = total > 0 ? yesTotal / total : 0.5;

    return NextResponse.json({
      ...event,
      yesProbability,
      noProbability: 1 - yesProbability,
      totalVolume: total,
      yesVolume: yesTotal,
      noVolume: noTotal,
      totalBets: event.bets.length,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 });
  }
}
