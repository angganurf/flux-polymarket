import type { LeaderboardEntry, OpenInterest } from "./types";
import { dataUrl } from "./fetch-helper";

export async function fetchLeaderboard(params?: {
  category?: string;
  timePeriod?: string;
  limit?: number;
  offset?: number;
}): Promise<LeaderboardEntry[]> {
  const searchParams = new URLSearchParams();
  if (params?.category) searchParams.set("category", params.category);
  if (params?.timePeriod) searchParams.set("timePeriod", params.timePeriod);
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.offset) searchParams.set("offset", String(params.offset));

  const res = await fetch(dataUrl("/v1/leaderboard", searchParams.toString()));
  if (!res.ok) throw new Error(`Data API error: ${res.status}`);
  return res.json();
}

export async function fetchOpenInterest(conditionId: string): Promise<OpenInterest[]> {
  const res = await fetch(dataUrl("/oi", `market=${conditionId}`));
  if (!res.ok) throw new Error(`Data API error: ${res.status}`);
  return res.json();
}
