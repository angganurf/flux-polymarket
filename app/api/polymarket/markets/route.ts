import { NextRequest, NextResponse } from "next/server";
import { GAMMA_API_URL } from "@/lib/utils/constants";
import { filterProxyParams } from "@/lib/api/proxy-params";
import { cachedProxyFetch } from "@/lib/api/cached-fetch";

export async function GET(request: NextRequest) {
  const filtered = filterProxyParams(request.nextUrl.searchParams, "markets");
  try {
    return await cachedProxyFetch(
      `markets:${filtered}`,
      "EVENTS_LIST",
      () =>
        fetch(`${GAMMA_API_URL}/markets?${filtered}`, {
          headers: { "Accept": "application/json" },
        })
    );
  } catch {
    return NextResponse.json({ error: "Failed to fetch markets" }, { status: 500 });
  }
}
