import { NextResponse } from "next/server";
import { apiCache, CACHE_TTL } from "@/lib/cache";

type TTLKey = keyof typeof CACHE_TTL;

export async function cachedProxyFetch(
  cacheKey: string,
  ttlKey: TTLKey,
  fetchFn: () => Promise<Response>
): Promise<NextResponse> {
  // Check cache
  const cached = apiCache.get<unknown>(cacheKey);
  if (cached) {
    return NextResponse.json(cached, {
      headers: { "X-Cache": "HIT" },
    });
  }

  // Fetch from upstream
  const res = await fetchFn();
  if (!res.ok) {
    return NextResponse.json(
      { error: "Upstream error" },
      { status: res.status }
    );
  }

  const data = await res.json();

  // Store in cache
  apiCache.set(cacheKey, data, CACHE_TTL[ttlKey]);

  return NextResponse.json(data, {
    headers: { "X-Cache": "MISS" },
  });
}
