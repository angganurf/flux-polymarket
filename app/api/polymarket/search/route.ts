import { NextRequest, NextResponse } from "next/server";
import { GAMMA_API_URL } from "@/lib/utils/constants";
import { cachedProxyFetch } from "@/lib/api/cached-fetch";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") || "";
  try {
    return await cachedProxyFetch(
      `search:${q}`,
      "SEARCH",
      () =>
        fetch(`${GAMMA_API_URL}/public-search?q=${encodeURIComponent(q)}`, {
          headers: { "Accept": "application/json" },
        })
    );
  } catch {
    return NextResponse.json({ error: "Failed to search" }, { status: 500 });
  }
}
