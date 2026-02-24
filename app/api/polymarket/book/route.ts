import { NextRequest, NextResponse } from "next/server";
import { CLOB_API_URL } from "@/lib/utils/constants";

export async function GET(request: NextRequest) {
  const tokenId = request.nextUrl.searchParams.get("token_id");
  if (!tokenId) {
    return NextResponse.json({ error: "token_id required" }, { status: 400 });
  }
  try {
    const res = await fetch(`${CLOB_API_URL}/book?token_id=${tokenId}`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      return NextResponse.json({ error: "Upstream error" }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch order book" },
      { status: 500 }
    );
  }
}
