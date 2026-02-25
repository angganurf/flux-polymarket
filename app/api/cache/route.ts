import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { apiCache } from "@/lib/cache";

export async function POST(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const pattern = body?.pattern as string | undefined;
    const invalidated = apiCache.invalidate(pattern);
    return NextResponse.json({ invalidated });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
