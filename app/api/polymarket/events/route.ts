import { NextRequest, NextResponse } from "next/server";
import { GAMMA_API_URL } from "@/lib/utils/constants";
import { filterProxyParams } from "@/lib/api/proxy-params";
import { cachedProxyFetch } from "@/lib/api/cached-fetch";

export async function GET(request: NextRequest) {
  const filtered = filterProxyParams(request.nextUrl.searchParams, "events");
  try {
    return await cachedProxyFetch(
      `events:${filtered}`,
      "EVENTS_LIST",
      () =>
        fetch(`${GAMMA_API_URL}/events?${filtered}`, {
          headers: { "Accept": "application/json" },
        })
    );
  } catch {
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}
