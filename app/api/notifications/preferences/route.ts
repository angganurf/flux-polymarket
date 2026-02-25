import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOrCreatePreferences } from "@/lib/notifications";
import { prisma } from "@/lib/db";

/**
 * GET /api/notifications/preferences — Get notification preferences for authenticated user.
 * Creates default preferences if none exist.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const prefs = await getOrCreatePreferences(session.user.id);
    return NextResponse.json(prefs);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/notifications/preferences — Update notification preferences.
 * Body: { inAppEnabled?, emailEnabled?, betResults?, eventResolved?, commentReplies?, systemAlerts? }
 */
export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Only allow known boolean fields
    const allowedFields = [
      "inAppEnabled",
      "emailEnabled",
      "betResults",
      "eventResolved",
      "commentReplies",
      "systemAlerts",
    ] as const;

    const updateData: Record<string, boolean> = {};
    for (const field of allowedFields) {
      if (typeof body[field] === "boolean") {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields provided" },
        { status: 400 }
      );
    }

    // Upsert: create if not exist, update if exists
    const prefs = await prisma.notificationPreference.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        ...updateData,
      },
      update: updateData,
    });

    return NextResponse.json(prefs);
  } catch {
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}
