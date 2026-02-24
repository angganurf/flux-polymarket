import { NextRequest, NextResponse } from "next/server";
import { GAMMA_API_URL } from "@/lib/utils/constants";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") || "";
  try {
    const res = await fetch(`${GAMMA_API_URL}/public-search?q=${encodeURIComponent(q)}`, {
      headers: { "Accept": "application/json" },
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      return NextResponse.json({ error: "Search failed" }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to search" }, { status: 500 });
  }
}
