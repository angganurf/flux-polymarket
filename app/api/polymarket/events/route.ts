import { NextRequest, NextResponse } from "next/server";
import { GAMMA_API_URL } from "@/lib/utils/constants";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams.toString();
  try {
    const res = await fetch(`${GAMMA_API_URL}/events?${searchParams}`, {
      headers: { "Accept": "application/json" },
      next: { revalidate: 30 },
    });
    if (!res.ok) {
      return NextResponse.json({ error: "Upstream error" }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}
