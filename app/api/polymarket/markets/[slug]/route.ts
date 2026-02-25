import { NextRequest, NextResponse } from "next/server";
import { GAMMA_API_URL } from "@/lib/utils/constants";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const res = await fetch(`${GAMMA_API_URL}/markets/slug/${slug}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 30 },
    });
    if (!res.ok) {
      return NextResponse.json({ error: "Market not found" }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to fetch market" }, { status: 500 });
  }
}
