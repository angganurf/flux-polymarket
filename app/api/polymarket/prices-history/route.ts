import { NextRequest, NextResponse } from "next/server";
import { CLOB_API_URL } from "@/lib/utils/constants";
import { filterProxyParams } from "@/lib/api/proxy-params";
import { cachedProxyFetch } from "@/lib/api/cached-fetch";

export async function GET(request: NextRequest) {
  const filtered = filterProxyParams(request.nextUrl.searchParams, "prices-history");
  try {
    return await cachedProxyFetch(
      `prices:${filtered}`,
      "PRICES_HISTORY",
      () =>
        fetch(`${CLOB_API_URL}/prices-history?${filtered}`, {
          headers: { "Accept": "application/json" },
        })
    );
  } catch {
    return NextResponse.json({ error: "Failed to fetch price history" }, { status: 500 });
  }
}
