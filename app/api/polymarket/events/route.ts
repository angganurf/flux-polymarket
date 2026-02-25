import { NextRequest, NextResponse } from "next/server";
import { GAMMA_API_URL } from "@/lib/utils/constants";
import { filterProxyParams } from "@/lib/api/proxy-params";

export async function GET(request: NextRequest) {
  const filtered = filterProxyParams(request.nextUrl.searchParams, "events");
  try {
    const res = await fetch(`${GAMMA_API_URL}/events?${filtered}`, {
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
