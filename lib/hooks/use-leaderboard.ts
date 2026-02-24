import { useQuery } from "@tanstack/react-query";
import { fetchLeaderboard } from "@/lib/api/data";

export function useLeaderboard(params?: {
  category?: string;
  timePeriod?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ["leaderboard", params],
    queryFn: () => fetchLeaderboard(params),
    staleTime: 60_000,
  });
}
