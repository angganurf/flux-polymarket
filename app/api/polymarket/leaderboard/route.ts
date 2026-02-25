import { NextRequest, NextResponse } from "next/server";
import { DATA_API_URL } from "@/lib/utils/constants";
import { filterProxyParams } from "@/lib/api/proxy-params";
import { cachedProxyFetch } from "@/lib/api/cached-fetch";

export async function GET(request: NextRequest) {
  const filtered = filterProxyParams(request.nextUrl.searchParams, "leaderboard");
  try {
    return await cachedProxyFetch(
      `leaderboard:${filtered}`,
      "LEADERBOARD",
      () =>
        fetch(`${DATA_API_URL}/v1/leaderboard?${filtered}`, {
          headers: { "Accept": "application/json" },
        })
    );
  } catch {
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
