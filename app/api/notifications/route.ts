import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserNotifications, markAllAsRead } from "@/lib/notifications";

/**
 * GET /api/notifications — Fetch paginated notifications for the authenticated user.
 * Query params: ?limit=20&offset=0
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(
    Math.max(1, parseInt(searchParams.get("limit") || "20") || 20),
    50
  );
  const offset = Math.max(
    0,
    parseInt(searchParams.get("offset") || "0") || 0
  );

  try {
    const data = await getUserNotifications(session.user.id, limit, offset);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications — Perform bulk actions.
 * Body: { action: "mark_all_read" }
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (body.action === "mark_all_read") {
      await markAllAsRead(session.user.id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch {
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
