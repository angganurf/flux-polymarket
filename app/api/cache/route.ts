import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { apiCache } from "@/lib/cache";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
