import { NextRequest, NextResponse } from "next/server";
import { GAMMA_API_URL } from "@/lib/utils/constants";
import { isValidSlug } from "@/lib/api/proxy-params";
import { cachedProxyFetch } from "@/lib/api/cached-fetch";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!isValidSlug(slug)) {
    return NextResponse.json({ error: "Invalid slug format" }, { status: 400 });
  }
  try {
    return await cachedProxyFetch(
      `event:${slug}`,
      "EVENT_DETAIL",
      () =>
        fetch(`${GAMMA_API_URL}/events/slug/${encodeURIComponent(slug)}`, {
          headers: { "Accept": "application/json" },
        })
    );
  } catch {
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 });
  }
}
