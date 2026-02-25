import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET - List events with aggregated bet data
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status") || "active";
  const category = searchParams.get("category");
  const limit = Math.min(Math.max(1, parseInt(searchParams.get("limit") || "20") || 20), 100);
  const offset = parseInt(searchParams.get("offset") || "0");

  try {
    const where: Record<string, unknown> = {};
    if (status !== "all") where.status = status;
    if (category && category !== "all") where.category = category;

    const events = await prisma.predictionEvent.findMany({
      where,
      include: {
        creator: { select: { id: true, name: true, image: true } },
        bets: { select: { choice: true, amount: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    // Calculate probabilities from bets
    const eventsWithProbability = events.map((event) => {
      const yesTotal = event.bets
        .filter((b) => b.choice === "yes")
        .reduce((sum, b) => sum + b.amount, 0);
      const noTotal = event.bets
        .filter((b) => b.choice === "no")
        .reduce((sum, b) => sum + b.amount, 0);
      const total = yesTotal + noTotal;
      const yesProbability = total > 0 ? yesTotal / total : 0.5;
      const totalBets = event.bets.length;

      return {
        id: event.id,
        title: event.title,
        description: event.description,
        category: event.category,
        imageUrl: event.imageUrl,
        endDate: event.endDate,
        status: event.status,
        result: event.result,
        creator: event.creator,
        createdAt: event.createdAt,
        yesProbability,
        noProbability: 1 - yesProbability,
        totalVolume: total,
        totalBets,
      };
    });

    return NextResponse.json(eventsWithProbability);
  } catch {
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

// POST - Create a new event
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title, description, category, endDate } = await request.json();

    if (!title || !endDate) {
      return NextResponse.json(
        { error: "Title and end date are required" },
        { status: 400 }
      );
    }

    // Sanitize inputs: strip HTML tags, enforce max length
    const sanitizedTitle = String(title).replace(/<[^>]*>/g, "").trim().slice(0, 200);
    const sanitizedDescription = description
      ? String(description).replace(/<[^>]*>/g, "").trim().slice(0, 2000)
      : null;

    if (!sanitizedTitle) {
      return NextResponse.json(
        { error: "Title cannot be empty after sanitization" },
        { status: 400 }
      );
    }

    const event = await prisma.predictionEvent.create({
      data: {
        title: sanitizedTitle,
        description: sanitizedDescription,
        category: category || "general",
        endDate: new Date(endDate),
        creatorId: session.user.id,
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
