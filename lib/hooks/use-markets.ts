import { useQuery } from "@tanstack/react-query";
import { fetchEvents, fetchMarkets, searchMarkets, fetchTags } from "@/lib/api/gamma";

export function useEvents(params?: {
  active?: boolean;
  closed?: boolean;
  limit?: number;
  offset?: number;
  order?: string;
  ascending?: boolean;
  tag_id?: number;
  tag?: string;
}) {
  return useQuery({
    queryKey: ["events", params],
    queryFn: () => fetchEvents(params),
    staleTime: 30_000,
  });
}

export function useMarkets(params?: {
  active?: boolean;
  closed?: boolean;
  limit?: number;
  offset?: number;
  order?: string;
  ascending?: boolean;
  tag_id?: number;
}) {
  return useQuery({
    queryKey: ["markets", params],
    queryFn: () => fetchMarkets(params),
    staleTime: 30_000,
  });
}

export function useMarketSearch(query: string) {
  return useQuery({
    queryKey: ["market-search", query],
    queryFn: () => searchMarkets(query),
    enabled: query.length > 1,
    staleTime: 60_000,
  });
}

export function useTags() {
  return useQuery({
    queryKey: ["tags"],
    queryFn: fetchTags,
    staleTime: 5 * 60_000,
  });
}
