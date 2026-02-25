import { NextRequest, NextResponse } from "next/server";
import { GAMMA_API_URL } from "@/lib/utils/constants";
import { isValidSlug } from "@/lib/api/proxy-params";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!isValidSlug(slug)) {
    return NextResponse.json({ error: "Invalid slug format" }, { status: 400 });
  }
  try {
    const res = await fetch(`${GAMMA_API_URL}/events/slug/${encodeURIComponent(slug)}`, {
      headers: { "Accept": "application/json" },
      next: { revalidate: 30 },
    });
    if (!res.ok) {
      return NextResponse.json({ error: "Event not found" }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 });
  }
}
