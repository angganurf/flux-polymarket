import type { GammaEvent, GammaMarket, GammaTag, ParsedEvent, ParsedMarket } from "./types";
import { gammaUrl } from "./fetch-helper";

function parseMarket(m: GammaMarket): ParsedMarket {
  let outcomes: string[] = [];
  let outcomePrices: number[] = [];
  let clobTokenIds: string[] = [];

  try { outcomes = JSON.parse(m.outcomes || "[]"); } catch { outcomes = ["Yes", "No"]; }
  try { outcomePrices = JSON.parse(m.outcomePrices || "[]").map(Number); } catch { outcomePrices = [0, 0]; }
  try { clobTokenIds = JSON.parse(m.clobTokenIds || "[]"); } catch { clobTokenIds = []; }

  return {
    id: m.id,
    question: m.question,
    slug: m.slug,
    conditionId: m.conditionId,
    description: m.description,
    category: m.category,
    image: m.image || "",
    icon: m.icon || "",
    outcomes,
    outcomePrices,
    clobTokenIds,
    yesPrice: outcomePrices[0] ?? 0,
    noPrice: outcomePrices[1] ?? 0,
    volume: m.volumeNum,
    volume24h: m.volume24hr,
    liquidity: m.liquidityNum,
    priceChange24h: m.oneDayPriceChange,
    priceChange1w: m.oneWeekPriceChange,
    active: m.active,
    closed: m.closed,
    featured: m.featured,
    endDate: m.endDate,
    resolutionSource: m.resolutionSource,
  };
}

function parseEvent(e: GammaEvent): ParsedEvent {
  return {
    id: e.id,
    title: e.title,
    slug: e.slug,
    description: e.description,
    volume: e.volume,
    volume24h: e.volume24hr,
    liquidity: e.liquidity,
    active: e.active,
    closed: e.closed,
    featured: e.featured,
    markets: (e.markets || []).map(parseMarket),
    tags: e.tags || [],
  };
}

export async function fetchEvents(params?: {
  active?: boolean;
  closed?: boolean;
  limit?: number;
  offset?: number;
  order?: string;
  ascending?: boolean;
  tag_id?: number;
  tag?: string;
}): Promise<ParsedEvent[]> {
  const searchParams = new URLSearchParams();
  if (params?.active !== undefined) searchParams.set("active", String(params.active));
  if (params?.closed !== undefined) searchParams.set("closed", String(params.closed));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.offset) searchParams.set("offset", String(params.offset));
  if (params?.order) searchParams.set("order", params.order);
  if (params?.ascending !== undefined) searchParams.set("ascending", String(params.ascending));
  if (params?.tag_id) searchParams.set("tag_id", String(params.tag_id));
  if (params?.tag) searchParams.set("tag", params.tag);

  const res = await fetch(gammaUrl("/events", searchParams.toString()));
  if (!res.ok) throw new Error(`Gamma API error: ${res.status}`);
  const data: GammaEvent[] = await res.json();
  return data.map(parseEvent);
}

export async function fetchEventBySlug(slug: string): Promise<ParsedEvent> {
  const res = await fetch(gammaUrl(`/events/slug/${slug}`));
  if (!res.ok) throw new Error(`Gamma API error: ${res.status}`);
  const data: GammaEvent = await res.json();
  return parseEvent(data);
}

export async function fetchMarkets(params?: {
  active?: boolean;
  closed?: boolean;
  limit?: number;
  offset?: number;
  order?: string;
  ascending?: boolean;
  tag_id?: number;
}): Promise<ParsedMarket[]> {
  const searchParams = new URLSearchParams();
  if (params?.active !== undefined) searchParams.set("active", String(params.active));
  if (params?.closed !== undefined) searchParams.set("closed", String(params.closed));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.offset) searchParams.set("offset", String(params.offset));
  if (params?.order) searchParams.set("order", params.order);
  if (params?.ascending !== undefined) searchParams.set("ascending", String(params.ascending));
  if (params?.tag_id) searchParams.set("tag_id", String(params.tag_id));

  const res = await fetch(gammaUrl("/markets", searchParams.toString()));
  if (!res.ok) throw new Error(`Gamma API error: ${res.status}`);
  const data: GammaMarket[] = await res.json();
  return data.map(parseMarket);
}

export async function fetchMarketBySlug(slug: string): Promise<ParsedMarket> {
  const res = await fetch(gammaUrl(`/markets/slug/${slug}`));
  if (!res.ok) throw new Error(`Gamma API error: ${res.status}`);
  const data: GammaMarket = await res.json();
  return parseMarket(data);
}

export async function searchMarkets(query: string): Promise<ParsedEvent[]> {
  const res = await fetch(gammaUrl("/public-search", `q=${encodeURIComponent(query)}`));
  if (!res.ok) throw new Error(`Gamma API error: ${res.status}`);
  const data = await res.json();
  return (data.events || []).map(parseEvent);
}

export async function fetchTags(): Promise<GammaTag[]> {
  const res = await fetch(gammaUrl("/tags"));
  if (!res.ok) throw new Error(`Gamma API error: ${res.status}`);
  return res.json();
}
