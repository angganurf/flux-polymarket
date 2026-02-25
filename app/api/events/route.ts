import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET - List events with aggregated bet data
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status") || "active";
  const category = searchParams.get("category");
  const limit = Math.min(Math.max(1, parseInt(searchParams.get("limit") || "20") || 20), 100);
  const offset = parseInt(searchParams.get("offset") || "0") || 0;

  try {
    const where: Record<string, unknown> = {};
    if (status !== "all") where.status = status;
    if (category && category !== "all") where.category = category;

    // Fetch events WITHOUT loading all bets (no N+1)
    const events = await prisma.predictionEvent.findMany({
      where,
      include: {
        creator: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    if (events.length === 0) {
      return NextResponse.json([]);
    }

    // Single aggregation query for all events' bet volumes
    const betStats = await prisma.bet.groupBy({
      by: ["eventId", "choice"],
      where: { eventId: { in: events.map((e) => e.id) } },
      _sum: { amount: true },
      _count: true,
    });

    // Build lookup map: eventId -> { yes, no, count }
    const statsMap = new Map<string, { yes: number; no: number; count: number }>();
    for (const event of events) {
      statsMap.set(event.id, { yes: 0, no: 0, count: 0 });
    }
    for (const stat of betStats) {
      const entry = statsMap.get(stat.eventId);
      if (!entry) continue;
      if (stat.choice === "yes") entry.yes = stat._sum?.amount ?? 0;
      if (stat.choice === "no") entry.no = stat._sum?.amount ?? 0;
      entry.count += stat._count;
    }

    // Enrich events with computed probabilities
    const eventsWithProbability = events.map((event) => {
      const stats = statsMap.get(event.id) ?? { yes: 0, no: 0, count: 0 };
      const total = stats.yes + stats.no;
      const yesProbability = total > 0 ? stats.yes / total : 0.5;

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
        totalBets: stats.count,
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
