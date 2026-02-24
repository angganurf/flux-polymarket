import { NextRequest, NextResponse } from "next/server";
import { CLOB_API_URL } from "@/lib/utils/constants";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams.toString();
  try {
    const res = await fetch(`${CLOB_API_URL}/prices-history?${searchParams}`, {
      headers: { "Accept": "application/json" },
    });
    if (!res.ok) {
      return NextResponse.json({ error: "Upstream error" }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to fetch price history" }, { status: 500 });
  }
}
