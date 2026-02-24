import { NextRequest, NextResponse } from "next/server";
import { DATA_API_URL } from "@/lib/utils/constants";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams.toString();
  try {
    const res = await fetch(`${DATA_API_URL}/v1/leaderboard?${searchParams}`, {
      headers: { "Accept": "application/json" },
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      return NextResponse.json({ error: "Upstream error" }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
