import { useQuery } from "@tanstack/react-query";
import { fetchEventBySlug } from "@/lib/api/gamma";
import { fetchOrderBook, fetchPriceHistory } from "@/lib/api/clob";
import { fetchOpenInterest } from "@/lib/api/data";

export function useEventDetail(slug: string) {
  return useQuery({
    queryKey: ["event", slug],
    queryFn: () => fetchEventBySlug(slug),
    staleTime: 30_000,
  });
}

export function useOrderBook(tokenId: string | undefined) {
  return useQuery({
    queryKey: ["orderbook", tokenId],
    queryFn: () => fetchOrderBook(tokenId!),
    enabled: !!tokenId,
    staleTime: 10_000,
    refetchInterval: 10_000,
  });
}

export function usePriceHistory(
  tokenId: string | undefined,
  interval: string = "max",
  fidelity: number = 60
) {
  return useQuery({
    queryKey: ["price-history", tokenId, interval, fidelity],
    queryFn: () => fetchPriceHistory(tokenId!, interval, fidelity),
    enabled: !!tokenId,
    staleTime: 60_000,
  });
}

export function useOpenInterest(conditionId: string | undefined) {
  return useQuery({
    queryKey: ["open-interest", conditionId],
    queryFn: () => fetchOpenInterest(conditionId!),
    enabled: !!conditionId,
    staleTime: 60_000,
  });
}
