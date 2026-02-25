import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(Math.max(1, parseInt(searchParams.get("limit") || "50") || 50), 100);
  const offset = parseInt(searchParams.get("offset") || "0") || 0;

  try {
    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { eventId: id },
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.comment.count({ where: { eventId: id } }),
    ]);

    return NextResponse.json({ comments, total, limit, offset });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const trimmed = content.trim();
    if (trimmed.length === 0) {
      return NextResponse.json(
        { error: "Content cannot be empty" },
        { status: 400 }
      );
    }

    if (trimmed.length > 1000) {
      return NextResponse.json(
        { error: "Content must be 1000 characters or less" },
        { status: 400 }
      );
    }

    // Verify event exists
    const event = await prisma.predictionEvent.findUnique({
      where: { id },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const comment = await prisma.comment.create({
      data: {
        content: trimmed.replace(/<[^>]*>/g, ""),
        userId: session.user.id,
        eventId: id,
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
